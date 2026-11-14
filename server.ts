import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import payfastRouter from './src/server/payfastRouter.ts';
import emailRouter from './src/server/emailRouter.ts';

import { exec } from 'child_process';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Required middlewares with 50mb limit (for PayFast callbacks, webhooks, and uploads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // PayFast API routes
  app.use('/api/payfast', payfastRouter);

  // Email API routes (Xneelo SMTP Welcome letter & notifications)
  app.use('/api/email', emailRouter);

  // Gemini Search Grounding & Coach GIM Dialogue API
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          answer: null,
          fallback: true,
          message: 'GEMINI_API_KEY not set on server. Using grounded fallback logic.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are Coach GIM, the gentle, non-judgmental business coach and strategic advisor for the bizzbean workstation.
Creed: "infinite wisdom. instant viability. always on."
The user is building or operating an entrepreneurial venture across the 4 stages: vi-ability (Stage 01), fund-ability (Stage 02), sustain-ability (Stage 03), invest-ability (Stage 04).
You provide rigorous quantitative guidance across the 6 V1 Process Questions:
- WHO: Target customer, economic buyer & end-user clarity
- WHAT: Core problem solved & defensible 10-word value proposition
- WHY: Competitive moat, switching friction & 'why now?'
- WHERE: Channels, distribution hubs & market concentration
- WHEN: Runway milestones, cash conversion & break-even timing
- HOW: Margins (>=65% software, >=38% ops), unit economics, CAC : LTV (>=3.2x)
Use real-time Google Search grounding when current facts, market benchmarks, SARS tax rules (Section 12E, SBC, VAT201), or industry metrics are relevant. Keep your responses structured with clear headings, bullet points, and an actionable Coach Inquiry or Next Step.`;

      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-6)) {
          const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
          const text = h.text || h.content;
          if (text) {
            contents.push({ role, parts: [{ text }] });
          }
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const candidate = response.candidates?.[0];
      const answer = candidate?.content?.parts?.[0]?.text || response.text || '';
      
      const sources: string[] = [];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata?.webSearchQueries) {
        sources.push(...groundingMetadata.webSearchQueries);
      }
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.title) {
            sources.push(chunk.web.title);
          }
        }
      }

      return res.json({
        answer,
        sources: Array.from(new Set(sources)),
        grounded: Boolean(sources.length > 0),
      });
    } catch (err: any) {
      console.error('[Gemini Chat API Error]:', err?.message || err);
      return res.json({
        answer: null,
        fallback: true,
        error: err?.message || 'Gemini processing error',
      });
    }
  });

  app.post('/api/gemini/search', async (req, res) => {
    try {
      const { query, threadHistory } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ answer: null, fallback: true });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const candidate = response.candidates?.[0];
      const answer = candidate?.content?.parts?.[0]?.text || response.text || '';
      const sources: string[] = [];
      if (candidate?.groundingMetadata?.groundingChunks) {
        for (const c of candidate.groundingMetadata.groundingChunks) {
          if (c.web?.title) sources.push(c.web.title);
        }
      }

      return res.json({
        answer,
        sources: Array.from(new Set(sources)),
      });
    } catch (err: any) {
      return res.json({ answer: null, fallback: true, error: err.message });
    }
  });

  // COACH GIM ADVANCED ADVICE SERVICE
  app.post('/api/engagement/gim-advice', async (req, res) => {
    try {
      const { pageId, pageTitle, businessName, businessType, adviceType } = req.body;

      if (!pageId || !adviceType) {
        return res.status(400).json({ error: 'pageId and adviceType are required parameters.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const bizName = businessName || 'Your Startup';
      const bizType = businessType || 'Private Enterprise';

      // Predefined Premium Fallbacks if Gemini key is missing
      if (!apiKey) {
        console.warn('GEMINI_API_KEY not found for Coach GIM Advice. Returning premium mock content.');

        let markdown = '';
        let organogram: { title: string; nodes: Array<{ id: string; label: string; description: string; parentId: string | null }> } | undefined = undefined;

        if (adviceType === 'statistical') {
          markdown = `### 📊 Premium Statistical & Market Research: ${pageTitle || pageId}\n\n` +
            `As your venture **${bizName}** (${bizType}) develops its **${pageTitle || pageId}** strategy, the following authoritative economic & benchmark datasets guide robust institutional projections:\n\n` +
            `#### 1. Sector Market Benchmarks & Demand Trends\n` +
            `- **Projected Industry CAGR (2025–2029):** \`14.8%\` sustained compound annual growth in targeted private commercial adoption.\n` +
            `- **Customer Acquisition Efficiency (Benchmark):** Top quartile ventures achieve a \`CAC Payback < 5.5 months\` and LTV:CAC ratio of \`3.8x\`.\n` +
            `- **Gross Profit Margin Band:** High-performing enterprises within this industry maintain gross margins between \`58% – 72%\` after direct logistics.\n\n` +
            `#### 2. Key Risk & Stress-Test Variables\n` +
            `- **Working Capital Lag:** Average SME B2B collection days currently sit at \`45 days\` in South African commerce.\n` +
            `- **Regulatory Compliance Weight:** Account for \`1.2% – 1.8%\` of operational revenue toward statutory audit, safety, and cyber-security alignment.`;
        } else if (adviceType === 'organogram') {
          markdown = `### 🧬 Recommended Human Resource Structure: ${bizName}\n\n` +
            `Below is an institutional multi-layered reporting architecture engineered for your operational governance and scalability.`;
          organogram = {
            title: `${bizName} - Executive Reporting Hierarchy`,
            nodes: [
              { id: '1', label: 'Board of Directors / Founders', description: 'Strategic oversight, governance, risk & capital allocation', parentId: null },
              { id: '2', label: 'Chief Executive Officer (CEO)', description: 'Overall venture vision, investor relations & executive command', parentId: '1' },
              { id: '3', label: 'Head of Operations & Production', description: 'Supply chain, quality management, production SLAs & delivery', parentId: '2' },
              { id: '4', label: 'Chief Financial Officer (CFO)', description: 'Liquidity governance, budgets, treasury, compliance & audit', parentId: '2' },
              { id: '5', label: 'Head of Growth & Customers', description: 'Marketing acquisition, enterprise accounts & retention loops', parentId: '2' },
              { id: '6', label: 'Quality & Procurement Leads', description: 'Supplier audit, cost efficiency & logistics compliance', parentId: '3' },
              { id: '7', label: 'Finance & Compliance Analysts', description: 'AR/AP control, monthly statutory filings & treasury', parentId: '4' },
            ],
          };
        } else if (adviceType === 'calculator') {
          markdown = `### 🧮 Market Share & Unit Economic Guidance\n\n` +
            `Use the **Live Simulator** above to verify your target Total Addressable Market (TAM) capture for **${bizName}**. We recommend targeting \`0.5% – 2.5%\` realistic year-1 penetration for defensible institutional backing.`;
        } else if (adviceType === 'policies') {
          markdown = `### 📜 Standard Policy & Governance Blueprint: ${pageTitle || pageId}\n\n` +
            `To score maximum viability points on this section, your **${bizName}** operations manual must document the following enforceable corporate policies:\n\n` +
            `1. **Formal Delegation of Authority Matrix**\n   - Specifies financial thresholds for purchase orders, contract approvals, and credit issuance.\n` +
            `2. **Standard Operating Procedures (SOP) & Audit Controls**\n   - Documented tracking mechanisms ensuring seamless operational repeatability.\n` +
            `3. **Compliance & Statutory Governance Policy**\n   - Ensures strict alignment with CIPC, SARS, and sector-specific regulatory legislation.\n` +
            `4. **Data Privacy & Protection Policy (POPIA / GDPR)**\n   - Mandates encryption, user consent logs, and incident response escalation windows (<24 hours).`;
        } else if (adviceType === 'reading') {
          markdown = `### 📚 Curated Executive Reading & Development Resources\n\n` +
            `Elevate the institutional readiness of **${bizName}** with these targeted frameworks on **${pageTitle || pageId}**:\n\n` +
            `- 📖 **"Venture Deals" by Brad Feld & Jason Mendelson** — *Essential mechanics for investor terms, governance, and capital deployment.*\n` +
            `- 📖 **"The Lean Startup" by Eric Ries** — *Actionable scientific methods for iterative validation and efficient cost scaling.*\n` +
            `- 🌐 **Harvard Business Review (HBR): Strategic Capital & Growth** — *Deep analysis of working capital management in developing markets.*\n` +
            `- 🏛️ **King IV Report on Corporate Governance** — *Authoritative benchmark for corporate accountability, reporting & ethical leadership.*`;
        } else if (adviceType === 'advisors') {
          markdown = `### 🤝 Recommended External Advisors & Strategic Service Providers\n\n` +
            `Before presenting **${bizName}** to institutional lenders or venture investors, align with specialized external partners:\n\n` +
            `- **Chartered Accountants & Statutory Auditors (SAICA)** — *For clean IFRS-compliant multi-year financial audits & tax validation.*\n` +
            `- **Corporate & Commercial Legal Counsel** — *To formalize shareholder agreements, IP registrations, and bespoke client SLA contracts.*\n` +
            `- **Sector Compliance & Risk Assessors** — *To certify operational premises, environmental impact, and regulatory adherence.*\n` +
            `- **Non-Executive Industry Advisors** — *High-network veterans offering direct B2B market introductions and strategic board critique.*`;
        }

        return res.json({ markdown, organogram });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const systemPrompt = `You are Coach GIM, an executive business advisor, institutional strategist, and startup turnaround specialist inside BizzPlan.
You provide exhaustive, authoritative, real-world corporate advice tailored precisely to the user's business:
- Business Name: ${bizName}
- Business Type / Industry: ${bizType}
- Active Business Plan Module: ${pageTitle || pageId}
- Requested Advisory Mode: ${adviceType}

OUTPUT REQUIREMENTS:
1. Return a valid JSON object matching this exact schema:
   {
     "markdown": "Detailed, richly formatted markdown with headings (###, ####), bullet lists, bold callouts, and realistic sector statistics",
     "organogram": {
       "title": "Executive Organogram Title",
       "nodes": [
         { "id": "1", "label": "Node Name", "description": "Brief role scope", "parentId": null }
       ]
     }
   }
2. Note on "organogram": ONLY populate the "organogram" object if Requested Advisory Mode is "organogram". Otherwise omit it or set it to null.
3. For "statistical", provide realistic macroeconomic indicators, industry benchmarks (CAGR, LTV:CAC, Gross Margin %, working capital days), and customer behavior metrics relevant to this business type and section.
4. For "policies", deliver an authoritative corporate policy framework checklist and templates relevant to the active module (${pageTitle || pageId}).
5. For "reading", list top-tier executive books, authoritative reports, and research briefs.
6. For "advisors", detail specific qualified external advisors, certifications, and roles needed for institutional funding readiness.
7. Maintain a refined, authoritative, and objective tone.`;

      const prompt = `Generate comprehensive ${adviceType} advisory guidance for ${bizName} (${bizType}) focusing on their Business Plan section: ${pageTitle || pageId}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      let parsed: any = { markdown: text || 'Advice generated successfully.' };

      try {
        if (text) {
          const cleanJson = text.replace(/```json\n?|```/g, '').trim();
          const jsonStart = cleanJson.indexOf('{');
          const jsonEnd = cleanJson.lastIndexOf('}');
          const extracted = jsonStart !== -1 && jsonEnd !== -1 ? cleanJson.slice(jsonStart, jsonEnd + 1) : cleanJson;
          parsed = JSON.parse(extracted);
        }
      } catch (e) {
        console.warn('Could not parse JSON directly from Coach GIM Advice model, wrapping markdown cleanly:', e);
        parsed = { markdown: text };
      }

      return res.json(parsed);
    } catch (error: any) {
      console.error('Coach GIM Advice endpoint error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate Coach GIM advice.' });
    }
  });

  // Build queue lock to prevent concurrent build exhaustion
  let isBuilding = false;
  let buildPending = false;
  const triggerBundleRebuild = () => {
    // Only rebuild in production; in development Vite middleware handles HMR
    if (process.env.NODE_ENV !== 'production') return;
    if (isBuilding) {
      buildPending = true;
      return;
    }
    isBuilding = true;
    buildPending = false;
    exec('npm run build', (buildErr, stdout, stderr) => {
      isBuilding = false;
      if (buildErr) {
        console.error('[CMS Build] Build error:', buildErr, stderr);
      } else {
        console.log('[CMS Build] Successfully rebuilt production bundle in dist/.');
      }
      if (buildPending) {
        triggerBundleRebuild();
      }
    });
  };

  // CMS Console Export & Continuous Auto-Sync Route
  app.post('/api/cms/save-file', (req, res) => {
    try {
      const { fileContent, jsonPayload } = req.body;
      if (!fileContent || typeof fileContent !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid or missing fileContent' });
      }

      // 1. Primary TypeScript destination: src/data/cmsConsoleData.ts
      const targetTsPath = path.resolve(__dirname, 'src', 'data', 'cmsConsoleData.ts');
      fs.writeFileSync(targetTsPath, fileContent, 'utf-8');

      // 2. Primary JSON mirror: src/data/cmsBackup.json (high-speed structured recovery)
      const targetJsonPath = path.resolve(__dirname, 'src', 'data', 'cmsBackup.json');
      if (jsonPayload) {
        fs.writeFileSync(targetJsonPath, JSON.stringify(jsonPayload, null, 2), 'utf-8');
      }

      // 3. Rolling timestamped backups in .cms_backups (keeps last 20 revisions)
      const backupDir = path.resolve(__dirname, '.cms_backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupTsPath = path.resolve(backupDir, `cmsConsoleData-${timestamp}.ts`);
      fs.writeFileSync(backupTsPath, fileContent, 'utf-8');

      if (jsonPayload) {
        const backupJsonPath = path.resolve(backupDir, `cmsBackup-${timestamp}.json`);
        fs.writeFileSync(backupJsonPath, JSON.stringify(jsonPayload, null, 2), 'utf-8');
      }

      // Prune old backups beyond 20 entries
      try {
        const files = fs.readdirSync(backupDir);
        if (files.length > 40) {
          files.sort();
          const toDelete = files.slice(0, files.length - 40);
          toDelete.forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
        }
      } catch {}

      console.log(`[CMS Auto-Save] Successfully saved to ${targetTsPath} (${fileContent.length} bytes) at ${new Date().toLocaleTimeString()}.`);

      // Trigger debounced production bundle build if in production
      triggerBundleRebuild();

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        bytesWritten: fileContent.length,
        message: 'Successfully auto-saved to disk and updated backup repository.',
      });
    } catch (err: any) {
      console.error('[CMS Auto-Save] Failed to write cmsConsoleData.ts:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // CMS Restore from Backup Route
  app.get('/api/cms/backups', (_req, res) => {
    try {
      const backupDir = path.resolve(__dirname, '.cms_backups');
      if (!fs.existsSync(backupDir)) {
        return res.json({ backups: [] });
      }
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json') || f.endsWith('.ts'));
      files.sort().reverse();
      return res.json({ backups: files.slice(0, 15) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cms/restore-backup', (req, res) => {
    try {
      const { filename } = req.body;
      const backupDir = path.resolve(__dirname, '.cms_backups');
      const backupPath = path.resolve(backupDir, filename);
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ success: false, error: 'Backup not found' });
      }
      if (filename.endsWith('.ts')) {
        const content = fs.readFileSync(backupPath, 'utf-8');
        const targetTsPath = path.resolve(__dirname, 'src', 'data', 'cmsConsoleData.ts');
        fs.writeFileSync(targetTsPath, content, 'utf-8');
        return res.json({ success: true, message: `Restored ${filename} to src/data/cmsConsoleData.ts` });
      }
      return res.json({ success: false, error: 'Unsupported file type' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Health check route
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Explicit Sitemap Handler: Guarantees text/xml response to Googlebot and web crawlers
  app.get('/sitemap.xml', (_req, res) => {
    res.setHeader('Content-Type', 'text/xml; charset=UTF-8');
    const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      return res.sendFile(sitemapPath);
    }
    const distSitemap = path.resolve(__dirname, 'dist', 'sitemap.xml');
    if (fs.existsSync(distSitemap)) {
      return res.sendFile(distSitemap);
    }
    return res.status(404).send('Sitemap not found');
  });

  // Explicit Robots Handler: Guarantees text/plain response
  app.get('/robots.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      return res.sendFile(robotsPath);
    }
    const distRobots = path.resolve(__dirname, 'dist', 'robots.txt');
    if (fs.existsSync(distRobots)) {
      return res.sendFile(distRobots);
    }
    return res.status(404).send('Robots.txt not found');
  });

  if (process.env.NODE_ENV === 'production') {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist'), {
      maxAge: '1h',
      index: false,
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite dev server middleware in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
