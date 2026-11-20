import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Scissors, Globe, Lock, Unlock, LogOut } from 'lucide-react';
import { PinModal } from './PinModal';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { isStaffAuthed, logout } = useAuth();
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const location = useLocation();

  // Hide standard navbar on the waiting area TV display for clean wall display
  if (location.pathname === '/display') {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group tap-target">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 group-hover:scale-105 transition">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-100 tracking-tight block leading-tight">
                {t('salon_name')}
              </span>
              <span className="text-[10px] text-yellow-500/80 font-medium tracking-wide uppercase">
                {t('open_badge')}
              </span>
            </div>
          </Link>

          {/* Quick Route Nav Pills (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname === '/' ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_home')}
            </Link>
            <Link
              to="/join"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname === '/join' ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_join')}
            </Link>
            <Link
              to="/reception"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname.startsWith('/reception') ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_reception')}
            </Link>
            <Link
              to="/barber/ravi"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname.startsWith('/barber') ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_barber')}
            </Link>
            <Link
              to="/display"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname === '/display' ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_display')}
            </Link>
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname === '/admin' ? 'bg-yellow-500 text-gray-900 font-bold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {t('nav_admin')}
            </Link>
          </nav>

          {/* Actions: Language & Staff Status */}
          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-200 transition tap-target"
              aria-label="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-yellow-500" />
              <span>{language === 'EN' ? 'ગુજરાતી' : 'English'}</span>
            </button>

            {/* Staff Auth Button / Indicator */}
            {isStaffAuthed ? (
              <div className="flex items-center space-x-1">
                <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                  <Unlock className="w-3 h-3 mr-1 text-emerald-400" />
                  Staff
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 tap-target flex items-center justify-center transition"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPinModalOpen(true)}
                className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-800 tap-target flex items-center justify-center transition"
                title={t('staff_portal')}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global PIN Modal triggerable from header */}
      <PinModal
        isOpen={pinModalOpen}
        onSuccess={() => setPinModalOpen(false)}
        onCancel={() => setPinModalOpen(false)}
      />
    </>
  );
};
