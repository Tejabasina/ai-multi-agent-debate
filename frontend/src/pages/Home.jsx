import React, { useEffect } from 'react';
import { useDebate } from '../context/DebateContext';
import DebateScene3D from '../components/DebateScene3D';
import TopicInput from '../components/TopicInput';

export default function Home() {
  const { startDebate, debateState, activeSpeaker, verdict, resetDebate } = useDebate();

  // Reset the debate state when hitting the Home page (stops any running WebSocket/replay)
  useEffect(() => {
    resetDebate();
  }, [resetDebate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-100 flex flex-col font-sans select-none">
      {/* 3D background debate scene (in idle state) */}
      <DebateScene3D 
        state={debateState} 
        activeSpeaker={activeSpeaker} 
        verdict={verdict} 
      />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-8 px-4 animate-fade-in mt-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-display bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent uppercase drop-shadow">
            Silicon Debate Chamber
          </h1>
          <p className="text-sm md:text-base font-semibold text-slate-400 uppercase tracking-widest mt-3.5 max-w-md mx-auto">
            Synthesizing opposing perspectives on demand
          </p>
        </div>
        <TopicInput onSubmit={startDebate} disabled={debateState !== 'idle'} />
      </div>
    </div>
  );
}
