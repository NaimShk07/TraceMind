import { Calendar, User, Code } from 'lucide-react';

export default function Timeline() {
  const mockCommits = [
    {
      hash: 'a1b2c3d4',
      message: 'feat(auth): implement token-based session verification and validation schema',
      author: 'nayemuddinshaikh',
      date: '2026-07-15T23:31:00Z',
      filesChanged: ['apps/api/src/auth.ts', 'packages/shared/src/types.ts']
    },
    {
      hash: 'e5f6g7h8',
      message: 'fix(api): resolve memory leakage in git log stream mapping',
      author: 'nayemuddinshaikh',
      date: '2026-07-14T18:12:00Z',
      filesChanged: ['apps/api/src/git-engine.ts']
    },
    {
      hash: 'i9j0k1l2',
      message: 'chore(config): initialize standard eslint configurations and prettier hooks',
      author: 'nayemuddinshaikh',
      date: '2026-07-13T12:00:00Z',
      filesChanged: ['eslint.config.js', '.prettierrc', 'package.json']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Timeline</h2>
        <p className="text-xs text-[#626875]">Chronological commit history feed. Select a commit to inspect details and diffs.</p>
      </div>

      {/* Commit Timeline Cards */}
      <div className="relative border-l border-[#1e2030] ml-3 pl-6 space-y-6">
        {mockCommits.map((commit) => (
          <div key={commit.hash} className="relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-4 border-[#090a0f] bg-purple-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Commit Card */}
            <div className="p-5 bg-[#0c0d14] rounded-lg border border-[#1e2030] hover:border-[#2e3045] transition-colors space-y-3 max-w-3xl">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-purple-400 font-semibold hover:underline cursor-pointer">{commit.hash}</span>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(commit.date).toLocaleDateString()}</span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-white leading-relaxed">{commit.message}</h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-[#1e2030]/50 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono text-gray-400">{commit.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>{commit.filesChanged.length} files changed</span>
                </div>
              </div>

              {/* Files preview list */}
              <div className="space-y-1 pt-1.5">
                {commit.filesChanged.map((file, idx) => (
                  <div key={idx} className="text-[10px] font-mono text-[#838b9c] bg-[#161722]/40 px-2 py-0.5 rounded border border-[#1e2030]/30 inline-block mr-2">
                    {file}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
