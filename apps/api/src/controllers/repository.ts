import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ImportRepositorySchema } from '../schemas/repository.js';
import GitService from '../services/gitService.js';
import repositoryStore from '../services/repositoryStore.js';
import { NotFoundError } from '../utils/errors.js';
import type { RepositoryDetails } from '@tracemind/shared';

const gitService = new GitService();

export const importRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validated = ImportRepositorySchema.parse(req.body);
    const repoPath = validated.path;

    // Check directory and Git metadata using GitService
    const info = await gitService.getRepositoryInfo(repoPath);

    // Create a unique deterministic MD5 hash for the repositoryId
    const repositoryId = crypto.createHash('md5').update(repoPath).digest('hex');

    const details: RepositoryDetails = {
      repositoryId,
      name: info.name,
      branch: info.branch,
      path: repoPath,
      createdAt: new Date().toISOString(),
    };

    // Store in active workspace memory cache
    repositoryStore.addRepository(details);

    res.status(200).json({
      success: true,
      data: {
        repositoryId: details.repositoryId,
        name: details.name,
        branch: details.branch,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRepositoryDetails = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const repo = repositoryStore.getRepository(id);

    if (!repo) {
      throw new NotFoundError(`Repository with ID "${id}" not found`);
    }

    res.status(200).json({
      success: true,
      data: repo,
    });
  } catch (err) {
    next(err);
  }
};

export const getActiveRepository = (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = repositoryStore.getActiveRepository();

    res.status(200).json({
      success: true,
      data: repo || null,
    });
  } catch (err) {
    next(err);
  }
};

export const getRepositoryCommits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const search = req.query.search as string | undefined;

    const repo = repositoryStore.getRepository(id);
    if (!repo) {
      throw new NotFoundError(`Repository with ID "${id}" not found`);
    }

    const commits = await gitService.getCommitHistory(repo.path, { page, limit, search });

    res.status(200).json({
      success: true,
      data: commits,
    });
  } catch (err) {
    next(err);
  }
};
