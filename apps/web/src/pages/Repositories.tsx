import { useState } from 'react';
import type { FormEvent } from 'react';
import { Folder, HardDrive } from 'lucide-react';

export default function Repositories() {
  const [repoPath, setRepoPath] = useState('');

  const handleImport = (e: FormEvent) => {
    e.preventDefault();
    alert(`Importing repo path: ${repoPath} (Functionality is disabled for UI-only Milestone)`);
  };

  const mockRepos = [
    { id: '1', name: 'TraceSpark', path: '/Users/nayemuddinshaikh/Desktop/Coding/Ai/TraceSpark', branch: 'main', status: 'Indexed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Repositories</h2>
        <p className="text-xs text-[#626875]">Connect local repositories to index history and enable AI investigation.</p>
      </div>

      {/* Import Form */}
      <div className="p-5 bg-[#0c0d14] rounded-lg border border-[#1e2030] max-w-xl">
        <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono mb-4">Import Local Directory</h3>
        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-mono uppercase">Absolute Path</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="/path/to/local/git-repo" 
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                className="w-full bg-[#090a0f] border border-[#1e2030] focus:border-purple-500 rounded-md py-2 pl-9 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-colors"
              />
              <Folder className="w-4 h-4 text-gray-600 absolute left-3 top-2.5" />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs py-2 rounded-md transition-colors cursor-pointer"
          >
            Import Repository
          </button>
        </form>
      </div>

      {/* List of active repositories */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Active Workspace</h3>
        
        <div className="divide-y divide-[#1e2030] bg-[#0c0d14] rounded-lg border border-[#1e2030] overflow-hidden">
          {mockRepos.map((repo) => (
            <div key={repo.id} className="p-4 flex items-center justify-between hover:bg-[#161722]/20 transition-colors">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="text-xs font-medium text-white">{repo.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">{repo.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-[#161722] text-[#838b9c] border border-[#2e3045] px-2 py-0.5 rounded font-mono">
                    {repo.branch}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{repo.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
