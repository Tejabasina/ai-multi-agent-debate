import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal, Send, Sparkles } from 'lucide-react';
import Magnetic from './Magnetic';

const SUGGESTIONS = [
  "Should remote work be mandatory?",
  "Is artificial intelligence a threat to human creativity?",
  "Should space exploration be fully privatized?",
  "Should social media algorithms be heavily regulated?"
];

export default function TopicInput({ onSubmit, disabled }) {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim().length < 3) {
      setError('Debate topic must be at least 3 characters.');
      return;
    }
    setError('');
    onSubmit(topic);
  };

  const handleSuggestionClick = (suggestion) => {
    if (disabled) return;
    setTopic(suggestion);
    setError('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 z-10 animate-fade-in">
      <div className="glass-panel-heavy rounded-2xl p-7 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
        {/* Hologram neon top line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-white tracking-wide uppercase">
              {t('initiate_debate')}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
              neural core: waiting for topic prompt
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Arc / Linear command input capsule */}
          <div className="relative flex items-center bg-black/40 border border-white/5 hover:border-white/10 focus-within:border-indigo-500/50 rounded-xl px-4 py-3.5 transition-all duration-300 shadow-inner group">
            <Terminal className="w-4 h-4 text-slate-500 shrink-0 mr-3.5" />
            
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (e.target.value.trim().length >= 3) setError('');
              }}
              disabled={disabled}
              placeholder="Ex: Should space exploration be fully privatized?"
              className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none text-xs md:text-sm font-semibold tracking-wide disabled:opacity-50"
            />

            {/* Shortcut keycap micro-indicator */}
            {!topic.trim() && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                ENTER ↵
              </span>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-[10px] font-bold tracking-wider uppercase animate-pulse pl-1">
              {error}
            </p>
          )}

          {/* Magnetic execution button */}
          <div className="flex justify-end">
            <Magnetic>
              <button
                type="submit"
                disabled={disabled || !topic.trim()}
                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-900/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-xs tracking-widest uppercase"
              >
                {t('start_debate')}
                <Send className="w-3.5 h-3.5" />
              </button>
            </Magnetic>
          </div>
        </form>

        {/* Suggestion pill grid */}
        <div className="mt-6 border-t border-slate-850 pt-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-0.5">
            {t('suggested_topics')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                disabled={disabled}
                className="text-left px-3.5 py-3 bg-slate-950/40 hover:bg-slate-900/50 border border-white/[0.02] hover:border-white/5 text-slate-400 hover:text-white rounded-lg text-xs transition-all duration-200 truncate disabled:opacity-50 font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
