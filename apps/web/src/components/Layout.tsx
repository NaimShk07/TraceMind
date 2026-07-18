import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Compass, 
  GitBranch, 
  GitCommit, 
  Search, 
  Settings, 
  PanelRightClose, 
  PanelRight, 
  Menu, 
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { HealthResponse, CommitDetails } from '@tracemind/shared';

const renderDiffLine = (line: string, index: number) => {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return (
      <div key={index} className="bg-emerald-950/20 text-emerald-400 font-mono text-[10px] py-0.5 px-3 border-l-2 border-emerald-500 select-text">
        {line}
      </div>
    );
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return (
      <div key={index} className="bg-red-950/20 text-red-400 font-mono text-[10px] py-0.5 px-3 border-l-2 border-red-500 select-text">
        {line}
      </div>
    );
  }
  if (line.startsWith('@@')) {
    return (
      <div key={index} className="bg-purple-950/10 text-purple-400 font-mono text-[10px] py-0.5 px-3 font-semibold select-text">
        {line}
      </div>
    );
  }
  return (
    <div key={index} className="text-gray-400 font-mono text-[10px] py-0.5 px-3 select-text">
      {line}
    </div>
  );
};

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const commitHash = searchParams.get('commit');

  // Query commit details if a hash is selected
  const { data: commitResponse, isLoading: isCommitLoading, isError: isCommitError } = useQuery<{
    success: boolean;
    data: CommitDetails;
  }>({
    queryKey: ['commit', commitHash],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/commits/${commitHash}`);
      if (!res.ok) throw new Error('Failed to fetch commit');
      return res.json();
    },
    enabled: !!commitHash,
  });

  const commit = commitResponse?.data;

  // Auto-open inspector panel when a commit is selected
  useEffect(() => {
    if (commitHash) {
      setInspectorOpen(true);
    }
  }, [commitHash]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchParams({});
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchParams]);

  // Keep a global connection monitor in the header
  const { data, isError } = useQuery<{ success: boolean; data: HealthResponse }>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/health');
      if (!res.ok) throw new Error('API server offline');
      return res.json();
    },
    refetchInterval: 10000, // Poll health every 10s
    retry: 1,
  });

  // Helper to map route path to readable page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/repositories': return 'Repositories';
      case '/timeline': return 'Commit Timeline';
      case '/investigate': return 'AI Investigation';
      default: return 'TraceMind';
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Compass },
    { to: '/repositories', label: 'Repositories', icon: GitBranch },
    { to: '/timeline', label: 'Timeline', icon: GitCommit },
    { to: '/investigate', label: 'AI Investigation', icon: Search },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#090a0f] text-[#9ca3af] font-sans antialiased overflow-hidden">
      
      {/* Mobile Header */}
      <header className="lg:hidden h-14 border-b border-[#1e2030] bg-[#0c0d14] flex items-center justify-between px-4 w-full fixed top-0 left-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <span className="text-sm font-semibold text-white">TraceMind</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Icon */}
          <div className={`w-2 h-2 rounded-full ${isError ? 'bg-red-500' : data?.success ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <button 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 1. Left Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r border-[#1e2030] bg-[#0c0d14] p-4 flex flex-col justify-between shrink-0
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${mobileSidebarOpen ? 'pt-18 lg:pt-4' : 'pt-4'}
      `}>
        <div>
          {/* Logo Section */}
          <div className="hidden lg:flex items-center gap-2.5 px-2 py-1.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
              T
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-wide">TraceMind</h1>
              <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase">Investigator</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer
                    ${isActive 
                      ? 'bg-[#161722] text-white border border-[#2e3045]' 
                      : 'text-[#9ca3af] hover:bg-[#161722]/50 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel */}
        <div className="border-t border-[#1e2030] pt-4 space-y-2.5">
          {/* Health indicator */}
          <div className="flex items-center justify-between px-2 text-[10px] font-mono">
            <span className="text-gray-500">API Gateway</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-500' : data?.success ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isError ? 'text-red-400' : data?.success ? 'text-emerald-400' : 'text-amber-400'}>
                {isError ? 'Offline' : data?.success ? 'Connected' : 'Connecting'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setInspectorOpen(prev => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md text-gray-400 hover:text-white hover:bg-[#161722]/50 transition-colors cursor-pointer text-left"
          >
            <Settings className="w-4 h-4" />
            <span>Inspector Telemetry</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)} 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 lg:pt-0">
        
        {/* Navigation Bar / Header */}
        <header className="h-14 border-b border-[#1e2030] flex items-center justify-between px-6 bg-[#090a0f] shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#626875]">Workspace</span>
            <span className="text-[#626875]">/</span>
            <span className="text-[#626875]">TraceSpark</span>
            <span className="text-[#626875]">/</span>
            <span className="text-white font-medium">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Monitor Label */}
            {isError && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>API Offline</span>
              </div>
            )}
            
            {/* Inspector Toggle Button */}
            <button 
              onClick={() => setInspectorOpen(!inspectorOpen)}
              className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-[#161722] cursor-pointer transition-all active:scale-95 border border-transparent hover:border-[#1e2030]"
              title={inspectorOpen ? 'Hide Inspector' : 'Show Inspector'}
            >
              {inspectorOpen ? <PanelRightClose className="w-4 h-4 text-purple-400" /> : <PanelRight className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Nested Route Rendering */}
        <div className="flex-1 overflow-hidden flex">
          <main className="flex-1 overflow-y-auto p-6 min-w-0">
            <Outlet />
          </main>

          {/* 3. Right Inspector Panel */}
          <aside className={`
            border-l border-[#1e2030] bg-[#0c0d14] flex flex-col shrink-0 overflow-y-auto transition-all duration-200
            ${inspectorOpen ? 'w-[400px] p-6 opacity-100' : 'w-0 p-0 opacity-0 border-l-0'}
            hidden md:flex
          `}>
            {commitHash ? (
              <div className="flex-1 flex flex-col space-y-4 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2030]">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-semibold text-white tracking-wider uppercase font-mono">
                      Commit Details
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSearchParams({})}
                    className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#161722] cursor-pointer transition-colors"
                    title="Close Details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isCommitLoading && (
                  <div className="space-y-3 pt-4 animate-pulse">
                    <div className="h-4 w-24 bg-[#1e2030] rounded" />
                    <div className="h-10 w-full bg-[#1e2030] rounded" />
                    <div className="h-40 w-full bg-[#1e2030] rounded" />
                  </div>
                )}

                {isCommitError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-[11px] text-red-300">
                    Failed to fetch details for commit <code>{commitHash.substring(0, 7)}</code>.
                  </div>
                )}

                {commit && (
                  <div className="flex-1 flex flex-col min-w-0 space-y-4">
                    {/* Metadata list */}
                    <div className="bg-[#090a0f] p-3.5 rounded-lg border border-[#1e2030] font-mono text-[10px] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Hash:</span>
                        <span className="text-purple-400 font-semibold select-all">{commit.hash}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Author:</span>
                        <span className="text-gray-300">{commit.author}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-300">{new Date(commit.date).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Commit Message */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Message</div>
                      <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2030] text-xs text-white whitespace-pre-wrap leading-relaxed">
                        {commit.message}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Impact Stats</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="bg-emerald-950/15 border border-emerald-900/35 py-2 rounded-lg">
                          <div className="text-emerald-400 font-bold">+{commit.stats.additions}</div>
                          <div className="text-[9px] text-gray-500 pt-0.5 uppercase">additions</div>
                        </div>
                        <div className="bg-red-950/15 border border-red-900/35 py-2 rounded-lg">
                          <div className="text-red-400 font-bold">-{commit.stats.deletions}</div>
                          <div className="text-[9px] text-gray-500 pt-0.5 uppercase">deletions</div>
                        </div>
                        <div className="bg-purple-950/15 border border-purple-900/35 py-2 rounded-lg">
                          <div className="text-purple-400 font-bold">{commit.stats.filesChanged}</div>
                          <div className="text-[9px] text-gray-500 pt-0.5 uppercase">files</div>
                        </div>
                      </div>
                    </div>

                    {/* Changed Files */}
                    <div className="space-y-1.5 flex flex-col min-h-0">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Modified Files</div>
                      <div className="bg-[#090a0f] border border-[#1e2030] rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1">
                        {commit.filesChanged.map((file) => (
                          <div key={file} className="flex items-center gap-1.5 text-[10px] font-mono text-gray-300 hover:text-white truncate">
                            <span className="text-purple-400/80">•</span>
                            <span className="truncate" title={file}>{file}</span>
                          </div>
                        ))}
                        {commit.filesChanged.length === 0 && (
                          <div className="text-[10px] text-gray-600 italic">No files modified.</div>
                        )}
                      </div>
                    </div>

                    {/* Diff View */}
                    <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Unified Diff</div>
                      <div className="flex-1 border border-[#1e2030] bg-[#090a0f] rounded-lg overflow-hidden flex flex-col min-h-[220px]">
                        <div className="flex-1 overflow-y-auto py-2 whitespace-pre select-text">
                          {commit.diff ? (
                            commit.diff.split('\n').map(renderDiffLine)
                          ) : (
                            <div className="text-[10px] text-gray-600 italic px-3 py-1">No diff content.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Inspector Panel</h2>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  This panel displays evidence, commit details, confidence levels, and context matching your AI investigations.
                </p>
                
                <div className="p-4 rounded-lg border border-[#1e2030] bg-[#090a0f] text-xs space-y-2">
                  <div className="font-semibold text-white">Quick Guide:</div>
                  <ul className="list-disc pl-4 space-y-1 text-[#838b9c]">
                    <li>Navigate to <b>Repositories</b> to specify a Git path.</li>
                    <li>Go to <b>Timeline</b> to inspect commits.</li>
                    <li>Use <b>AI Investigation</b> to analyze root causes.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#1e2030]/50 space-y-2">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Session Details</div>
                  <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2030] font-mono text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Env:</span>
                      <span className="text-white">development</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Storage:</span>
                      <span className="text-purple-400">In-Memory Cache</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

      </div>

    </div>
  );
}
