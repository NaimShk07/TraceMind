import { Router } from 'express';
import healthRouter from './health.js';
import repositoryRouter from './repository.js';
import commitRouter from './commit.js';
import chatRouter from './chat.js';

const router = Router();

// Mount sub-routers
router.use('/health', healthRouter);
router.use('/repositories', repositoryRouter);
router.use('/commits', commitRouter);
router.use('/chat', chatRouter);

export default router;
