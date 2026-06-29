import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useDebate } from '../context/DebateContext';
import { useTranslation } from 'react-i18next';
import { History, Info, Home, LogOut, LogIn, UserPlus, BarChart3, Globe } from 'lucide-react';

export default function Navbar() {
  const { token, user, logout } = useDebate();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('ui_lang', lang);
  };

  return (
    <header className="absolute top-0 left-0 w-full z-45 bg-slate-950/40 backdrop-blur-md border-b border-white/5 px-6 py-3 flex items-center justify-between select-none">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-sm font-black uppercase tracking-widest text-slate-100 font-display">
          Silicon Debate
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-1 md:gap-2.5">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100'
              }`
            }
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('home')}</span>
          </NavLink>

          {token && (
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                  isActive
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100'
                }`
              }
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('history')}</span>
            </NavLink>
          )}

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100'
              }`
            }
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('analytics')}</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100'
              }`
            }
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('about')}</span>
          </NavLink>
        </nav>

        {/* Global UI Language Picker Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <select 
            value={i18n.language} 
            onChange={handleLanguageChange} 
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-slate-950 text-slate-100">English</option>
            <option value="te" className="bg-slate-950 text-slate-100">తెలుగు</option>
            <option value="hi" className="bg-slate-950 text-slate-100">हिन्दी</option>
            <option value="ta" className="bg-slate-950 text-slate-100">தமிழ்</option>
            <option value="es" className="bg-slate-950 text-slate-100">Español</option>
            <option value="fr" className="bg-slate-950 text-slate-100">Français</option>
          </select>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {token ? (
            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-[10px] font-mono text-slate-500">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/40 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-[0.97]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('login')}</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('signup')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

