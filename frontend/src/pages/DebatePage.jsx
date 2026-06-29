import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import DebateScene3D from '../components/DebateScene3D';
import RoundIndicator from '../components/RoundIndicator';
import FloatingCaption from '../components/FloatingCaption';
import VerdictCard from '../components/VerdictCard';
import LoadingState from '../components/LoadingState';
import { AlertOctagon, Loader2, Globe, ArrowLeftRight } from 'lucide-react';

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

  // Reset translations if the debate resets or changes
  useEffect(() => {
    setTargetLang('original');
    setTranslatedMessages(null);
    setTranslatedVerdict(null);
    setTranslationError('');
  }, [debateId]);

  // Handle translation requests
  const handleTranslate = async (e) => {
    const selectedLangName = e.target.value;
    setTargetLang(selectedLangName);
    setTranslationError('');

    if (selectedLangName === 'original') {
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
          target_language: selectedLangName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Translation request failed.');
      }

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
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#06090e] text-slate-200">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Retrieving debate archives...
        </p>
      </div>
    );
  }

  const showErr = error || fetchError;

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-100 flex flex-col font-sans select-none">
      {/* 3D background debate scene */}
      <DebateScene3D 
        state={debateState} 
        activeSpeaker={activeSpeaker} 
        verdict={displayVerdict} 
      />

      {/* Top Floating Widgets (Translate / Replay Mode) */}
      <div className="absolute top-20 right-6 z-20 flex flex-col sm:flex-row items-end sm:items-center gap-3">
        {/* Translation Widget Dropdown */}
        {debateId && debateState !== 'idle' && debateState !== 'error' && (
          <div className="flex items-center gap-2 bg-slate-950/65 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg shadow-lg relative">
            {translating ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )}
            
            <select
              value={targetLang}
              onChange={handleTranslate}
              disabled={translating}
              className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="original" className="bg-slate-950 text-slate-300">
                Original Language
              </option>
              {TRANSLATION_LANGUAGES.map((l, idx) => (
                <option key={idx} value={l.name} className="bg-slate-950 text-slate-300">
                  Translate to {l.name}
                </option>
              ))}
            </select>

            {translationError && (
              <div className="absolute -bottom-6 right-0 text-[10px] text-red-400 font-bold bg-slate-950/90 px-2 py-0.5 rounded border border-red-500/10">
                {translationError}
              </div>
            )}
          </div>
        )}

        {/* Replay indicator overlay */}
        {isReplaying && debateState !== 'idle' && debateState !== 'error' && (
          <div className="flex items-center gap-2 bg-slate-950/65 backdrop-blur border border-amber-500/20 px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
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
