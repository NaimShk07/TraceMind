import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import GitService from '../services/gitService.js';
import repositoryStore from '../services/repositoryStore.js';
import ContextBuilder from '../services/contextBuilder.js';
import AiService from '../services/aiService.js';
import { NotFoundError } from '../utils/errors.js';

const gitService = new GitService();
const contextBuilder = new ContextBuilder();
const aiService = new AiService();

// Input schema validation using Zod
export const ChatSchema = z.object({
  repositoryId: z.string({
    required_error: 'Repository ID is required',
    invalid_type_error: 'Repository ID must be a string',
  }).min(1, 'Repository ID is required'),
  question: z.string({
    required_error: 'Question is required',
    invalid_type_error: 'Question must be a string',
  }).min(1, 'Question is required'),
});

export const handleChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request payload
    const validated = ChatSchema.parse(req.body);
    const { repositoryId, question } = validated;

    // Resolve repository path
    const repo = repositoryStore.getRepository(repositoryId);
    if (!repo) {
      throw new NotFoundError(`Repository with ID "${repositoryId}" not found`);
    }

    // 1. Gather git context: fetch last 30 commits to scan through
    const commits = await gitService.getCommitHistory(repo.path, { limit: 30 });

    // 2. Select up to 2 commits containing question keyword matches for diff-level context
    const queryLower = question.toLowerCase();
    const matchingCommits = commits
      .filter((c) => c.message.toLowerCase().includes(queryLower))
      .slice(0, 2);

    const relevantDiffs: { hash: string; diff: string }[] = [];
    for (const match of matchingCommits) {
      try {
        const diff = await gitService.getCommitDiff(repo.path, match.hash);
        relevantDiffs.push({ hash: match.hash, diff });
      } catch {
        // Silently skip if diff extraction throws
      }
    }

    // 3. Compile optimized context block
    const context = contextBuilder.buildContext({
      repoName: repo.name,
      repoBranch: repo.branch,
      question,
      commits,
      relevantDiffs,
    });

    // 4. Query AI engine
    const aiResponse = await aiService.ask(context, question);

    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (err) {
    next(err);
  }
};
