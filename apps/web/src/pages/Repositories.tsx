import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Folder, HardDrive, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import type { RepositoryDetails } from '@tracemind/shared';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export default function Repositories() {
  const [repoPath, setRepoPath] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fetch active repository details
  const { data: activeRepoResponse, isLoading } = useQuery<{
    success: boolean;
    data: RepositoryDetails | null;
  }>({
    queryKey: ['activeRepository'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/repositories/active`);
      if (!res.ok) throw new Error('API server offline');
      return res.json();
    },
  });

  const activeRepo = activeRepoResponse?.data;

  // 2. Import repository mutation
  const importMutation = useMutation<
    { success: boolean; data: { repositoryId: string; name: string; branch: string } },
    Error,
    string
  >({
    mutationFn: async (path) => {
      const res = await fetch(`${API_BASE}/repositories/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to import repository');
      }
      return res.json();
    },
    onSuccess: () => {
      setRepoPath('');
      // Invalidate activeRepository query to update list immediately
      queryClient.invalidateQueries({ queryKey: ['activeRepository'] });
      navigate('/');
    },
  });

  const handleImport = (e: FormEvent) => {
    e.preventDefault();
    if (!repoPath.trim() || importMutation.isPending) return;
    importMutation.mutate(repoPath.trim());
  };

  const handleImportDemo = () => {
    if (importMutation.isPending) return;
    importMutation.mutate('demo-repo');
  };

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
                disabled={importMutation.isPending}
                className="w-full bg-[#090a0f] border border-[#1e2030] focus:border-purple-500 rounded-md py-2 pl-9 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-colors disabled:opacity-50"
              />
              <Folder className="w-4 h-4 text-gray-600 absolute left-3 top-2.5" />
            </div>
          </div>

          {importMutation.isError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-950/20 border border-red-900/30 rounded text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importMutation.error.message}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!repoPath.trim() || importMutation.isPending}
            className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs py-2 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-[#1e2030] disabled:text-gray-500 flex items-center justify-center gap-2"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import Repository</span>
            )}
          </button>
        </form>
      </div>

      {/* Demo Repository Quick-start Card */}
      <div className="p-5 bg-purple-950/10 border border-purple-500/20 rounded-lg max-w-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-white">No local repository ready?</h4>
          <p className="text-[10px] text-purple-200/70 max-w-sm mt-0.5 leading-relaxed">
            Explore TraceMind instantly using our pre-seeded authentication service repository with active database connection leaks.
          </p>
        </div>
        <button
          type="button"
          onClick={handleImportDemo}
          disabled={importMutation.isPending}
          className="px-4 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md cursor-pointer transition-colors active:scale-95 disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Demo Repository</span>
        </button>
      </div>

      {/* List of active repositories */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Active Workspace</h3>
        
        {isLoading && (
          <div className="p-8 bg-[#0c0d14] rounded-lg border border-[#1e2030] animate-pulse h-16" />
        )}

        {!isLoading && !activeRepo && (
          <div className="p-6 bg-[#0c0d14] rounded-lg border border-[#1e2030] text-center text-xs text-gray-500">
            No active repository imported. Type a local Git path above to initialize.
          </div>
        )}

        {!isLoading && activeRepo && (
          <div className="divide-y divide-[#1e2030] bg-[#0c0d14] rounded-lg border border-[#1e2030] overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-[#161722]/20 transition-colors">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="text-xs font-medium text-white">{activeRepo.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono select-all">{activeRepo.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-[#161722] text-[#838b9c] border border-[#2e3045] px-2 py-0.5 rounded font-mono">
                    {activeRepo.branch}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Indexed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
