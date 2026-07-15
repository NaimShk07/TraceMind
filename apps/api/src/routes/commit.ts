import { Router } from 'express';
import { getCommitDetails } from '../controllers/commit.js';

const router = Router();

router.get('/:hash', getCommitDetails);

export default router;
