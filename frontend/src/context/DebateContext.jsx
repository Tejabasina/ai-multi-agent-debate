import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DebateContext = createContext(null);

export function DebateProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [debateState, setDebateState] = useState('idle'); // 'idle' | 'debating' | 'judging' | 'verdict' | 'error'
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null); // 'A' | 'B' | 'J' | null
  const [currentRound, setCurrentRound] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [debateId, setDebateId] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);

  const socketRef = useRef(null);
  const navigate = useNavigate();
  const replayTimersRef = useRef([]);
  
  // Reconnect logic variables
  const hasReconnectedRef = useRef(false);
  const activeTopicRef = useRef('');

  // Authentication Helpers
  const login = useCallback((userToken, userDetails) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userDetails));
    setToken(userToken);
    setUser(userDetails);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    resetDebate();
    navigate('/login');
  }, [navigate]);

  const clearReplays = useCallback(() => {
    replayTimersRef.current.forEach((t) => clearTimeout(t));
    replayTimersRef.current = [];
  }, []);

  const resetDebate = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onclose = null; // Remove listener to avoid reconnect loops
      socketRef.current.close();
      socketRef.current = null;
    }
    clearReplays();
    setDebateState('idle');
    setTopic('');
    setMessages([]);
    setActiveSpeaker(null);
    setCurrentRound(1);
    setVerdict(null);
    setError(null);
    setStatusMessage('');
    setDebateId(null);
    setIsReplaying(false);
    hasReconnectedRef.current = false;
    activeTopicRef.current = '';
  }, [clearReplays]);

  // Starts the WebSocket stream connection
  const startDebate = useCallback((inputTopic, isReconnectAttempt = false) => {
    if (!inputTopic || inputTopic.trim().length < 3) {
      setError('Topic must be at least 3 characters long.');
      setDebateState('error');
      return;
    }

    if (!token) {
      setError('You must be logged in to start a debate.');
      setDebateState('error');
      navigate('/login');
      return;
    }

    if (!isReconnectAttempt) {
      clearReplays();
      hasReconnectedRef.current = false;
      activeTopicRef.current = inputTopic.trim();
      
      // Reset states only on fresh attempts
      setTopic(inputTopic.trim());
      setMessages([]);
      setActiveSpeaker(null);
      setCurrentRound(1);
      setVerdict(null);
      setError(null);
      setDebateId(null);
      setIsReplaying(false);
      setStatusMessage('Connecting to debate chamber...');
      setDebateState('debating');
    } else {
      setStatusMessage('Connection interrupted. Attempting to reconnect...');
    }

    const isSecure = window.location.protocol === 'https:';
    const host = window.location.hostname;
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    const wsPort = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
    // Append JWT token as query parameter
    const wsUrl = `${wsProtocol}//${host}${wsPort}/debate?token=${encodeURIComponent(token)}`;

    console.log(`[DebateContext] Connecting to WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[DebateContext] Socket connection opened.');
      setStatusMessage('Debate channel open. Submitting topic...');
      socket.send(JSON.stringify({ topic: inputTopic.trim() }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[DebateContext] Received event:', data.type, data);

        switch (data.type) {
          case 'init':
            setDebateId(data.id);
            navigate(`/debate/${data.id}`);
            break;

          case 'status':
            setStatusMessage(data.message);
            if (data.message.toLowerCase().includes('judge is evaluating')) {
              setDebateState('judging');
              setActiveSpeaker('J');
            }
            break;

          case 'agent_message': {
            const { speaker, text, round } = data;
            setActiveSpeaker(speaker);
            setCurrentRound(round);
            setDebateState('debating');

            if (text && text.length > 0) {
              setMessages((prev) => {
                const existingIndex = prev.findIndex(
                  (m) => m.speaker === speaker && m.round === round
                );
                if (existingIndex === -1) {
                  return [...prev, { speaker, text, round }];
                } else {
                  const updated = [...prev];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    text: updated[existingIndex].text + text,
                  };
                  return updated;
                }
              });
            }
            break;
          }

          case 'verdict':
            setVerdict({
              agentA_score: data.agentA_score,
              agentB_score: data.agentB_score,
              winner: data.winner,
              reasoning: data.reasoning,
            });
            setActiveSpeaker(null);
            setDebateState('verdict');
            setStatusMessage('Verdict delivered.');
            break;

          case 'error':
            setError(data.message || 'An error occurred during debate streaming.');
            setDebateState('error');
            setActiveSpeaker(null);
            if (socketRef.current) {
              socketRef.current.close();
            }
            break;

          default:
            console.warn('[DebateContext] Unknown event type:', data.type);
        }
      } catch (err) {
        console.error('[DebateContext] Error parsing message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('[DebateContext] WebSocket error:', err);
    };

    socket.onclose = (event) => {
      console.log('[DebateContext] Socket connection closed.', event.reason);
      
      // Auto-reconnect implementation
      const wasInterrupted = debateState === 'debating' || debateState === 'judging';
      if (wasInterrupted && !hasReconnectedRef.current && activeTopicRef.current) {
        console.log('[DebateContext] WebSocket disconnected mid-debate. Attempting reconnect...');
        hasReconnectedRef.current = true;
        startDebate(activeTopicRef.current, true);
      } else if (wasInterrupted && hasReconnectedRef.current) {
        console.log('[DebateContext] Reconnect attempt failed.');
        setError('Connection lost, please try again.');
        setDebateState('error');
        setActiveSpeaker(null);
      }
    };
  }, [token, navigate, clearReplays, debateState]);

  // Replay simulated historical debate
  const replayDebate = useCallback((savedDebate) => {
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    clearReplays();

    setTopic(savedDebate.topic);
    setMessages([]);
    setActiveSpeaker(null);
    setCurrentRound(1);
    setVerdict(null);
    setError(null);
    setDebateId(savedDebate.id);
    setIsReplaying(true);
    setDebateState('debating');

    const transcript = savedDebate.transcript;
    const finalVerdict = savedDebate.verdict;

    let timeAcc = 300;

    transcript.forEach((msg) => {
      const textLength = msg.text.length;
      const chunkSize = 15;
      const stepDelay = 25;

      const speakStartTimer = setTimeout(() => {
        setActiveSpeaker(msg.speaker);
        setCurrentRound(msg.round);
        setDebateState('debating');
        setMessages((prev) => [...prev, { speaker: msg.speaker, text: '', round: msg.round }]);
      }, timeAcc);
      replayTimersRef.current.push(speakStartTimer);

      timeAcc += 150;

      for (let i = 0; i < textLength; i += chunkSize) {
        const textChunk = msg.text.substring(i, i + chunkSize);
        const chunkTimer = setTimeout(() => {
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex(m => m.speaker === msg.speaker && m.round === msg.round);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], text: updated[idx].text + textChunk };
            }
            return updated;
          });
        }, timeAcc);
        replayTimersRef.current.push(chunkTimer);
        timeAcc += stepDelay;
      }

      timeAcc += 1500;
    });

    const judgingTimer = setTimeout(() => {
      setDebateState('judging');
      setActiveSpeaker('J');
      setStatusMessage('The Judge is evaluating the debate...');
    }, timeAcc);
    replayTimersRef.current.push(judgingTimer);

    timeAcc += 3000;

    const verdictTimer = setTimeout(() => {
      setVerdict(finalVerdict);
      setActiveSpeaker(null);
      setDebateState('verdict');
      setStatusMessage('Verdict delivered.');
    }, timeAcc);
    replayTimersRef.current.push(verdictTimer);

  }, [clearReplays]);

  // Clean up
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
      clearReplays();
    };
  }, [clearReplays]);

  return (
    <DebateContext.Provider
      value={{
        token,
        user,
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
        login,
        logout,
        startDebate,
        resetDebate,
        replayDebate,
      }}
    >
      {children}
    </DebateContext.Provider>
  );
}

export function useDebate() {
  return useContext(DebateContext);
}
