import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import GitService from './gitService.js';

describe('GitService Integration Tests', () => {
  const testRepoPath = path.resolve('./apps/api/temp-test-repo');
  const gitService = new GitService();

  beforeAll(() => {
    // Clean up if previous tests left artifacts
    if (fs.existsSync(testRepoPath)) {
      fs.rmSync(testRepoPath, { recursive: true, force: true });
    }
    fs.mkdirSync(testRepoPath, { recursive: true });

    // Initialize new local Git repository
    execSync('git init', { cwd: testRepoPath });
    execSync('git config user.name "Test User"', { cwd: testRepoPath });
    execSync('git config user.email "test@example.com"', { cwd: testRepoPath });

    // Add first commit
    fs.writeFileSync(path.join(testRepoPath, 'file1.txt'), 'Hello World');
    execSync('git add .', { cwd: testRepoPath });
    execSync('git commit -m "initial commit"', { cwd: testRepoPath });

    // Add second commit
    fs.writeFileSync(path.join(testRepoPath, 'file2.txt'), 'Hello Part 2');
    execSync('git add .', { cwd: testRepoPath });
    execSync('git commit -m "second commit adding file2"', { cwd: testRepoPath });
  });

  afterAll(() => {
    // Delete temp repo
    if (fs.existsSync(testRepoPath)) {
      fs.rmSync(testRepoPath, { recursive: true, force: true });
    }
  });

  it('should resolve and retrieve repository info', async () => {
    const info = await gitService.getRepositoryInfo(testRepoPath);
    expect(info.name).toBe('temp-test-repo');
    expect(info.branch).toBeDefined();
  });

  it('should fetch paginated commit history logs', async () => {
    const history = await gitService.getCommitHistory(testRepoPath, { limit: 10 });
    expect(history.length).toBe(2);
    expect(history[0].message).toBe('second commit adding file2');
    expect(history[1].message).toBe('initial commit');
  });

  it('should fetch details of specific commit with diff', async () => {
    const history = await gitService.getCommitHistory(testRepoPath, { limit: 1 });
    const commitHash = history[0].hash;
    const commitDetails = await gitService.getCommit(testRepoPath, commitHash);
    expect(commitDetails.hash).toBe(commitHash);
    expect(commitDetails.diff).toContain('file2.txt');
    expect(commitDetails.filesChanged).toContain('file2.txt');
  });
});
