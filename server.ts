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
