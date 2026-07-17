import { 
  GitCommit, 
  Layers, 
  TrendingUp, 
  Flame, 
  HelpCircle 
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Imported Repos', value: '1', icon: Layers, desc: 'Active workspace repository' },
    { label: 'Indexed Commits', value: '30+', icon: GitCommit, desc: 'Timeline commits parsed' },
    { label: 'Hotspot Risks', value: 'Active', icon: Flame, desc: 'Monitored codebase modules' },
    { label: 'AI Investigations', value: 'Ready', icon: TrendingUp, desc: 'RAG analysis engines active' },
  ];

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Overview</h2>
        <p className="text-xs text-[#626875]">Welcome back. Select an active repository or view history statistics below.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 bg-[#0c0d14] rounded-lg border border-[#1e2030] flex flex-col justify-between hover:border-[#2e3045] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#626875] uppercase">{stat.label}</span>
                <Icon className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-semibold text-white mb-1 font-mono">{stat.value}</div>
                <div className="text-[10px] text-gray-500">{stat.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Info Section */}
      <div className="p-6 bg-[#0c0d14] rounded-lg border border-[#1e2030] space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <span>Getting Started</span>
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
          TraceMind acts as an intelligent history parsing layer above Git. To begin an investigation, import a local git repository. Once imported, TraceMind indexes metadata to let you explore the commit timeline, search logs, and run conversational AI root-cause analysis on bugs.
        </p>
      </div>
    </div>
  );
}
