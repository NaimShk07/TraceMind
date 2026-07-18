import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GitCommit, 
  Layers, 
  Flame, 
  Clock,
  ArrowRight,
  FolderGit,
  Activity,
  Cpu
} from 'lucide-react';
import type { RepositoryDetails, CommitMetadata } from '@tracemind/shared';

export default function Dashboard() {
  const navigate = useNavigate();

  // 1. Fetch active repository details
  const { data: activeRepoResponse, isLoading: isRepoLoading } = useQuery<{
    success: boolean;
    data: RepositoryDetails | null;
  }>({
    queryKey: ['activeRepository'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/repositories/active');
      if (!res.ok) throw new Error('API offline');
      return res.json();
    },
  });

  const activeRepo = activeRepoResponse?.data;

  // 2. Fetch recent commits for active repository
  const { data: recentCommitsResponse, isLoading: isCommitsLoading } = useQuery<{
    success: boolean;
    data: CommitMetadata[];
  }>({
    queryKey: ['recentCommits', activeRepo?.repositoryId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/repositories/${activeRepo?.repositoryId}/commits?page=1&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch commits');
      return res.json();
    },
    enabled: !!activeRepo?.repositoryId,
  });

  const recentCommits = recentCommitsResponse?.data || [];

  const quickInvestigations = [
    {
      title: 'Analyze Socket Connection Pools',
      desc: 'Investigate potential socket connection memory leak patterns and connection allocation details.',
      prompt: 'Is there a memory leak in socket connection pool?',
      icon: Flame,
      badge: 'Leak Check'
    },
    {
      title: 'Summarize Recent Codebase Updates',
      desc: 'Generate a structured markdown summary of the modifications introduced in recent commits.',
      prompt: 'Explain the changes in the latest commits.',
      icon: Cpu,
      badge: 'Diff Audit'
    },
    {
      title: 'Audit Project Dependency Changes',
      desc: 'Identify commits affecting package.json, lockfiles, and configuration files.',
      prompt: 'Find commits modifying package.json.',
      icon: GitCommit,
      badge: 'Package Audit'
    }
  ];

  // Render Empty State if no active repository imported yet
  if (!isRepoLoading && !activeRepo) {
    return (
      <div className="space-y-6 animate-slideUp">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Mission Control</h2>
          <p className="text-xs text-[#626875]">Connect a repository to index history and activate telemetry controls.</p>
        </div>

        <div className="p-8 bg-[#0c0d14] rounded-lg border border-[#1e2030] max-w-xl text-center space-y-4">
          <Layers className="w-12 h-12 text-[#626875] mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white">No Active Repository</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              Import a local Git repository to populate the Mission Control telemetry dashboard.
            </p>
          </div>
          <Link
            to="/repositories"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
          >
            <span>Go to Repositories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Mission Control</span>
        </h2>
        <p className="text-xs text-[#626875]">Real-time codebase status, telemetry metrics, and AI diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Left Side - Hero Card & Quick Investigations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Repo Hero Card */}
          {isRepoLoading ? (
            <div className="h-44 bg-[#0c0d14] border border-[#1e2030] rounded-xl animate-pulse" />
          ) : (
            <div className="p-6 bg-gradient-to-br from-[#0f111a] to-[#07080c] border border-purple-500/20 rounded-xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">Telemetry Active</span>
                  </div>
                  <span className="text-[10px] bg-[#161722] text-[#838b9c] border border-[#2e3045] px-2 py-0.5 rounded font-mono">
                    {activeRepo?.branch}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{activeRepo?.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FolderGit className="w-3.5 h-3.5 text-[#626875]" />
                    <span className="font-mono select-all text-[11px] truncate max-w-md">{activeRepo?.path}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e2030]/60 flex items-center gap-4">
                  <Link
                    to="/timeline"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>View Commit Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/investigate"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    <span>Open Investigator</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Investigations Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Quick Investigations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickInvestigations.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(`/investigate?q=${encodeURIComponent(item.prompt)}`)}
                    className="p-4 bg-[#0c0d14] hover:bg-[#161722] border border-[#1e2030] hover:border-purple-500/30 rounded-lg text-left cursor-pointer transition-all active:scale-95 space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[8px] font-mono bg-[#161722] border border-[#2e3045] px-1.5 py-0.5 rounded text-gray-400 font-medium">
                        {item.badge}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-semibold text-white leading-snug group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-gray-500 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Telemetry & Recent Activity */}
        <div className="space-y-6">
          {/* Telemetry Stats mini grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Telemetry Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0c0d14] rounded-lg border border-[#1e2030]">
                <span className="text-[9px] font-mono text-gray-500 uppercase">Total Indexed</span>
                <div className="text-base font-semibold text-white font-mono mt-0.5">30+ Commits</div>
              </div>
              <div className="p-3 bg-[#0c0d14] rounded-lg border border-[#1e2030]">
                <span className="text-[9px] font-mono text-gray-500 uppercase">AI Status</span>
                <div className="text-base font-semibold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse animate-duration-1000" />
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Ledger */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Recent Activity</h3>
            
            {isCommitsLoading ? (
              <div className="p-4 bg-[#0c0d14] border border-[#1e2030] rounded-lg animate-pulse space-y-3">
                <div className="h-8 bg-[#1e2030] rounded" />
                <div className="h-8 bg-[#1e2030] rounded" />
                <div className="h-8 bg-[#1e2030] rounded" />
              </div>
            ) : recentCommits.length === 0 ? (
              <div className="p-4 bg-[#0c0d14] rounded-lg border border-[#1e2030] text-center text-[10px] text-gray-500 font-mono">
                No indexed history found.
              </div>
            ) : (
              <div className="bg-[#0c0d14] rounded-lg border border-[#1e2030] p-4 space-y-4">
                <div className="relative pl-4 space-y-4 border-l border-[#1e2030]/60">
                  {recentCommits.map((commit) => (
                    <div key={commit.hash} className="relative group text-left">
                      {/* Timeline dot */}
                      <div className="absolute -left-[20.5px] top-1 w-2 h-2 rounded-full bg-[#1e2030] border border-[#0c0d14] group-hover:bg-purple-500 group-hover:border-purple-300 transition-colors" />
                      
                      <button
                        onClick={() => navigate(`/timeline?commit=${commit.hash}`)}
                        className="w-full text-left space-y-1 block cursor-pointer hover:bg-[#161722]/50 p-2 -mx-2 rounded transition-all"
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                          <span className="text-purple-400 font-bold group-hover:underline">
                            {commit.hash.substring(0, 7)}
                          </span>
                          <span>{new Date(commit.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-gray-300 group-hover:text-white transition-colors truncate leading-tight">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 text-[8px] text-gray-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{commit.author}</span>
                          </span>
                          <span>{commit.filesChangedCount} files changed</span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
                
                <Link
                  to="/timeline"
                  className="block text-center text-[9px] font-bold tracking-wider text-purple-400 hover:text-purple-300 transition-colors border-t border-[#1e2030]/60 pt-3"
                >
                  VIEW FULL LEDGER
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
