import { useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Sparkles, Terminal, User } from 'lucide-react';

export default function Investigation() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: "Hello! I am your TraceMind agent. Ask me any question about the codebase's history or file details (e.g. 'Why is auth failing?'). I will query Git history and compile an evidence-backed answer." }
  ]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setQuery('');

    // Simulate agent typing
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'assistant', 
          text: `I received your investigation request for: "${userMessage}".\n\nDuring this milestone, backend execution is in mock mode. Once fully hooked up, I will crawl commits, analyze diffs, and present files here with a confidence score and a debugging walkthrough.` 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-4 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>AI Investigator</span>
        </h2>
        <p className="text-xs text-[#626875]">Run natural language queries to investigate root causes of bugs and track code changes.</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 bg-[#0c0d14]/30 p-4 rounded-lg border border-[#1e2030] min-h-[300px]">
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
            <div className={`text-xs p-3 rounded-lg leading-relaxed whitespace-pre-wrap
              ${msg.sender === 'user' 
                ? 'bg-purple-600/10 text-purple-100 border border-purple-500/20' 
                : 'bg-[#0c0d14] text-gray-300 border border-[#1e2030]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Ask a question (e.g. Why is authentication broken?)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-[#0c0d14] border border-[#1e2030] focus:border-purple-500 rounded-md py-2.5 px-4 text-xs text-white placeholder-gray-600 outline-none transition-colors"
        />
        <button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-md cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
