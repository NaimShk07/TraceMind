import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';
import { NotFoundError } from './utils/errors.js';
import logger from './utils/logger.js';

const app = express();
const port = process.env.PORT || 3001;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Mount API Router
app.use(apiRouter);

// Catch-all Unmatched Routes -> 404
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  try {
    const workspaceRoot = path.resolve(__dirname, '../../../');
    const demoPath = path.resolve(workspaceRoot, 'demo-repo');
    const scriptPath = path.resolve(workspaceRoot, 'scripts/setup-demo-repo.ts');

    if (!fs.existsSync(demoPath) || !fs.existsSync(path.join(demoPath, '.git'))) {
      logger.info(`Demo repository not found or not initialized at ${demoPath}. Auto-seeding...`);
      execSync(`pnpm --filter @tracemind/api exec tsx "${scriptPath}"`, {
        cwd: workspaceRoot,
        stdio: 'inherit',
      });
    }
  } catch (err: any) {
    logger.error(`Failed to auto-seed demo repository: ${err.message}`);
  }

  app.listen(port, () => {
    logger.info(`TraceMind API successfully started and listening on port ${port}`);
  });
}

export default app;
