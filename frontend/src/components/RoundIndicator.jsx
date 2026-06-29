import React from 'react';

export default function RoundIndicator({ state, currentRound, activeSpeaker }) {
  if (state === 'idle') return null;

  const getStatusLabel = () => {
    if (state === 'judging') {
      return "Judge Evaluating Transcript...";
    }
    if (state === 'verdict') {
      return "Verdict Delivered";
    }
    if (activeSpeaker === 'A') {
      return `Round ${currentRound}/2 — Agent A (Optimist) is speaking`;
    }
    if (activeSpeaker === 'B') {
      return `Round ${currentRound}/2 — Agent B (Risk Analyst) is speaking`;
    }
    return "Initializing chambers...";
  };

  const getIndicatorColor = () => {
    if (state === 'judging') return 'bg-yellow-400 shadow-yellow-500/20';
    if (state === 'verdict') return 'bg-green-500 shadow-green-500/20';
    if (activeSpeaker === 'A') return 'bg-orange-500 shadow-orange-500/20';
    if (activeSpeaker === 'B') return 'bg-cyan-400 shadow-cyan-500/20';
    return 'bg-blue-500 shadow-blue-500/20';
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg">
      <div className="glass-panel px-6 py-3.5 rounded-full border border-white/10 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getIndicatorColor()}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${getIndicatorColor()}`}></span>
          </span>
          <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase truncate">
            {getStatusLabel()}
          </span>
        </div>

        {state === 'debating' && (
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/60 px-3 py-1 rounded-full border border-white/5">
            <span className={`h-1.5 w-1.5 rounded-full ${currentRound >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
            <span className={`h-1.5 w-1.5 rounded-full ${currentRound >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              R{currentRound}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
