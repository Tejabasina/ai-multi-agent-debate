import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import { useTranslation } from 'react-i18next';
import { LogIn, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, token } = useDebate();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to Home
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const host = window.location.hostname;
      const port = host === 'localhost' || host === '127.0.0.1' ? ':5000' : '';
      const protocol = window.location.protocol;
      const apiUrl = `${protocol}//${host}${port}/api/auth/login`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in.');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      console.error('[Login Error]', err);
      setError(err.message || 'Connection failure. Server might be offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#080b11] text-slate-100 flex flex-col items-center justify-center font-sans select-none px-6">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="w-full max-w-md animate-fade-in mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
            <LogIn className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-wider uppercase font-display bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
            {t('login')}
          </h1>
          <p className="text-xs text-slate-400 font-semibold tracking-widest mt-2.5 uppercase">
            Access the debate chamber
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full"></div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-medium p-3.5 rounded-xl mb-6 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-5 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 disabled:opacity-50 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                Password
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-5 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all duration-300 disabled:opacity-50 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-xs tracking-widest uppercase mt-2"
            >
              {loading ? 'Authenticating...' : t('login')}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/60 pt-5 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                {t('signup')} here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
