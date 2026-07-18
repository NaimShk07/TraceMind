import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { simpleGit } from 'simple-git';
import GitService from '../services/gitService.js';
import repositoryStore from '../services/repositoryStore.js';
import ContextBuilder from '../services/contextBuilder.js';
import AiService from '../services/aiService.js';
import { NotFoundError } from '../utils/errors.js';
import type { CommitMetadata } from '@tracemind/shared';

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

// Helper to filter out stop words and extract keywords
const getKeywords = (text: string): string[] => {
  const genericStopWords = new Set([
    'why', 'the', 'how', 'what', 'there', 'this', 'that', 'from', 'with', 
    'your', 'codebase', 'repo', 'repository', 'commit', 'change', 'fails', 
    'failing', 'broken', 'issue', 'error', 'bug', 'is', 'are', 'was', 'were', 
    'in', 'on', 'at', 'to', 'for', 'a', 'an', 'of', 'and', 'or', 'but', 'if', 'else',
    'please', 'tell', 'me', 'about', 'some', 'any', 'can', 'you', 'find', 'explain'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !genericStopWords.has(w));
};

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
    const resolvedPath = gitService.resolveRepoPath(repo.path);
    const git = simpleGit(resolvedPath);
    const logResult = await git.log({ maxCount: 30 });

    // Fetch list of changed files for each commit in parallel
    const commitsWithFiles = await Promise.all(
      logResult.all.map(async (commit, idx) => {
        let filesChanged: string[] = [];
        try {
          const filesRaw = await git.show(['--name-only', '--pretty=format:', commit.hash]);
          filesChanged = filesRaw.trim().split('\n').filter(Boolean);
        } catch {
          // Fail silently
        }
        return {
          hash: commit.hash,
          author: commit.author_name,
          date: commit.date,
          message: commit.message,
          filesChangedCount: filesChanged.length,
          filesChanged,
          idx, // index for recency calculation
        };
      })
    );

    // 2. Score commits based on keyword matching
    const keywords = getKeywords(question);
    
    const scoredCommits = commitsWithFiles.map(commit => {
      let score = 0;
      const msgLower = commit.message.toLowerCase();
      const authorLower = commit.author.toLowerCase();

      keywords.forEach(kw => {
        if (msgLower.includes(kw)) {
          score += 3; // Message match is highly relevant
        }
        if (authorLower.includes(kw)) {
          score += 1; // Author match is slightly relevant
        }
        if (commit.filesChanged.some(f => f.toLowerCase().includes(kw))) {
          score += 2; // Filename match is relevant
        }
      });

      // Recency booster: give a tiny bonus to the most recent 5 commits
      if (commit.idx < 5) {
        score += 1;
      }

      return {
        ...commit,
        score
      };
    });

    // Sort by score descending, then by idx ascending (newer first)
    const sortedCommits = scoredCommits.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.idx - b.idx;
    });

    // Select top 3 commits with score > 0, or fallback to the top 3 most recent commits
    const topScoring = sortedCommits.filter(c => c.score > 0).slice(0, 3);
    const chosenCommits = topScoring.length > 0 ? topScoring : sortedCommits.slice(0, 3);

    // Fetch detailed diffs for the chosen commits
    const relevantDiffs: { hash: string; diff: string }[] = [];
    for (const match of chosenCommits) {
      try {
        const diff = await git.show([match.hash]);
        relevantDiffs.push({ hash: match.hash, diff });
      } catch {
        // Silently skip if diff extraction throws
      }
    }

    // Prepare commits metadata for ContextBuilder input
    const commitsMetadata: CommitMetadata[] = commitsWithFiles.map(c => ({
      hash: c.hash,
      author: c.author,
      date: c.date,
      message: c.message,
      filesChangedCount: c.filesChangedCount
    }));

    // 3. Compile optimized context block
    const context = contextBuilder.buildContext({
      repoName: repo.name,
      repoBranch: repo.branch,
      question,
      commits: commitsMetadata,
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
