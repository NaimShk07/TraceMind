import fs from 'fs';
import path from 'path';
import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';
import type { CommitMetadata, CommitDetails } from '@tracemind/shared';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GitService {
  /**
   * Resolves repository path, falling back to workspace root if CWD resolution fails.
   */
  public resolveRepoPath(repoPath: string): string {
    let resolvedPath = path.resolve(repoPath);
    if (!fs.existsSync(resolvedPath)) {
      const workspaceRoot = path.resolve(__dirname, '../../../../');
      const alternatePath = path.resolve(workspaceRoot, repoPath);
      if (fs.existsSync(alternatePath)) {
        resolvedPath = alternatePath;
      }
    }
    return resolvedPath;
  }

  /**
   * Resolves, verifies, and returns the absolute path of a Git repository.
   * Throws errors if directory does not exist or lacks a .git folder.
   */
  private getGitInstance(repoPath: string): SimpleGit {
    const resolvedPath = this.resolveRepoPath(repoPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundError(`Directory "${repoPath}" does not exist`);
    }

    const gitFolder = path.join(resolvedPath, '.git');
    if (!fs.existsSync(gitFolder)) {
      throw new BadRequestError(`Directory "${repoPath}" is not a valid Git repository`);
    }

    return simpleGit(resolvedPath);
  }

  /**
   * Fetches basic repository metadata (name, active branch).
   */
  public async getRepositoryInfo(repoPath: string): Promise<{ name: string; branch: string }> {
    const git = this.getGitInstance(repoPath);
    const name = path.basename(path.resolve(repoPath));
    try {
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return { name: branch.trim() ? name : 'unknown', branch: branch.trim() || 'main' };
    } catch (err: any) {
      // Fallback for newly initialized repositories with no commits
      if (err.message.includes('needed a single revision') || err.message.includes('HEAD')) {
        return { name, branch: 'main' };
      }
      throw new BadRequestError(`Failed to read repository info: ${err.message}`);
    }
  }

  /**
   * Returns a list of all local branches.
   */
  public async getBranches(repoPath: string): Promise<string[]> {
    const git = this.getGitInstance(repoPath);
    try {
      const branchResult = await git.branchLocal();
      return branchResult.all;
    } catch (err: any) {
      throw new BadRequestError(`Failed to fetch branches: ${err.message}`);
    }
  }

  /**
   * Fetches chronological commit history log with pagination.
   */
  public async getCommitHistory(
    repoPath: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ): Promise<CommitMetadata[]> {
    const git = this.getGitInstance(repoPath);
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;
    const search = options.search?.trim();

    try {
      if (search) {
        // Fetch candidate commits (up to 100) to search on
        const logResult = await git.log([`--max-count=100`]);

        const mappedCommits = await Promise.all(
          logResult.all.map(async (commit) => {
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
            };
          }),
        );

        const searchLower = search.toLowerCase();
        const filtered = mappedCommits.filter((commit) => {
          const matchMsg = commit.message.toLowerCase().includes(searchLower);
          const matchAuthor = commit.author.toLowerCase().includes(searchLower);
          const matchHash = commit.hash.toLowerCase().includes(searchLower);
          const matchFiles = commit.filesChanged.some((file) =>
            file.toLowerCase().includes(searchLower),
          );
          return matchMsg || matchAuthor || matchHash || matchFiles;
        });

        // Apply slice pagination
        const sliced = filtered.slice(skip, skip + limit);
        // Exclude full filesChanged array from output metadata object
        return sliced.map(({ filesChanged, ...rest }) => rest);
      } else {
        const logResult = await git.log([`--max-count=${limit}`, `--skip=${skip}`]);

        const commits = await Promise.all(
          logResult.all.map(async (commit) => {
            let filesChangedCount = 0;
            try {
              const filesRaw = await git.show(['--name-only', '--pretty=format:', commit.hash]);
              filesChangedCount = filesRaw.trim().split('\n').filter(Boolean).length;
            } catch {
              // Fail silently
            }

            return {
              hash: commit.hash,
              author: commit.author_name,
              date: commit.date,
              message: commit.message,
              filesChangedCount,
            };
          }),
        );

        return commits;
      }
    } catch (err: any) {
      throw new BadRequestError(`Failed to fetch commit history: ${err.message}`);
    }
  }

  /**
   * Returns detailed commit information including message, author, date,
   * changed files list, insertion/deletion stats, and the full raw diff.
   */
  public async getCommit(repoPath: string, hash: string): Promise<CommitDetails> {
    const git = this.getGitInstance(repoPath);
    try {
      const logResult = await git.log(['-n', '1', hash]);
      const commit = logResult.latest;
      if (!commit) {
        throw new NotFoundError(`Commit "${hash}" not found in repository`);
      }

      // Fetch raw diff
      const diff = await git.show([hash]);

      // Fetch list of changed files
      const filesRaw = await git.show(['--name-only', '--pretty=format:', hash]);
      const filesChanged = filesRaw.trim().split('\n').filter(Boolean);

      // Fetch shortstats for additions/deletions parsing
      const statsRaw = await git.show(['--shortstat', '--pretty=format:', hash]);

      let additions = 0;
      let deletions = 0;

      // Extract numbers matching: e.g. " 2 files changed, 10 insertions(+), 5 deletions(-)"
      const insMatch = statsRaw.match(/(\d+)\s+insertion[s]?\(\+\)/);
      const delMatch = statsRaw.match(/(\d+)\s+deletion[s]?\(\-\)/);

      if (insMatch) additions = parseInt(insMatch[1], 10);
      if (delMatch) deletions = parseInt(delMatch[1], 10);

      return {
        hash,
        author: commit.author_name,
        date: commit.date,
        message: commit.message,
        diff,
        filesChanged,
        stats: {
          additions,
          deletions,
          filesChanged: filesChanged.length,
        },
      };
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
      throw new BadRequestError(
        `Failed to fetch commit details for hash "${hash}": ${err.message}`,
      );
    }
  }

  /**
   * Fetches only the raw string diff of a specific commit.
   */
  public async getCommitDiff(repoPath: string, hash: string): Promise<string> {
    const git = this.getGitInstance(repoPath);
    try {
      // Run git show to fetch diff
      return await git.show([hash]);
    } catch (err: any) {
      throw new BadRequestError(`Failed to fetch diff for hash "${hash}": ${err.message}`);
    }
  }

  /**
   * Retrieves log of commits modifying a specific file.
   */
  public async getFileHistory(repoPath: string, filePath: string): Promise<CommitMetadata[]> {
    const git = this.getGitInstance(repoPath);
    try {
      const logResult = await git.log(['--', filePath]);

      const commits = await Promise.all(
        logResult.all.map(async (commit) => {
          let filesChangedCount = 0;
          try {
            const filesRaw = await git.show(['--name-only', '--pretty=format:', commit.hash]);
            filesChangedCount = filesRaw.trim().split('\n').filter(Boolean).length;
          } catch {
            // Fail silently
          }

          return {
            hash: commit.hash,
            author: commit.author_name,
            date: commit.date,
            message: commit.message,
            filesChangedCount,
          };
        }),
      );

      return commits;
    } catch (err: any) {
      throw new BadRequestError(`Failed to fetch file history for "${filePath}": ${err.message}`);
    }
  }
}

export default GitService;
