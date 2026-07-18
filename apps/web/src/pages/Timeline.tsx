import { useState, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Code, 
  GitCommit, 
  Activity, 
  AlertCircle,
  ArrowRight,
  Database,
  Search,
  X
} from 'lucide-react';
import type { CommitMetadata, RepositoryDetails } from '@tracemind/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Regular expression escaper for search highlighting
const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Substring highlights wrapper
const highlightText = (text: string, query: string) => {
  if (!query.trim()) return <span>{text}</span>;
  const escapedQuery = escapeRegExp(query.trim());
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark
            key={i}
            className="bg-purple-500/25 text-purple-200 rounded px-1 py-0.5 border border-purple-500/35 select-text font-medium animate-fadeIn"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCommitHash = searchParams.get('commit');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts: Press / or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch active repository details
  const { data: activeRepoData, isLoading: isRepoLoading, isError: isRepoError } = useQuery<{
    success: boolean;
    data: RepositoryDetails | null;
  }>({
    queryKey: ['activeRepository'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/repositories/active`);
      if (!res.ok) throw new Error('API offline');
      return res.json();
    },
  });

  const activeRepo = activeRepoData?.data;

  // 2. Fetch paginated commits log from active repo (reactive on search input)
  const {
    data: commitsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCommitsLoading,
    isError: isCommitsError,
  } = useInfiniteQuery({
    queryKey: ['commits', activeRepo?.repositoryId, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `${API_BASE}/repositories/${activeRepo?.repositoryId}/commits?page=${pageParam}&limit=10&search=${encodeURIComponent(debouncedSearch)}`
      );
      if (!res.ok) throw new Error('Failed to fetch commits');
      return res.json() as Promise<{ success: boolean; data: CommitMetadata[] }>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < 10) return undefined;
      return allPages.length + 1;
    },
    enabled: !!activeRepo?.repositoryId,
  });

  // Flatten paginated page structures
  const commits = commitsData?.pages.flatMap((page) => page.data) || [];

  // Handle Loading state for active repo
  if (isRepoLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#1e2030] rounded" />
        <div className="h-4 w-64 bg-[#1e2030] rounded" />
        <div className="space-y-4 pt-6">
          <div className="h-28 w-xl bg-[#0c0d14] rounded border border-[#1e2030]" />
          <div className="h-28 w-xl bg-[#0c0d14] rounded border border-[#1e2030]" />
        </div>
      </div>
    );
  }

  // Handle Offline state
  if (isRepoError) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-lg max-w-xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-sm font-semibold text-white">Connection Failure</h3>
        <p className="text-xs text-red-300">
          Failed to establish a connection to the backend REST API. Make sure the server is online at <code>localhost:3001</code>.
        </p>
      </div>
    );
  }

  // Handle Empty Repo State
  if (!activeRepo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Timeline</h2>
          <p className="text-xs text-[#626875]">Chronological commit history feed.</p>
        </div>

        <div className="p-8 bg-[#0c0d14] rounded-lg border border-[#1e2030] max-w-xl text-center space-y-4">
          <GitCommit className="w-12 h-12 text-[#626875] mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white">No repository selected</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              In order to generate and explore the commit timeline, you must first import a local Git repository.
            </p>
          </div>
          <Link
            to="/repositories"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
          >
            <span>Import Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Timeline</h2>
          <p className="text-xs text-[#626875]">
            Chronological commit stream for <span className="text-gray-300 font-medium font-mono">{activeRepo.name}</span> ({activeRepo.branch}).
          </p>
        </div>
        <div className="text-[10px] font-mono bg-[#0c0d14] border border-[#1e2030] px-3 py-1.5 rounded text-gray-500 flex items-center gap-2">
          <Database className="w-3.5 h-3.5" />
          <span>Active Path: {activeRepo.path}</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-lg">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search... (Press '/' or 'Cmd+K' to focus)"
          className="w-full bg-[#0c0d14] border border-[#1e2030] text-xs text-white rounded-md pl-10 pr-10 py-2.5 hover:border-[#2e3045] focus:outline-none focus:border-purple-500/80 transition-colors placeholder:text-gray-600"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white cursor-pointer"
            title="Clear Search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading Commits Placeholder */}
      {isCommitsLoading && (
        <div className="relative border-l border-[#1e2030] ml-3 pl-6 space-y-6 max-w-3xl pt-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="relative animate-pulse">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-[#090a0f] bg-[#1e2030]" />
              {/* Card wrapper */}
              <div className="p-4 rounded-lg border border-[#1e2030] bg-[#0c0d14]/40 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-16 bg-[#1e2030] rounded" />
                  <div className="h-3 w-20 bg-[#1e2030] rounded" />
                </div>
                <div className="h-4 w-3/4 bg-[#1e2030] rounded" />
                <div className="h-3 w-1/2 bg-[#1e2030] rounded pt-2 border-t border-[#1e2030]/50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error fetching commits */}
      {isCommitsError && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 rounded text-xs text-red-300 max-w-2xl">
          Error loading commits from repository. Ensure the directory path is still accessible.
        </div>
      )}

      {/* Commits Timeline Feed */}
      {!isCommitsLoading && commits.length === 0 && (
        <div className="p-8 bg-[#0c0d14] rounded border border-[#1e2030] max-w-2xl text-center space-y-2">
          <p className="text-xs text-gray-400">No commits matched your search filter.</p>
          <button 
            onClick={() => setSearch('')}
            className="text-[10px] text-purple-400 hover:underline font-mono"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {!isCommitsLoading && commits.length > 0 && (
        <div className="relative border-l border-[#1e2030] ml-3 pl-6 space-y-6 max-w-3xl">
          {commits.map((commit) => (
            <div key={commit.hash} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-[#090a0f] bg-purple-500 group-hover:bg-purple-400 transition-colors flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Commit Item Container */}
              <div 
                onClick={() => setSearchParams({ commit: commit.hash })}
                className={`p-4 rounded-lg border transition-all space-y-2.5 cursor-pointer animate-fadeIn
                  ${activeCommitHash === commit.hash 
                    ? 'bg-[#161722] border-purple-500/80 shadow-md shadow-purple-500/5' 
                    : 'bg-[#0c0d14] border-[#1e2030] hover:border-purple-500/30'
                  }`}
              >
                {/* Meta block */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-purple-400 font-semibold cursor-pointer hover:underline">
                    {highlightText(commit.hash.substring(0, 7), search)}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(commit.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Commit Msg */}
                <h3 className="text-xs font-medium text-white leading-normal">
                  {highlightText(commit.message, search)}
                </h3>

                {/* Author & Stats */}
                <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-2 border-t border-[#1e2030]/50">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono text-gray-400">
                      {highlightText(commit.author, search)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>{commit.filesChangedCount} files changed</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="pt-2 pl-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs bg-[#161722] hover:bg-[#1e2030] text-gray-200 border border-[#2e3045] px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isFetchingNextPage ? 'animate-spin' : ''}`} />
                <span>{isFetchingNextPage ? 'Loading more commits...' : 'Load More'}</span>
              </button>
            </div>
          )}

          {!hasNextPage && commits.length > 0 && (
            <p className="text-[10px] font-mono text-gray-600 pl-2">Reached end of commit history.</p>
          )}
        </div>
      )}
    </div>
  );
}
