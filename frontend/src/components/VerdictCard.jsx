import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';

function CircularProgress({ score, color, label }) {
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg className="w-24 h-24 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground scoring circle */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>
        {/* Core text displaying percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-white font-mono tracking-tight">{score}</span>
        </div>
      </div>
      <div className="text-center select-none">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function VerdictCard({ verdict, onReset }) {
  const { t } = useTranslation();

  if (!verdict) return null;

  const { agentA_score, agentB_score, winner, reasoning } = verdict;
  const isWinnerA = winner === 'A';
  const isWinnerB = winner === 'B';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="glass-panel-heavy rounded-3xl p-8 border border-white/10 w-full max-w-xl shadow-2xl relative overflow-hidden my-auto"
      >
        {/* Background visual glows */}
        {isWinnerA ? (
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 blur-3xl rounded-full"></div>
        ) : (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full"></div>
        )}

        {/* Header Winner Segment */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`p-4 rounded-full mb-4 bg-slate-950 border ${
            isWinnerA 
              ? 'border-orange-500/30 text-orange-400 shadow-lg shadow-orange-500/5' 
              : 'border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/5'
          }`}>
            <Trophy className="w-7 h-7 animate-bounce" />
          </div>
          <h2 className="text-xl font-black tracking-wide font-display text-white uppercase">
            {t('verdict_delivered')}
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {t('winner')}: <span className={isWinnerA ? 'text-orange-400 font-extrabold' : 'text-cyan-400 font-extrabold'}>
              Agent {winner} ({isWinnerA ? 'Optimist' : 'Risk Analyst'})
            </span>
          </p>
        </div>

        {/* SVG Circular Data Visualizations side-by-side */}
        <div className="grid grid-cols-2 gap-4 bg-black/45 p-6 rounded-2xl border border-white/5 mb-6">
          <CircularProgress 
            score={agentA_score} 
            color="#ff5e57" 
            label="Agent A (Optimist)" 
          />
          <CircularProgress 
            score={agentB_score} 
            color="#00d2d3" 
            label="Agent B (Risk Analyst)" 
          />
        </div>

        {/* Reasoning panel */}
        <div className="border border-white/5 bg-white/[0.01] p-5 rounded-2xl mb-8 relative">
          <div className="flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-0.5">
                {t('judges_analysis')}
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-300 italic leading-relaxed select-text">
                "{reasoning}"
              </p>
            </div>
          </div>
        </div>

        {/* Start New Debate Button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-200 active:scale-[0.98] tracking-widest uppercase text-xs shadow-lg shadow-indigo-900/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('start_new_debate')}
        </button>

      </motion.div>
    </div>
  );
}
