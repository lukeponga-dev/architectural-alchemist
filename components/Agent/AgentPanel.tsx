'use client';

import { useState } from 'react';

interface AgentPanelProps {
  message?: string;
}

export default function AgentPanel({ message = "Architectural Alchemist Ready" }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: Failed to generate design');
    }
    setLoading(false);
  };

  return (
    <div className="backdrop-blur-lg bg-white/20 p-4 sm:p-6 rounded-xl text-cyan-400 font-mono space-y-4 max-w-full mx-auto">
      <div className="text-base sm:text-lg font-bold text-center sm:text-left">{message}</div>
      
      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your architectural vision..."
          className="w-full p-2 sm:p-3 bg-black/30 rounded-lg text-white placeholder-gray-400 border border-cyan-400/30 focus:border-cyan-400 focus:outline-none text-sm sm:text-base resize-none"
          rows={3}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
        >
          {loading ? 'Generating...' : 'Generate Design'}
        </button>
      </div>
      
      {response && (
        <div className="mt-4 p-3 sm:p-4 bg-black/30 rounded-lg border border-cyan-400/30 max-h-60 sm:max-h-80 overflow-y-auto">
          <div className="text-xs sm:text-sm text-gray-300 mb-2 font-medium">AI Response:</div>
          <div className="text-white whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{response}</div>
        </div>
      )}
    </div>
  );
}
