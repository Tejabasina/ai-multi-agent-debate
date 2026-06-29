import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DebateProvider, useDebate } from './context/DebateContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DebatePage from './pages/DebatePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Protected Route Wrapper to enforce JWT presence
function ProtectedRoute({ children }) {
  const { token } = useDebate();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <DebateProvider>
        <div className="relative w-screen h-screen overflow-hidden text-slate-100 flex flex-col font-sans select-none bg-[#06090e]">
          {/* Shared Header Navigation */}
          <Navbar />

          {/* Main Routing Views */}
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* User Scoped Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/debate/:id" element={<ProtectedRoute><DebatePage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

            {/* Fallback Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </DebateProvider>
    </Router>
  );
}


