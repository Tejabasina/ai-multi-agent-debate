import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles } from 'lucide-react';

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
    <div className="w-full max-w-2xl mx-auto px-4 z-10 transition-all duration-700 animate-fade-in">
      <div className="glass-panel rounded-2xl p-8 border border-white/10 relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full"></div>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white tracking-wide">
              {t('initiate_debate')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Two AI agents will argue contrasting views, and an impartial judge will evaluate them.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (e.target.value.trim().length >= 3) setError('');
              }}
              disabled={disabled}
              placeholder="Enter a topic (e.g. Is universal basic income feasible?)..."
              className="w-full px-5 py-4 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 disabled:opacity-50 text-sm md:text-base font-medium"
            />
            {error && (
              <p className="text-red-400 text-xs mt-1.5 font-medium pl-1 animate-pulse">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={disabled || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-sm tracking-wider uppercase"
            >
              {t('start_debate')}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-800/60 pt-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {t('suggested_topics')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                disabled={disabled}
                className="text-left px-3.5 py-2.5 bg-slate-900/40 hover:bg-slate-800/50 border border-slate-800/40 hover:border-slate-700/60 text-slate-300 hover:text-white rounded-lg text-xs md:text-sm transition-all duration-200 truncate disabled:opacity-50"
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

