import React, { useState, useEffect, useRef } from 'react';

export default function SpeechBubble({ speaker, text, active }) {
  const [displayedText, setDisplayedText] = useState('');
  const containerRef = useRef(null);

  // Typewriter effect that catches up with the incoming streaming text
  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    // If the difference is huge (like page load), catch up faster
    const diff = text.length - displayedText.length;
    const stepSize = diff > 30 ? 3 : 1;

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          return text.slice(0, prev.length + stepSize);
        }
        clearInterval(interval);
        return prev;
      });
    }, 15);

    return () => clearInterval(interval);
  }, [text, displayedText.length]);

  // Auto-scroll when new text types out
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  if (!active || !displayedText) return null;

  const isA = speaker === 'A';
  const isB = speaker === 'B';
  const isJ = speaker === 'J';

  // Position bubbles relative to screen layout
  const positionClass = isA
    ? 'bottom-8 left-4 md:left-12'
    : isB
    ? 'bottom-8 right-4 md:right-12'
    : 'bottom-8 left-1/2 -translate-x-1/2';

  const themeClass = isA
    ? 'border-orange-500/40 shadow-orange-500/10'
    : isB
    ? 'border-cyan-500/40 shadow-cyan-500/10'
    : 'border-amber-400/40 shadow-amber-400/10';

  const titleText = isA
    ? 'Agent A (Optimist)'
    : isB
    ? 'Agent B (Risk Analyst)'
    : 'The Judge';

  const titleColor = isA
    ? 'text-orange-400'
    : isB
    ? 'text-cyan-400'
    : 'text-amber-400';

  return (
    <div
      className={`absolute ${positionClass} z-20 w-[90%] md:w-[450px] transition-all duration-500 transform scale-100 ease-out`}
    >
      <div
        className={`glass-panel-heavy rounded-2xl border p-5 ${themeClass} shadow-2xl relative overflow-hidden`}
      >
        {/* Glow indicator */}
        <div
          className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${
            isA
              ? 'from-orange-500 to-red-500'
              : isB
              ? 'from-cyan-500 to-blue-500'
              : 'from-amber-400 to-yellow-500'
          }`}
        ></div>

        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>
            {titleText}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wider bg-slate-900 px-2 py-0.5 rounded">
            Live Stream
          </span>
        </div>

        <div
          ref={containerRef}
          className="text-slate-100 text-sm leading-relaxed max-h-32 overflow-y-auto pr-1 font-medium select-text scroll-smooth"
        >
          <span className="cursor-blink">{displayedText}</span>
        </div>
      </div>
    </div>
  );
}
