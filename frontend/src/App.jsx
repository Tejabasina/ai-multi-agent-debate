import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DebateProvider, useDebate } from './context/DebateContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DebatePage from './pages/DebatePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import LandingPage from './pages/LandingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

// Protected Route Wrapper to enforce JWT presence
function ProtectedRoute({ children }) {
  const { token } = useDebate();
  return token ? children : <Navigate to="/login" replace />;
}

// Sub-component to manage global smooth scroll & cursor styles
function AppContent() {
  const [loading, setLoading] = useState(true);
  const { token } = useDebate();

  // Initialize Lenis smooth scroll globally
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true
    });

    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden text-slate-100 flex flex-col font-sans bg-[#0A0A0A]">
      {/* Cinematic Custom Fluid Cursor */}
      <CustomCursor />


      {/* Cinematic log preloader intro */}
      <AnimatePresence mode="wait">
        {loading && (
          <Preloader onComplete={() => setLoading(false)} />
        )}
      </AnimatePresence>

      {/* Shared Header Navigation */}
      {token && <Navbar />}

      {/* Main Routing Views */}
      <Routes>
        {/* Public Auth Split Screen Landing Pages */}
        <Route path="/login" element={<LandingPage mode="login" />} />
        <Route path="/signup" element={<LandingPage mode="signup" />} />
        
        {/* Public Information Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* User Scoped Protected Workspace Pages */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/debate/:id" element={<ProtectedRoute><DebatePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <DebateProvider>
        <AppContent />
      </DebateProvider>
    </Router>
  );
}
