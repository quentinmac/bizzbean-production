import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import payfastRouter from './src/server/payfastRouter.ts';
import emailRouter from './src/server/emailRouter.ts';

import { exec } from 'child_process';
import { GoogleGenAI, Type } from '@google/genai';

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

  // CLIENT AI PITCH DECK STUDIO (Notebook-grade structured 10-slide investor/lender deck)
  app.post('/api/gemini/pitch-deck', async (req, res) => {
    try {
      const {
        businessName,
        businessType,
        founderName,
        vision,
        mission,
        audience = 'investor',
        pitch,
        sectionsSummary,
        financialSummary,
      } = req.body || {};

      const ventureName = (businessName || 'Your Venture').trim();
      const ventureType = (businessType || 'Private Enterprise').trim();
      const currency = financialSummary?.currency || 'ZAR';
      const revY1 = Number(financialSummary?.revenue?.[0] || 0);
      const revY3 = Number(financialSummary?.revenue?.[2] || 0);
      const revY5 = Number(financialSummary?.revenue?.[4] || 0);
      const npY5 = Number(financialSummary?.netProfit?.[4] || 0);
      const gpMarginY1 = Number(financialSummary?.gpMargin?.[0] || 0);
      const totalFunding =
        Number(financialSummary?.founderEquity || 0) +
        Number(financialSummary?.investorEquity || 0) +
        Number(financialSummary?.bankLoanAmount || 0);

      const formatCurr = (n: number) =>
        `${currency} ${new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(Math.round(n))}`;

      const buildFallbackDeck = () => {
        const audienceLabel =
          audience === 'lender'
            ? 'Bank & Institutional Lending Memorandum'
            : audience === 'executive'
            ? 'Executive Board Strategy Briefing'
            : 'Institutional Investor Pitch Deck';

        const valueBullets = (pitch?.valueOffer || []).filter((x: string) => x?.trim());
        const revBullets = (pitch?.revenueModel || []).filter((x: string) => x?.trim());
        const outlookBullets = (pitch?.financialOutlook || []).filter((x: string) => x?.trim());
        const compBullets = (pitch?.competitorLandscape || []).filter((x: string) => x?.trim());
        const gtmBullets = (pitch?.getToMarket || []).filter((x: string) => x?.trim());
        const leverBullets = (pitch?.growthLeverFunding || []).filter((x: string) => x?.trim());
        const dealBullets = (pitch?.fundingDeal || []).filter((x: string) => x?.trim());

        return {
          deckTitle: `${ventureName} — ${audienceLabel}`,
          deckSubtitle:
            mission ||
            vision ||
            `Quantitative growth thesis, unit economics, and 5-year execution roadmap for ${ventureName}.`,
          executiveBrief:
            pitch?.elevatorPitch ||
            `${ventureName} (${ventureType}) combines disciplined unit economics with structured 5-year financial modeling to capture durable market share.`,
          slides: [
            {
              slideNumber: 1,
              kicker: '01. Venture Thesis',
              title: `${ventureName}: Institutional Growth Blueprint`,
              keyTakeaway:
                pitch?.elevatorPitch ||
                vision ||
                `${ventureName} delivers disciplined commercial execution backed by live 3-statement financial modeling.`,
              layout: 'hero',
              bullets: [
                `Sector & Legal Mandate: ${ventureType}`,
                vision ? `Long-Term Vision: ${vision}` : 'Built for capital readiness and measurable cash conversion',
                mission ? `Core Mission: ${mission}` : 'Focused on repeatable unit profitability from Year 1',
                founderName ? `Presented by: ${founderName}` : 'Prepared inside the BizzBean Venture Operating System',
              ],
              highlightMetric: {
                label: '5-Year Revenue Horizon',
                value: revY5 > 0 ? formatCurr(revY5) : 'Model Pending',
                context: 'Projected Year 5 annualized turnover from active BizzModel simulation',
              },
              speakerNotes: `Welcome. Today I'm presenting ${ventureName}, a ${ventureType} built on rigorous unit economics and a 5-year cash-flow verified operating plan.`,
            },
            {
              slideNumber: 2,
              kicker: '02. Market Problem',
              title: 'The Structural Gap Customers Need Solved',
              keyTakeaway:
                sectionsSummary?.environment ||
                'Customers face fragmented, high-friction alternatives that waste capital and slow operational execution.',
              layout: 'split',
              bullets: [
                'Incumbent solutions remain slow, opaque, or poorly adapted to local operating realities.',
                'Buyers lose margin and time navigating disconnected workflows and inconsistent quality.',
                sectionsSummary?.customers
                  ? `Customer Discovery Focus: ${sectionsSummary.customers.slice(0, 140)}`
                  : 'Validated buyer demand anchored around speed, reliability, and transparent ROI.',
              ],
              highlightMetric: {
                label: 'Primary Customer Pain',
                value: 'High Friction',
                context: 'Inefficient workflows & margin leakage among underserved buyers',
              },
              speakerNotes: `Across our target market, buyers are underserved by legacy providers. This slide frames the operational pain our product directly removes.`,
            },
            {
              slideNumber: 3,
              kicker: '03. Value Offer',
              title: 'Defensible Product & Differentiated Value',
              keyTakeaway:
                valueBullets[0] ||
                `${ventureName} replaces complexity with a measurable, repeatable customer outcome.`,
              layout: 'split',
              bullets:
                valueBullets.length > 0
                  ? valueBullets.slice(0, 4)
                  : [
                      sectionsSummary?.products || 'Core product engineered for rapid customer onboarding and retention.',
                      'Clear price-to-value advantage driving strong gross margins.',
                      'Repeatable delivery workflow designed to scale without linear headcount bloat.',
                    ],
              highlightMetric: {
                label: 'Year 1 Gross Margin',
                value: gpMarginY1 > 0 ? `${gpMarginY1.toFixed(1)}%` : 'Target >= 55%',
                context: 'Direct contribution margin supporting operating leverage',
              },
              speakerNotes: `Our value offer focuses on concrete customer ROI. Every feature ties directly to faster adoption and protected gross margin.`,
            },
            {
              slideNumber: 4,
              kicker: '04. Go-To-Market',
              title: 'Customer Acquisition & Distribution Engine',
              keyTakeaway:
                gtmBullets[0] ||
                'Targeted channel distribution focused on high-intent buyers and disciplined customer payback.',
              layout: 'split',
              bullets:
                gtmBullets.length > 0
                  ? gtmBullets.slice(0, 4)
                  : [
                      'Direct commercial outreach paired with high-conversion digital funnels.',
                      'Strategic partner channels accelerating credibility and lowering acquisition cost.',
                      'Structured onboarding milestones converting trial buyers into recurring accounts.',
                    ],
              highlightMetric: {
                label: 'Year 1 Revenue Target',
                value: revY1 > 0 ? formatCurr(revY1) : 'Launch Baseline',
                context: 'Initial 12-month commercial ramp from modeled unit assumptions',
              },
              speakerNotes: `Rather than broad, expensive marketing, our go-to-market concentrates on repeatable conversion channels with measurable payback.`,
            },
            {
              slideNumber: 5,
              kicker: '05. Revenue Model',
              title: 'Pricing Architecture & Monetization Mechanics',
              keyTakeaway:
                revBullets[0] ||
                'Disciplined pricing calibrated around cost recovery, statutory VAT clarity, and recurring expansion.',
              layout: 'metrics',
              bullets:
                revBullets.length > 0
                  ? revBullets.slice(0, 4)
                  : [
                      'Transparent unit pricing protecting contribution margin at every volume tier.',
                      'Predictable billing cadence stabilizing monthly working capital.',
                      'Upsell pathways across complementary services as account tenure matures.',
                    ],
              highlightMetric: {
                label: 'Year 3 Scale Milestone',
                value: revY3 > 0 ? formatCurr(revY3) : 'Growth Inflection',
                context: 'Mid-horizon turnover expansion as distribution compounds',
              },
              speakerNotes: `Our revenue mechanics link unit pricing directly to cost recovery and sustainable cash generation from day one.`,
            },
            {
              slideNumber: 6,
              kicker: '06. Competitive Moat',
              title: 'Landscape Positioning & Switching Friction',
              keyTakeaway:
                compBullets[0] ||
                'Positioned in an underserved value quadrant combining speed, local compliance, and execution rigor.',
              layout: 'split',
              bullets:
                compBullets.length > 0
                  ? compBullets.slice(0, 4)
                  : [
                      'Superior responsiveness and tailored local execution compared to rigid global incumbents.',
                      'Lower total cost of ownership versus fragmented manual service providers.',
                      'Cumulative operational data and supplier relationships deepen switching friction over time.',
                    ],
              highlightMetric: {
                label: 'Competitive Advantage',
                value: '3-Statement Sync',
                context: 'Operational discipline and agility outpacing slower legacy players',
              },
              speakerNotes: `Competitors either overcharge with rigid overhead or under-deliver on reliability. Our positioning captures the underserved middle.`,
            },
            {
              slideNumber: 7,
              kicker: '07. Financial Outlook',
              title: '5-Year Quantitative Trajectory & Margin Profile',
              keyTakeaway:
                outlookBullets[0] ||
                `Modeled to scale from ${revY1 > 0 ? formatCurr(revY1) : 'Year 1 launch'} to ${revY5 > 0 ? formatCurr(revY5) : 'Year 5 maturity'} with disciplined cost control.`,
              layout: 'financials',
              bullets:
                outlookBullets.length > 0
                  ? outlookBullets.slice(0, 4)
                  : [
                      `Year 1 Projected Revenue: ${revY1 > 0 ? formatCurr(revY1) : 'Configured in BizzModel'}`,
                      `Year 3 Projected Revenue: ${revY3 > 0 ? formatCurr(revY3) : 'Mid-stage expansion'}`,
                      `Year 5 Projected Revenue: ${revY5 > 0 ? formatCurr(revY5) : 'Long-term target'}`,
                      `Year 5 Net Profit After Tax: ${npY5 !== 0 ? formatCurr(npY5) : 'Positive cash retention'}`,
                    ],
              highlightMetric: {
                label: 'Year 5 Net Profit',
                value: npY5 !== 0 ? formatCurr(npY5) : 'Operating Leverage',
                context: 'Bottom-line earnings after operating expenses, interest, and tax',
              },
              speakerNotes: `Every figure on this slide pulls directly from our integrated 60-month financial engine across Income Statement, Balance Sheet, and Cash Flow.`,
            },
            {
              slideNumber: 8,
              kicker: '08. Team & Governance',
              title: 'Leadership, Controls & Operational Readiness',
              keyTakeaway:
                sectionsSummary?.employees ||
                'Lean leadership team supported by clear statutory governance and staged hiring triggers.',
              layout: 'split',
              bullets: [
                sectionsSummary?.governance || 'Defined board oversight, delegation of authority, and statutory compliance cadence.',
                sectionsSummary?.infrastructure || 'Right-sized physical and digital infrastructure aligned to revenue milestones.',
                sectionsSummary?.systems || 'Core financial, reporting, and operational systems integrated for auditability.',
              ],
              highlightMetric: {
                label: 'Governance Standard',
                value: 'Audit Ready',
                context: 'Structured COA controls, CIPC/SARS alignment, and monthly tracking',
              },
              speakerNotes: `Capital only compounds when governance is tight. Hiring and fixed overhead scale strictly against verified revenue triggers.`,
            },
            {
              slideNumber: 9,
              kicker: '09. Growth Capital',
              title: 'Capital Deployment & Acceleration Levers',
              keyTakeaway:
                leverBullets[0] ||
                'Funding acts directly as a high-leverage catalyst for revenue capacity, working capital, and distribution.',
              layout: 'split',
              bullets:
                leverBullets.length > 0
                  ? leverBullets.slice(0, 4)
                  : [
                      'Accelerate customer acquisition across highest-converting commercial channels.',
                      'Fund essential productive assets and inventory buffers to eliminate delivery bottlenecks.',
                      'Maintain prudent liquidity buffer across the initial cash conversion cycle.',
                    ],
              highlightMetric: {
                label: 'Modeled Capital Base',
                value: totalFunding > 0 ? formatCurr(totalFunding) : 'Staged Allocation',
                context: 'Combined founder equity, investor capital, and structured debt facilities',
              },
              speakerNotes: `Every Rand of capital deployed maps to a clear operational bottleneck removal or revenue multiplier inside our model.`,
            },
            {
              slideNumber: 10,
              kicker: '10. The Ask & Deal',
              title: 'Partnership Structure & Next Milestones',
              keyTakeaway:
                dealBullets[0] ||
                `Structured ${audience === 'lender' ? 'debt coverage' : 'investment'} opportunity anchored in transparent 5-year reporting.`,
              layout: 'ask',
              bullets:
                dealBullets.length > 0
                  ? dealBullets.slice(0, 4)
                  : [
                      'Milestone 1 (Months 1–6): Commercial launch, initial anchor customers, and working capital discipline.',
                      'Milestone 2 (Months 7–18): Channel repeatability and positive monthly operating cash flow.',
                      'Milestone 3 (Years 2–5): Multi-year margin expansion and institutional value creation.',
                    ],
              highlightMetric: {
                label: audience === 'lender' ? 'Repayment Resilience' : 'Investor Alignment',
                value: revY5 > 0 ? formatCurr(revY5) : '5-Yr Roadmap',
                context: 'Full 3-statement data room and monthly variance reporting ready on request',
              },
              speakerNotes: `Thank you for your time. Our complete 5-year financial model and supporting business plan data room are ready for detailed due diligence.`,
            },
          ],
        };
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          deck: buildFallbackDeck(),
          generatedBy: 'grounded-fallback',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const audienceDirective =
        audience === 'lender'
          ? 'Bank & DFI Lenders (emphasize cash flow coverage, collateral/fixed assets, working capital cycle, DSCR resilience, and downside risk protection)'
          : audience === 'executive'
          ? 'Executive Board & Strategic Partners (emphasize operational execution, KPI governance, unit economics, and 5-year strategic milestones)'
          : 'Venture / Angel / Equity Investors (emphasize asymmetric problem-solution fit, market capture, scalable unit economics, competitive moat, and 5-year return trajectory)';

      const systemInstruction = `You are an elite institutional investment banker and executive presentation architect (producing NotebookLM-grade investor pitch decks).
Your task is to synthesize a client's real business plan data and 5-year quantitative financial simulation into a sharp, cohesive 10-slide presentation.

Audience Target: ${audienceDirective}

Strict Quality Rules:
1. Produce EXACTLY 10 slides following this arc:
   01. Venture Thesis (layout: "hero")
   02. Market Problem (layout: "split")
   03. Value Offer & Solution (layout: "split")
   04. Go-To-Market Engine (layout: "split")
   05. Revenue Model & Unit Economics (layout: "metrics")
   06. Competitive Landscape & Moat (layout: "split")
   07. 5-Year Financial Outlook (layout: "financials")
   08. Team, Systems & Governance (layout: "split")
   09. Capital Deployment & Growth Levers (layout: "split")
   10. The Ask, Deal & Milestones (layout: "ask")
2. Use the client's ACTUAL business name, vision, mission, pitch bullets, section context, and 5-year financial figures provided in the prompt. NEVER invent fake revenue figures that contradict the supplied numbers. If modeled revenue is 0, frame financials cleanly around unit assumptions & capital deployment milestones without fabricating fake historical sales.
3. Keep copy crisp, punchy, and presentation-ready:
   - title: max 9 words, vivid executive headline
   - keyTakeaway: 1 razor-sharp synthesis sentence summarizing the slide's core insight
   - bullets: 3–4 concise, concrete points (no fluff, no filler)
   - speakerNotes: 2–3 natural first-person sentences the founder can speak aloud when presenting the slide.
4. Keep currency formatting aligned to ${currency}.`;

      const contextPayload = {
        businessName: ventureName,
        businessType: ventureType,
        founderName: founderName || 'Founder',
        vision: vision || '',
        mission: mission || '',
        audience,
        pitch: pitch || {},
        sectionsSummary: sectionsSummary || {},
        financialSummary: financialSummary || {},
      };

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Synthesize a 10-slide executive pitch deck from this client venture dossier:\n\n${JSON.stringify(contextPayload, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              deckTitle: { type: Type.STRING, description: 'Concise presentation title including business name.' },
              deckSubtitle: { type: Type.STRING, description: 'One-sentence executive positioning statement.' },
              executiveBrief: { type: Type.STRING, description: '2-sentence high-level summary of the venture.' },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideNumber: { type: Type.INTEGER },
                    kicker: { type: Type.STRING, description: 'Numbered chapter label e.g. 01. Venture Thesis' },
                    title: { type: Type.STRING, description: 'Crisp executive headline (max 9 words).' },
                    keyTakeaway: { type: Type.STRING, description: 'Single-sentence synthesis insight.' },
                    layout: { type: Type.STRING, description: 'One of: hero, split, metrics, financials, ask' },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    highlightMetric: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING },
                        context: { type: Type.STRING },
                      },
                    },
                    speakerNotes: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.json({
          deck: buildFallbackDeck(),
          generatedBy: 'grounded-fallback',
        });
      }

      const parsedDeck = JSON.parse(rawText);
      if (!parsedDeck || !Array.isArray(parsedDeck.slides) || parsedDeck.slides.length === 0) {
        return res.json({
          deck: buildFallbackDeck(),
          generatedBy: 'grounded-fallback',
        });
      }

      return res.json({
        deck: parsedDeck,
        generatedBy: 'gemini-4-hydrogen',
      });
    } catch (error: any) {
      console.error('Gemini Pitch Deck synthesis error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to synthesize pitch deck.',
      });
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

  // Public runtime analytics configuration (resolves Measurement ID injected at runtime via Secrets/Cloud Run)
  app.get('/api/config/analytics', (_req, res) => {
    const candidates = [
      process.env.VITE_GA_MEASUREMENT_ID,
      process.env.VITE_GA_MEASUREMENT,
      process.env.GA_MEASUREMENT_ID,
    ];
    const validRegex = /^(G|AW)-[A-Z0-9]{4,}$/i;
    const resolved =
      candidates
        .map((v) => (v || '').trim().replace(/^["']|["']$/g, ''))
        .find((v) => v && v.toUpperCase() !== 'G-XXXXXXXXXX' && validRegex.test(v)) || '';
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      configured: Boolean(resolved),
      measurementId: resolved || null,
    });
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
