import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';
import { NotFoundError } from './utils/errors.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

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

// Start Server
app.listen(port, () => {
  logger.info(`TraceMind API successfully started and listening on port ${port}`);
});

export default app;
