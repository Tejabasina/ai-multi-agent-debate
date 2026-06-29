import { useState, useCallback, useRef, useEffect } from 'react';

export function useDebateSocket() {
  const [debateState, setDebateState] = useState('idle'); // 'idle' | 'debating' | 'judging' | 'verdict' | 'error'
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null); // 'A' | 'B' | 'J' (Judge) | null
  const [currentRound, setCurrentRound] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  const startDebate = useCallback((inputTopic) => {
    if (!inputTopic || inputTopic.trim().length < 3) {
      setError('Topic must be at least 3 characters long.');
      setDebateState('error');
      return;
    }

    // Reset states
    setTopic(inputTopic.trim());
    setMessages([]);
    setActiveSpeaker(null);
    setCurrentRound(1);
    setVerdict(null);
    setError(null);
    setStatusMessage('Connecting to debate chamber...');
    setDebateState('debating');

    // Setup WebSocket URL
    const isSecure = window.location.protocol === 'https:';
    const host = window.location.hostname;
    // Default to port 5000 on localhost, or use same host in production
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    const wsPort = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
    const wsUrl = `${wsProtocol}//${host}${wsPort}/debate`;

    console.log(`[useDebateSocket] Connecting to ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[useDebateSocket] Socket connection opened.');
      setStatusMessage('Debate channel open. Submitting topic...');
      socket.send(JSON.stringify({ topic: inputTopic.trim() }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[useDebateSocket] Received event:', data.type, data);

        switch (data.type) {
          case 'status':
            setStatusMessage(data.message);
            // Move into judging state if the judge is working
            if (data.message.toLowerCase().includes('judge is evaluating')) {
              setDebateState('judging');
              setActiveSpeaker('J');
            }
            break;

          case 'agent_message': {
            const { speaker, text, round, done } = data;
            
            // Set speaker focus
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
            break;

          default:
            console.warn('[useDebateSocket] Unknown event type:', data.type);
        }
      } catch (err) {
        console.error('[useDebateSocket] Error parsing message:', err);
      }
    };

    socket.onerror = (err) => {
      console.error('[useDebateSocket] WebSocket error:', err);
      setError('Connection failed. Please ensure the backend server is running.');
      setDebateState('error');
      setActiveSpeaker(null);
    };

    socket.onclose = () => {
      console.log('[useDebateSocket] Socket connection closed.');
    };
  }, []);

  const resetDebate = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setDebateState('idle');
    setTopic('');
    setMessages([]);
    setActiveSpeaker(null);
    setCurrentRound(1);
    setVerdict(null);
    setError(null);
    setStatusMessage('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    debateState,
    topic,
    messages,
    activeSpeaker,
    currentRound,
    verdict,
    statusMessage,
    error,
    startDebate,
    resetDebate,
  };
}
