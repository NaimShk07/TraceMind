import type { CommitMetadata } from '@tracemind/shared';

const getKeywords = (text: string): string[] => {
  const genericStopWords = new Set([
    'why',
    'the',
    'how',
    'what',
    'there',
    'this',
    'that',
    'from',
    'with',
    'your',
    'codebase',
    'repo',
    'repository',
    'commit',
    'change',
    'fails',
    'failing',
    'broken',
    'issue',
    'error',
    'bug',
    'is',
    'are',
    'was',
    'were',
    'in',
    'on',
    'at',
    'to',
    'for',
    'a',
    'an',
    'of',
    'and',
    'or',
    'but',
    'if',
    'else',
    'please',
    'tell',
    'me',
    'about',
    'some',
    'any',
    'can',
    'you',
    'find',
    'explain',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .split(/\s+/)
    .filter((w) => w.length > 2 && !genericStopWords.has(w));
};

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
    const keywords = getKeywords(question);

    // Rank commits: matches in message get higher priority, then chronological recency
    const sortedCommits = [...commits].sort((a, b) => {
      let aScore = 0;
      let bScore = 0;
      const aMsg = a.message.toLowerCase();
      const bMsg = b.message.toLowerCase();

      keywords.forEach((kw) => {
        if (aMsg.includes(kw)) aScore += 1;
        if (bMsg.includes(kw)) bScore += 1;
      });

      if (bScore !== aScore) {
        return bScore - aScore;
      }
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
          context +=
            diffLines.slice(0, 100).join('\n') +
            `\n[... Diff truncated: ${diffLines.length - 100} lines omitted to reduce token usage ...]\n`;
        } else {
          context += diff + `\n`;
        }
      });
    }

    return context.trim();
  }
}

export default ContextBuilder;
