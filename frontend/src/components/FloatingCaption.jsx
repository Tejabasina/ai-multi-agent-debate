import React, { useState, useEffect, useRef } from 'react';

export default function FloatingCaption({ speaker, text, active }) {
  const [displayedText, setDisplayedText] = useState('');
  const textEndRef = useRef(null);

  // Typewriter effect that smoothly catches up with the stream
  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    const diff = text.length - displayedText.length;
    // Catch up faster if it falls behind significantly
    const stepSize = diff > 40 ? 5 : diff > 15 ? 2 : 1;

    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          return text.slice(0, prev.length + stepSize);
        }
        clearInterval(interval);
        return prev;
      });
    }, 12);

    return () => clearInterval(interval);
  }, [text, displayedText.length]);

  if (!active || !displayedText) return null;

  const isA = speaker === 'A';
  const themeText = isA ? 'Agent A' : 'Agent B';
  const themeRole = isA ? 'Optimist' : 'Risk Analyst';
  
  const badgeColorClass = isA
    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

  const glowColorClass = isA
    ? 'from-orange-500 to-red-500'
    : 'from-cyan-500 to-blue-500';

  // Detect Arabic script characters for RTL layout
  const isRtl = /[\u0600-\u06FF]/.test(text);

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl transition-all duration-300 transform scale-100 ease-out">
      <div className="glass-panel-heavy rounded-2xl border border-white/10 p-5 md:p-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow indicator top line */}
        <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${glowColorClass}`}></div>

        <div className={`flex items-center gap-2 mb-2.5 select-none ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColorClass}`}>
            {themeText}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {themeRole}
          </span>
        </div>

        <div 
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`text-slate-100 text-sm md:text-base font-medium leading-relaxed max-h-28 overflow-y-auto pr-1 font-sans select-text scroll-smooth ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          <span className="cursor-blink">{displayedText}</span>
          <div ref={textEndRef} />
        </div>
      </div>
    </div>
  );
}

