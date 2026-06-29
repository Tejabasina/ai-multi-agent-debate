import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel rounded-2xl p-8 border border-white/10 max-w-sm w-full text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Animated ambient background ring */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full animate-pulse"></div>

        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute w-12 h-12 rounded-full border border-blue-500/20 animate-ping"></div>
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2 font-display">
          Chamber Working
        </h3>
        <p className="text-sm text-slate-400 font-medium">
          {message || 'Connecting to the AI Multi-Agent system...'}
        </p>
      </div>
    </div>
  );
}
