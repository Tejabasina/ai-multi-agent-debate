import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import { motion, AnimatePresence } from 'framer-motion';
import DebateScene3D from '../components/DebateScene3D';
import RoundIndicator from '../components/RoundIndicator';
import FloatingCaption from '../components/FloatingCaption';
import VerdictCard from '../components/VerdictCard';
import LoadingState from '../components/LoadingState';
import { AlertOctagon, Loader2, Globe, ChevronDown, Check } from 'lucide-react';

const TRANSLATION_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
  { code: 'bn', name: 'Bengali' }
];

export default function DebatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    token,
    debateState,
    topic,
    messages,
    activeSpeaker,
    currentRound,
    verdict,
    statusMessage,
    error,
    debateId,
    isReplaying,
    resetDebate,
    replayDebate,
  } = useDebate();

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Translation States
  const [targetLang, setTargetLang] = useState('original');
  const [translating, setTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState(null);
  const [translatedVerdict, setTranslatedVerdict] = useState(null);
  const [translationError, setTranslationError] = useState('');
  
  // Floating dropdown UI toggle state
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch debate details if opened directly from list
  useEffect(() => {
    if (id && debateId !== id) {
      const fetchSavedDebate = async () => {
        setLoading(true);
        setFetchError(null);
        try {
          const isSecure = window.location.protocol === 'https:';
          const host = window.location.hostname;
          const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
          const httpProtocol = isSecure ? 'https:' : 'http:';
          const apiUrl = `${httpProtocol}//${host}${port}/api/debates/${id}`;

          const res = await fetch(apiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error('This debate could not be found in the archives.');
            }
            throw new Error('Failed to retrieve the debate details.');
          }

          const data = await res.json();
          replayDebate(data);
        } catch (err) {
          console.error('[DebatePage Fetch Error]', err);
          setFetchError(err.message || 'Error loading saved debate.');
        } finally {
          setLoading(false);
        }
      };

      fetchSavedDebate();
    }
  }, [id, debateId, replayDebate, token]);

  // Reset translations if debate resets
  useEffect(() => {
    setTargetLang('original');
    setTranslatedMessages(null);
    setTranslatedVerdict(null);
    setTranslationError('');
  }, [debateId]);

  // Collapse dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle translation requests
  const handleTranslateLanguage = async (langName) => {
    setMenuOpen(false);
    setTargetLang(langName);
    setTranslationError('');

    if (langName === 'original') {
      setTranslatedMessages(null);
      setTranslatedVerdict(null);
      return;
    }

    setTranslating(true);

    try {
      const host = window.location.hostname;
      const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
      const protocol = window.location.protocol;
      const apiUrl = `${protocol}//${host}${port}/api/translate`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          debate_id: debateId,
          target_language: langName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation request failed.');

      setTranslatedMessages(data.transcript);
      setTranslatedVerdict(data.verdict);
    } catch (err) {
      console.error('[Translation Failure]', err);
      setTranslationError(err.message || 'Translation unavailable.');
      setTargetLang('original');
    } finally {
      setTranslating(false);
    }
  };

  // Determine active display data (Original or Translated)
  const displayMessages = translatedMessages || messages;
  const displayVerdict = translatedVerdict || verdict;

  const activeMessageObj = displayMessages.find(
    (m) => m.speaker === activeSpeaker && m.round === currentRound
  );
  const activeMessageText = activeMessageObj ? activeMessageObj.text : '';

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-slate-200">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Retrieving debate archives...
        </p>
      </div>
    );
  }

  const showErr = error || fetchError;

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-100 flex flex-col font-sans select-none bg-[#0A0A0A]">
      {/* 3D background debate scene */}
      <DebateScene3D 
        state={debateState} 
        activeSpeaker={activeSpeaker} 
        verdict={displayVerdict} 
      />

      {/* Top Floating Widgets (Morphing Translate Dropdown / Replay Mode) */}
      <div className="absolute top-20 right-6 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-3">
        
        {/* Floating Glass Morphing Translation Toggle */}
        {debateId && debateState !== 'idle' && debateState !== 'error' && (
          <div ref={dropdownRef} className="relative">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={translating}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/5 px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300"
            >
              {translating ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {targetLang === 'original' ? 'Original' : targetLang}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${menuOpen ? 'rotate-180' : 'rotate-0'}`} />
            </motion.button>

            {/* Translation error messages */}
            {translationError && (
              <div className="absolute -bottom-6 right-0 text-[9px] text-red-400 font-bold bg-black/90 px-2.5 py-0.5 rounded border border-red-500/10">
                {translationError}
              </div>
            )}

            {/* Morphing dropdown languages selection */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl scroll-smooth z-50"
                >
                  <button
                    onClick={() => handleTranslateLanguage('original')}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-between"
                  >
                    <span>Original Language</span>
                    {targetLang === 'original' && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>
                  <div className="h-[1px] bg-white/5 my-1.5" />
                  {TRANSLATION_LANGUAGES.map((l, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTranslateLanguage(l.name)}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-between"
                    >
                      <span>{l.name}</span>
                      {targetLang === l.name && <Check className="w-3 h-3 text-indigo-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Replay indicator overlay */}
        {isReplaying && debateState !== 'idle' && debateState !== 'error' && (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-amber-500/20 px-4 py-2.5 rounded-xl shadow-2xl animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Replay Mode
            </span>
          </div>
        )}
      </div>

      {/* Round Indicator */}
      {debateState !== 'idle' && debateState !== 'error' && !showErr && (
        <RoundIndicator
          state={debateState}
          currentRound={currentRound}
          activeSpeaker={activeSpeaker}
        />
      )}

      {/* Subtitle / Floating Captions */}
      {debateState === 'debating' && activeSpeaker && !showErr && (
        <FloatingCaption
          speaker={activeSpeaker}
          text={activeMessageText}
          active={true}
        />
      )}

      {/* Judging Standby */}
      {debateState === 'judging' && !showErr && (
        <LoadingState message={statusMessage} />
      )}

      {/* Verdict Overlay */}
      {debateState === 'verdict' && !showErr && (
        <VerdictCard verdict={displayVerdict} onReset={() => navigate('/')} />
      )}

      {/* Error Overlay */}
      {showErr && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="glass-panel rounded-2xl p-8 border border-red-500/20 max-w-md w-full text-center flex flex-col items-center shadow-2xl animate-fade-in">
            <div className="p-3.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-500 mb-4">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Chamber Disrupted
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {showErr}
            </p>
            <button
              onClick={() => {
                resetDebate();
                navigate('/');
              }}
              className="px-6 py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 font-semibold rounded-xl text-xs tracking-wider uppercase transition-all duration-200 w-full"
            >
              Return to Chamber Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
