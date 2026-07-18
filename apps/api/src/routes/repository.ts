import { Router } from 'express';
import {
  importRepository,
  getRepositoryDetails,
  getActiveRepository,
  getRepositoryCommits,
} from '../controllers/repository.js';

const router = Router();

router.post('/import', importRepository);
router.get('/active', getActiveRepository);
router.get('/:id/commits', getRepositoryCommits);
router.get('/:id', getRepositoryDetails);

export default router;
