import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import payfastRouter from './src/server/payfastRouter.ts';

import { exec } from 'child_process';

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

  // Build queue lock to prevent concurrent build exhaustion
  let isBuilding = false;
  let buildPending = false;
  const triggerBundleRebuild = () => {
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

  // CMS Console Export & Sync Route (syncs to disk and auto-rebuilds production bundle)
  app.post('/api/cms/save-file', (req, res) => {
    try {
      const { fileContent } = req.body;
      if (!fileContent || typeof fileContent !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid or missing fileContent' });
      }
      const targetPath = path.resolve(__dirname, 'src', 'data', 'cmsConsoleData.ts');
      fs.writeFileSync(targetPath, fileContent, 'utf-8');
      console.log(`[CMS Export] Successfully synced to ${targetPath} (${fileContent.length} bytes).`);

      // Trigger debounced production bundle build in background
      triggerBundleRebuild();

      return res.json({ success: true, message: 'Updated src/data/cmsConsoleData.ts on disk and queued bundle rebuild.' });
    } catch (err: any) {
      console.error('[CMS Export] Failed to write cmsConsoleData.ts:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Health check route
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
