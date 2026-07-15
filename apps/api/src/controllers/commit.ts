import { Request, Response, NextFunction } from 'express';
import GitService from '../services/gitService.js';
import repositoryStore from '../services/repositoryStore.js';
import { BadRequestError } from '../utils/errors.js';

const gitService = new GitService();

export const getCommitDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { hash } = req.params as { hash: string };

    // Get currently active repository
    const activeRepo = repositoryStore.getActiveRepository();
    if (!activeRepo) {
      throw new BadRequestError('No active repository selected. Please import a repository first.');
    }

    // Retrieve commit details
    const commit = await gitService.getCommit(activeRepo.path, hash);

    res.status(200).json({
      success: true,
      data: commit,
    });
  } catch (err) {
    next(err);
  }
};
