import React from 'react';
import { Cpu, Scale, HelpCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-screen min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans select-none pt-24 pb-12 px-6 overflow-y-auto">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
            About Silicon Debate
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Understanding the Multi-Agent Orchestration Architecture
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Section 1: Overview */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 mb-4">
              <Cpu className="w-5 h-5 text-blue-400" />
              Project Concept
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Silicon Debate Chamber is a fully automated multi-agent AI debate chamber. 
              By inputting a topic, users initiate a two-round structured debate between two specialized 
              autonomous AI personas. The conversation is generated dynamically in real-time, streamed 
              over WebSockets, and ultimately reviewed by a third impartial judge agent who scores their 
              performance and delivers a structured reasoning report.
            </p>
          </div>

          {/* Section 2: Agent Architecture */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 mb-6">
              <Scale className="w-5 h-5 text-indigo-400" />
              The Tri-Agent Architecture
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent A Card */}
              <div className="bg-slate-950/40 border border-orange-500/10 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500"></div>
                <h3 className="font-bold text-sm text-orange-400 uppercase tracking-wider mb-2">
                  Agent A: The Optimist
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configured with an growth-focused persona. It champions progress, technological innovation, 
                  societal expansion, and immediate constructive benefits of the topic.
                </p>
              </div>

              {/* Agent B Card */}
              <div className="bg-slate-950/40 border border-cyan-500/10 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500"></div>
                <h3 className="font-bold text-sm text-cyan-400 uppercase tracking-wider mb-2">
                  Agent B: The Risk Analyst
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configured with a cautious, risk-averse persona. It analyzes technical trade-offs, security, 
                  ethical implications, societal vulnerabilities, and systemic side effects.
                </p>
              </div>

              {/* Judge Card */}
              <div className="bg-slate-950/40 border border-amber-400/10 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-400"></div>
                <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider mb-2">
                  The Judge
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  An impartial, highly analytical judge. Evaluates the transcripts of both rounds for factual soundness, 
                  logical coherence, and rhetorical effectiveness, outputting a precise score and structured analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Stack */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 mb-4">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Technology Stack
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300 leading-relaxed">
              <div className="space-y-3">
                <p>
                  <strong className="text-slate-100 font-semibold">Backend:</strong> Node.js, Express, and native WebSockets (`ws` package) to stream model completions block-by-block.
                </p>
                <p>
                  <strong className="text-slate-100 font-semibold">AI Completion:</strong> Integrates Anthropic's Claude API client to manage system prompts, user contexts, and stream generations.
                </p>
                <p>
                  <strong className="text-slate-100 font-semibold">Database:</strong> SQLite via `better-sqlite3` to persist debate records (including topic, text transcripts, scoring, reasoning, and time logs).
                </p>
              </div>
              <div className="space-y-3">
                <p>
                  <strong className="text-slate-100 font-semibold">Frontend:</strong> React (Single Page Application) with modern React Router (`react-router-dom`) for navigation.
                </p>
                <p>
                  <strong className="text-slate-100 font-semibold">3D Environment:</strong> Rendered in real-time using WebGL via Three.js through `@react-three/fiber` and `@react-three/drei`.
                </p>
                <p>
                  <strong className="text-slate-100 font-semibold">Styling:</strong> Tailwind CSS for responsive layouts and custom CSS tokens for premium glassmorphism.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
