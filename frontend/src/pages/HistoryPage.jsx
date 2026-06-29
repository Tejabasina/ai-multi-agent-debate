import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import { useTranslation } from 'react-i18next';
import { Calendar, Award, ExternalLink, Inbox, Loader2, AlertCircle, Globe } from 'lucide-react';

// Custom 3D Parallax Tilt Card Component

function TiltCard({ children, className }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    setTilt({ x: x * 8, y: y * -8 }); // max 8deg tilt
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(10px)`,
        transformStyle: 'preserve-3d'
      }}
    >
      <div style={{ transform: 'translateZ(25px)' }} className="h-full">
        {children}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { token } = useDebate();
  const { t } = useTranslation();
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const isSecure = window.location.protocol === 'https:';
        const host = window.location.hostname;
        const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
        const httpProtocol = isSecure ? 'https:' : 'http:';
        const apiUrl = `${httpProtocol}//${host}${port}/api/debates`;

        const res = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to load debates history.');
        }
        const data = await res.json();
        setDebates(data);
      } catch (err) {
        console.error('[HistoryPage Fetch Error]', err);
        setError(err.message || 'Could not fetch debates history.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDebates();
    }
  }, [token]);

  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col font-sans select-none pt-24 pb-12 px-6 overflow-y-auto">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
            {t('history')}
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Logs of all past debates associated with your account
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Retrieving archives...
            </p>
          </div>
        ) : error ? (
          <div className="glass-panel rounded-2xl p-8 border border-red-500/20 max-w-md mx-auto text-center flex flex-col items-center shadow-xl">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Retrieval Failed</h3>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
          </div>
        ) : debates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-white/5 bg-white/[0.01] rounded-2xl">
            <Inbox className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-base font-bold text-slate-400">Archives Empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
              No debates have been run yet. Head over to the Home page to start your first debate!
            </p>
            <Link
              to="/"
              className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg uppercase tracking-wider transition-all duration-200"
            >
              Start Debate
            </Link>
          </div>
        ) : (
          /* High-end Awwwards-style vertical timeline track */
          <div className="relative border-l border-white/10 pl-6 md:pl-10 ml-4 md:ml-6 space-y-12">
            {debates.map((debate) => {
              const isWinnerA = debate.winner === 'A';
              const isWinnerB = debate.winner === 'B';
              
              return (
                <div key={debate.id} className="relative">
                  {/* Timeline bullet node */}
                  <span className={`absolute -left-[31px] md:-left-[47px] top-6 w-4 h-4 rounded-full border bg-[#0A0A0A] z-10 transition-colors duration-300 ${
                    isWinnerA ? 'border-orange-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : isWinnerB ? 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'border-slate-600'
                  }`} />

                  <TiltCard className="w-full">
                    <div className="glass-panel hover:bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-lg group relative overflow-hidden">
                      {/* Left border indicator */}
                      <div className={`absolute top-0 left-0 w-[4px] h-full transition-transform duration-300 scale-y-0 group-hover:scale-y-100 ${
                        isWinnerA ? 'bg-orange-500' : isWinnerB ? 'bg-cyan-500' : 'bg-slate-500'
                      }`} />

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              ID: {debate.id.slice(0, 8)}...
                            </span>
                            {debate.language && (
                              <span className="flex items-center gap-1 text-[9px] text-blue-400 font-semibold uppercase tracking-wider bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                                <Globe className="w-2.5 h-2.5" />
                                {debate.language}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Calendar className="w-3 h-3 text-blue-500/80" />
                            {formatDate(debate.created_at)}
                          </div>
                        </div>

                        <h3 className="text-base md:text-lg font-bold text-slate-100 group-hover:text-white leading-snug select-text mb-5">
                          {debate.topic}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${
                            isWinnerA ? 'bg-orange-500/10 text-orange-400' : isWinnerB ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              Winner
                            </p>
                            <p className={`text-xs font-black uppercase tracking-wider ${
                              isWinnerA ? 'text-orange-400' : isWinnerB ? 'text-cyan-400' : 'text-slate-400'
                            }`}>
                              {debate.winner === 'A' ? 'Agent A (Optimist)' : debate.winner === 'B' ? 'Agent B (Risk)' : 'Draw'}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/debate/${debate.id}`}
                          className="flex items-center gap-1 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.97]"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

