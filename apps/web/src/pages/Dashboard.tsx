import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GitCommit, 
  Layers, 
  TrendingUp, 
  Flame, 
  HelpCircle,
  Play,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const demoMutation = useMutation({
    mutationFn: async () => {
      // Automatically import local TraceSpark repo as the demo
      const res = await fetch('http://localhost:3001/repositories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/Users/nayemuddinshaikh/Desktop/Coding/Ai/TraceSpark' }),
      });
      if (!res.ok) throw new Error('Failed to import demo repository');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeRepository'] });
      // Redirect to investigation page with a preloaded prompt query parameters
      navigate('/investigate');
    }
  });

  const stats = [
    { label: 'Imported Repos', value: '1', icon: Layers, desc: 'Active workspace repository' },
    { label: 'Indexed Commits', value: '30+', icon: GitCommit, desc: 'Analyzed in timeline cache' },
    { label: 'Hotspot Risks', value: 'Active', icon: Flame, desc: 'Identified risky modules' },
    { label: 'AI Investigations', value: 'Live', icon: TrendingUp, desc: 'Conversational queries processed' },
  ];

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">TraceMind Flight Deck</span>
        </h2>
        <p className="text-xs text-[#626875]">Welcome back. Index codebases and analyze history metrics.</p>
      </div>

      {/* Massive Call to Action */}
      <div className="p-6 bg-[#0c0d14] border border-purple-500/20 rounded-xl relative overflow-hidden shadow-2xl shadow-purple-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/30 text-purple-400 border border-purple-500/20 text-[9px] uppercase tracking-wider font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Hackathon Evaluation Mode</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Let the AI scan this project</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Click the button below to instantly import this TraceMind repository, trigger the git timeline indexer, and run a live forensic investigation query.
          </p>
          
          <button
            onClick={() => demoMutation.mutate()}
            disabled={demoMutation.isPending}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-5 py-3 rounded-lg cursor-pointer transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
          >
            {demoMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Indexing Git logs...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Guided AI Demo</span>
              </>
            )}
          </button>
        </div>
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
          TraceMind acts as an intelligent layer above Git. To begin an investigation, import a local git repository. Once imported, TraceMind indexes metadata to let you explore the commit timeline, search logs, and run conversational AI root-cause analysis on bugs.
        </p>
      </div>
    </div>
  );
}
