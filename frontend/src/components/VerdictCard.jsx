import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';

export default function VerdictCard({ verdict, onReset }) {
  const { t } = useTranslation();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger progress bar animations after mounting
    const t = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (!verdict) return null;

  const { agentA_score, agentB_score, winner, reasoning } = verdict;
  const isWinnerA = winner === 'A';
  const isWinnerB = winner === 'B';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="glass-panel-heavy rounded-2xl p-8 border border-white/10 w-full max-w-xl shadow-2xl relative overflow-hidden my-auto">
        
        {/* Glow Effects */}
        {isWinnerA ? (
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 blur-3xl rounded-full"></div>
        ) : (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-3xl rounded-full"></div>
        )}

        {/* Winner Announcement */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-4 rounded-full mb-4 bg-slate-900 border ${
            isWinnerA 
              ? 'border-orange-500/30 text-orange-400 shadow-lg shadow-orange-500/10' 
              : 'border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10'
          }`}>
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black tracking-wide font-display text-white uppercase">
            {t('verdict_delivered')}
          </h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            {t('winner')}: <span className={isWinnerA ? 'text-orange-400' : 'text-cyan-400'}>
              Agent {winner} ({isWinnerA ? 'Optimist' : 'Risk Analyst'})
            </span>
          </p>
        </div>

        {/* Score Bars Section */}
        <div className="space-y-6 bg-slate-950/40 p-5 rounded-xl border border-slate-800/40 mb-6">
          {/* Agent A Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold tracking-wider uppercase text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                Agent A (Optimist)
              </span>
              <span className="text-orange-400 font-mono text-sm">{agentA_score}/100</span>
            </div>
            <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-orange-600 to-red-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animate ? `${agentA_score}%` : '0%' }}
              ></div>
            </div>
          </div>

          {/* Agent B Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold tracking-wider uppercase text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                Agent B (Risk Analyst)
              </span>
              <span className="text-cyan-400 font-mono text-sm">{agentB_score}/100</span>
            </div>
            <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animate ? `${agentB_score}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Judge's Reasoning */}
        <div className="border border-white/5 bg-white/[0.02] p-5 rounded-xl mb-8 relative">
          <div className="flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                {t('judges_analysis')}
              </p>
              <p className="text-sm font-medium text-slate-300 italic leading-relaxed select-text">
                "{reasoning}"
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white font-bold rounded-xl transition-all duration-200 active:scale-[0.98] tracking-widest uppercase text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('start_new_debate')}
        </button>

      </div>
    </div>
  );
}

