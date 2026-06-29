import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, RefreshCw } from 'lucide-react';

const BOOT_STEPS = [
  { icon: Terminal, text: "LOG_SYS: Initializing quantum debate kernels..." },
  { icon: Cpu, text: "LOG_AGENTS: Synapsing cognitive matrices... [Optimist A / Risk Analyst B]" },
  { icon: Shield, text: "LOG_SECURITY: Seeding JWT verification middleware & sandboxes..." },
  { icon: RefreshCw, text: "LOG_LOCALES: Parsing dictionary clusters... [EN, TE, HI, TA, ES, FR]" },
  { icon: Cpu, text: "LOG_CHAMBER: Synchronizing 3D round-table visual structures..." },
  { icon: Terminal, text: "STATUS: Debate core ready. Chamber active." }
];

export default function Preloader({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (currentStep < BOOT_STEPS.length) {
      const delay = currentStep === BOOT_STEPS.length - 1 ? 800 : Math.random() * 300 + 150;
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, BOOT_STEPS[currentStep]]);
        setCurrentStep((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 700);
      return () => clearTimeout(exitTimer);
    }
  }, [currentStep, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 bg-[#0A0A0A] z-[999999] flex flex-col items-center justify-center font-mono p-6 select-none"
    >
      {/* Noise background */}
      <div className="absolute inset-0 noise-overlay"></div>

      <div className="w-full max-w-xl flex flex-col gap-6 relative z-10">
        
        {/* Hologram Header info */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-slate-500 text-[10px] tracking-widest uppercase">
          <span>Boot sequence 4.19.2</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            Chamber Online
          </span>
        </div>

        {/* Boot steps terminal output logs */}
        <div className="bg-black/50 border border-white/5 rounded-xl p-6 min-h-[220px] flex flex-col justify-end gap-3.5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
          
          <AnimatePresence>
            {logs.map((step, idx) => {
              const StepIcon = step.icon;
              const isLast = idx === BOOT_STEPS.length - 1;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10, y: 5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-3 text-xs ${isLast ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}
                >
                  <StepIcon className={`w-3.5 h-3.5 shrink-0 ${isLast ? 'animate-spin' : ''}`} />
                  <span className="font-mono tracking-tight">{step.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar indicator */}
        <div className="w-full h-[2px] bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(logs.length / BOOT_STEPS.length) * 100}%` }}
            transition={{ duration: 0.2 }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
          />
        </div>

      </div>
    </motion.div>
  );
}
