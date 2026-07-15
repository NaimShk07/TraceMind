import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  Terminal, 
  User, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  GitCommit,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import type { RepositoryDetails, ChatResponse, EvidenceItem } from '@tracemind/shared';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  confidence?: number;
  evidence?: EvidenceItem[];
}

export default function Investigation() {
  const [query, setQuery] = useState('');
  const [, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      sender: 'assistant', 
      text: "Hello! I am your TraceMind agent. Ask me any question about the codebase's history or file details (e.g. 'Is there a memory leak in the buffer allocation?'). I will analyze Git history, compile relevant diffs, and generate an evidence-backed answer." 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat log whenever messages list changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch active repository
  const { data: activeRepoResponse, isLoading: isRepoLoading, isError: isRepoError } = useQuery<{
    success: boolean;
    data: RepositoryDetails | null;
  }>({
    queryKey: ['activeRepository'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/repositories/active');
      if (!res.ok) throw new Error('API offline');
      return res.json();
    }
  });

  const activeRepo = activeRepoResponse?.data;

  // 2. Chat Mutation hook
  const chatMutation = useMutation<
    { success: boolean; data: ChatResponse },
    Error,
    { question: string }
  >({
    mutationFn: async ({ question }) => {
      const res = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryId: activeRepo!.repositoryId,
          question,
        }),
      });
      if (!res.ok) throw new Error('AI analysis failed');
      return res.json();
    },
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: response.data.answer,
          confidence: response.data.confidence,
          evidence: response.data.evidence,
        },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Sorry, I encountered an error during analysis: ${error.message}. Please make sure the repository is readable.`,
        },
      ]);
    },
  });

  const handleSend = (questionText: string) => {
    if (!questionText.trim() || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { sender: 'user', text: questionText }]);
    setQuery('');

    chatMutation.mutate({ question: questionText });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(query);
  };

  // Suggested Prompts List
  const suggestedPrompts = [
    'Is there a memory leak in socket connection pool?',
    'Explain the changes in the latest commits.',
    'Find commits modifying package.json.'
  ];

  // Render Loader / Connection Errors
  if (isRepoLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#1e2030] rounded" />
        <div className="h-4 w-64 bg-[#1e2030] rounded" />
        <div className="h-96 bg-[#0c0d14] rounded border border-[#1e2030]" />
      </div>
    );
  }

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

  // Handle Empty repository select warning
  if (!activeRepo) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>AI Investigator</span>
          </h2>
          <p className="text-xs text-[#626875]">Run natural language queries to investigate root causes of bugs.</p>
        </div>

        <div className="p-8 bg-[#0c0d14] rounded-lg border border-[#1e2030] max-w-xl text-center space-y-4">
          <GitCommit className="w-12 h-12 text-[#626875] mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white">No repository selected</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              In order to perform AI codebase investigations, you must first import a local Git repository.
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
    <div className="h-full flex flex-col justify-between space-y-4 max-w-4xl min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <span>AI Investigator</span>
        </h2>
        <p className="text-xs text-[#626875]">
          Analyze active repository <span className="text-gray-300 font-mono font-medium">{activeRepo.name}</span>.
        </p>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-[#0c0d14]/30 p-4 rounded-lg border border-[#1e2030] min-h-[350px] max-h-[500px]">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border
              ${msg.sender === 'user' 
                ? 'bg-purple-600/10 border-purple-500/20 text-purple-300' 
                : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-2 max-w-2xl min-w-0">
              <div className={`text-xs p-3 rounded-lg leading-relaxed whitespace-pre-wrap select-text
                ${msg.sender === 'user' 
                  ? 'bg-purple-600/10 text-purple-100 border border-purple-500/20' 
                  : 'bg-[#0c0d14] text-gray-300 border border-[#1e2030]'
                }`}
              >
                {msg.text}
              </div>

              {/* Confidence Badge & Evidence Rendering for Assistant responses */}
              {msg.sender === 'assistant' && (msg.confidence !== undefined || (msg.evidence && msg.evidence.length > 0)) && (
                <div className="p-3 bg-[#090a0f] rounded-lg border border-[#1e2030] text-[10px] space-y-2.5">
                  {/* Confidence meter */}
                  {msg.confidence !== undefined && (
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{Math.round(msg.confidence * 100)}% Confidence Score</span>
                    </div>
                  )}

                  {/* Evidence blocks list */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Evidence Collected</div>
                      <div className="space-y-1.5">
                        {msg.evidence.map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-[#0c0d14] border border-[#1e2030] p-2.5 rounded flex flex-col gap-1 min-w-0"
                          >
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <span className="font-semibold text-white truncate text-[10px]">{item.title}</span>
                              <span className="text-[8px] uppercase tracking-wider font-mono text-[#626875] shrink-0">{item.type}</span>
                            </div>
                            <p className="text-[#838b9c] leading-normal">{item.description}</p>
                            
                            {/* clickable hash link */}
                            {item.hash && (
                              <button
                                onClick={() => setSearchParams({ commit: item.hash })}
                                className="mt-1.5 self-start inline-flex items-center gap-1 font-mono text-[9px] bg-purple-950/20 text-purple-400 hover:text-purple-300 border border-purple-900/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                <span>Inspect diff {item.hash.substring(0, 7)}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading / Typing bubbles */}
        {chatMutation.isPending && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#0c0d14] text-gray-400 border border-[#1e2030] text-[10px] py-2 px-3 rounded-lg flex items-center gap-1.5">
              <span>TraceMind is analyzing codebase...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Block */}
      {messages.length === 1 && !chatMutation.isPending && (
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Suggested Investigations</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-left text-[11px] p-2.5 bg-[#0c0d14] hover:bg-[#161722] border border-[#1e2030] text-gray-300 hover:text-white rounded-md cursor-pointer transition-all active:scale-95 leading-normal"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Ask a question (e.g. Is there a memory leak in custom buffer allocator?)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={chatMutation.isPending}
          className="flex-1 bg-[#0c0d14] border border-[#1e2030] focus:border-purple-500/80 rounded-md py-2.5 px-4 text-xs text-white placeholder-gray-600 outline-none transition-colors disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!query.trim() || chatMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-[#1e2030] text-white disabled:text-gray-500 p-2.5 rounded-md cursor-pointer transition-colors active:scale-95 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
