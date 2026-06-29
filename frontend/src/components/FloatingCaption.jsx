import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function FloatingCaption({ speaker, text, active }) {
  const textEndRef = useRef(null);

  // Auto-scroll to the bottom of the subtitle box
  useEffect(() => {
    if (textEndRef.current) {
      textEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [text]);

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

  // Split text into words for stagger reveal animations
  const words = text ? text.split(' ') : [];

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="glass-panel-heavy rounded-2xl border border-white/10 p-5 md:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow indicator top line */}
        <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${glowColorClass}`}></div>

        <div className={`flex items-center gap-2 mb-3 select-none ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColorClass}`}>
            {themeText}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {themeRole}
          </span>
        </div>

        <div 
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`text-slate-100 text-sm md:text-base font-semibold leading-relaxed max-h-28 overflow-y-auto pr-1 font-sans select-text scroll-smooth ${
            isRtl ? 'text-right' : 'text-left'
          }`}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.4) }}
              className="inline-block mr-1.5"
            >
              {word}
            </motion.span>
          ))}
          <div ref={textEndRef} className="h-2" />
        </div>
      </motion.div>
    </div>
  );
}
