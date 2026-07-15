import type { CommitMetadata } from '@tracemind/shared';

export class ContextBuilder {
  /**
   * Compiles repository metadata, chronological commits list, and targeted
   * diff blocks into a compact structured context for LLM queries.
   */
  public buildContext(options: {
    repoName: string;
    repoBranch: string;
    question: string;
    commits: CommitMetadata[];
    relevantDiffs?: { hash: string; diff: string }[];
  }): string {
    const { repoName, repoBranch, question, commits, relevantDiffs = [] } = options;
    const queryLower = question.toLowerCase();

    // Rank commits: matches in message get higher priority, then chronological recency
    const sortedCommits = [...commits].sort((a, b) => {
      const aMatches = a.message.toLowerCase().includes(queryLower);
      const bMatches = b.message.toLowerCase().includes(queryLower);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0; // maintain chronological order (newest first)
    });

    // Take top 15 commits to keep tokens compact
    const visibleCommits = sortedCommits.slice(0, 15);

    let context = `Active Repository: ${repoName} (Branch: ${repoBranch})\n\n`;

    context += `Commit History (Top Matches & Recent):\n`;
    visibleCommits.forEach((c) => {
      context += `- [${c.hash.substring(0, 7)}] By ${c.author} on ${c.date}: "${c.message}" (${c.filesChangedCount} files changed)\n`;
    });
    context += `\n`;

    if (relevantDiffs.length > 0) {
      context += `Relevant Diffs / Changesets:\n`;
      relevantDiffs.forEach(({ hash, diff }) => {
        context += `--- Commit ${hash.substring(0, 7)} Diff ---\n`;
        const diffLines = diff.split('\n');
        
        // Truncate large diff files (limit to first 100 lines)
        if (diffLines.length > 100) {
          context += diffLines.slice(0, 100).join('\n') + `\n[... Diff truncated: ${diffLines.length - 100} lines omitted to reduce token usage ...]\n`;
        } else {
          context += diff + `\n`;
        }
      });
    }

    return context.trim();
  }
}

export default ContextBuilder;
