import React, { useEffect } from 'react';
import { useDebate } from '../context/DebateContext';
import DebateScene3D from '../components/DebateScene3D';
import TopicInput from '../components/TopicInput';
import { motion } from 'framer-motion';

export default function Home() {
  const { startDebate, debateState, activeSpeaker, verdict, resetDebate } = useDebate();

  // Reset the debate state when hitting the Home page (stops any running WebSocket/replay)
  useEffect(() => {
    resetDebate();
  }, [resetDebate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-screen h-screen overflow-hidden text-slate-100 flex flex-col font-sans select-none"
    >
      {/* 3D background debate scene (in idle state) */}
      <DebateScene3D 
        state={debateState} 
        activeSpeaker={activeSpeaker} 
        verdict={verdict} 
      />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <div className="text-center mb-8 px-4 animate-fade-in mt-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent uppercase">
            Silicon Debate Chamber
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-2 max-w-md mx-auto">
            Synthesizing opposing perspectives on demand
          </p>
        </div>
        <TopicInput onSubmit={startDebate} disabled={debateState !== 'idle'} />
      </div>
    </motion.div>
  );
}
