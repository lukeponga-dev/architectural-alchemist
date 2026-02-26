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
      const res = await fetch('/api/generate', {
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
    <div className="backdrop-blur-lg bg-white/20 p-6 rounded-xl text-cyan-400 font-mono space-y-4">
      <div className="text-lg font-bold">{message}</div>
      
      <div className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your architectural vision..."
          className="w-full p-3 bg-black/30 rounded-lg text-white placeholder-gray-400 border border-cyan-400/30 focus:border-cyan-400 focus:outline-none"
          rows={4}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Design'}
        </button>
      </div>
      
      {response && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-cyan-400/30">
          <div className="text-sm text-gray-300 mb-2">AI Response:</div>
          <div className="text-white whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
}
