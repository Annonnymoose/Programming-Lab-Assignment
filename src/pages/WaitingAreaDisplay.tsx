import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Link } from 'react-router-dom';
import { playQueueChime, unlockAudioContext } from '../lib/chime';
import {
  Tv,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  QrCode,
  Scissors,
  CheckCircle,
  Coffee,
  ArrowRight
} from 'lucide-react';

export const WaitingAreaDisplay: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    barbers,
    tokens,
    services,
    waitingTokens,
    calculateTokenWaitTime,
    lastCalledToken,
  } = useQueue();

  // Clock state
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio enable state for browser autoplay policy
  const [soundEnabled, setSoundEnabled] = useState(false);
  const handleEnableSound = () => {
    unlockAudioContext();
    playQueueChime();
    setSoundEnabled(true);
  };

  // Flash highlight state for called barber card
  const [flashingBarberId, setFlashingBarberId] = useState<string | null>(null);
  const lastCalledIdRef = useRef<string | null>(null);

  // Detect when a customer transitions to 'Called'
  useEffect(() => {
    // Find any recently called token
    const recentlyCalled = tokens.find(t => t.status === 'Called');
    if (recentlyCalled && recentlyCalled.id !== lastCalledIdRef.current) {
      lastCalledIdRef.current = recentlyCalled.id;
      if (recentlyCalled.assigned_barber_id) {
        setFlashingBarberId(recentlyCalled.assigned_barber_id);
      }
      playQueueChime();

      // Clear visual flash after 4.5 seconds
      const timeout = setTimeout(() => {
        setFlashingBarberId(null);
      }, 4500);
      return () => clearTimeout(timeout);
    }
  }, [tokens]);

  // Next 5 waiting tokens
  const upNextFive = useMemo(() => {
    return waitingTokens.slice(0, 5);
  }, [waitingTokens]);

  return (
    <div
      onClick={unlockAudioContext}
      className="min-h-screen bg-slate-950 text-gray-100 p-6 lg:p-8 flex flex-col justify-between select-none font-sans"
    >
      {/* TV Header */}
      <header className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/40 flex items-center justify-center text-yellow-500 shadow-lg shadow-yellow-500/10">
            <Scissors className="w-8 h-8 transform -rotate-45" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-100 tracking-tight flex items-center">
              <span>{t('salon_name')}</span>
              <span className="text-xs text-yellow-500/80 font-bold ml-3 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/30 uppercase tracking-widest">
                {t('tv_display_title')}
              </span>
            </h1>
            <p className="text-xs lg:text-sm text-gray-400 mt-0.5">
              {t('salon_tagline')} · {language === 'GU' ? 'લાઇવ સલૂન કતાર' : 'Live Screen'}
            </p>
          </div>
        </div>

        {/* Live Clock & Sound Toggle */}
        <div className="flex items-center space-x-6">
          <button
            onClick={handleEnableSound}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 animate-pulse'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime Active' : 'Tap to Enable Chime'}</span>
          </button>

          <div className="text-2xl lg:text-3xl font-mono font-black text-gray-200 tracking-widest flex items-center space-x-2.5 bg-gray-900/80 px-4 py-2 rounded-2xl border border-gray-800">
            <Clock className="w-6 h-6 text-yellow-500" />
            <span>{clock}</span>
          </div>

          <Link
            to="/"
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-800 px-3 py-2 rounded-xl transition hover:bg-gray-900"
          >
            Exit TV View
          </Link>
        </div>
      </header>

      {/* Main Grid: Active Barber Stations (Readable from 5 Meters) */}
      <main className="my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
          {barbers.map((barber) => {
            const isFlashing = flashingBarberId === barber.id;
            const isOnBreak = barber.status === 'On break';
            const currentToken = tokens.find(t => 
              t.assigned_barber_id === barber.id && (t.status === 'Called' || t.status === 'In chair')
            );
            const isServing = Boolean(currentToken);

            // Services list for active client
            const activeServices = currentToken
              ? services.filter(s => currentToken.service_ids.includes(s.id))
              : [];
            const serviceSummary = activeServices.map(s => language === 'GU' ? s.name_gu : s.name_en).join(', ');

            return (
              <div
                key={barber.id}
                className={`p-8 lg:p-10 rounded-3xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-between min-h-[340px] shadow-2xl relative overflow-hidden ${
                  isFlashing
                    ? 'bg-yellow-500/20 border-yellow-400 shadow-yellow-500/30 animate-gold-pulse'
                    : isServing
                    ? currentToken?.status === 'Called'
                      ? 'bg-gray-900/90 border-yellow-500/80 shadow-yellow-500/20'
                      : 'bg-gray-900 border-amber-600/60 shadow-amber-600/10'
                    : isOnBreak
                    ? 'bg-gray-900/40 border-gray-800 opacity-60'
                    : 'bg-gray-900/80 border-emerald-500/40 shadow-emerald-500/5'
                }`}
              >
                {/* Station Call Pulse Flare */}
                {isFlashing && (
                  <div className="absolute top-0 inset-x-0 bg-yellow-500 text-gray-950 font-black text-xs py-1 uppercase tracking-widest animate-pulse flex items-center justify-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CUSTOMER CALLED!</span>
                  </div>
                )}

                {/* Barber Header */}
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center text-yellow-500 mb-2">
                    <Scissors className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-gray-100 tracking-tight">
                    {barber.name}
                  </h2>
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-bold block">
                    Station {barber.name === 'Ravi' ? 1 : barber.name === 'Amit' ? 2 : 3}
                  </span>
                </div>

                {/* Status Hero Display (Large for 5-Meter Readability) */}
                <div className="my-4 space-y-2">
                  {currentToken ? (
                    <div>
                      <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold block">
                        {currentToken.status === 'Called' ? 'CALLING TOKEN' : t('tv_now_serving')}
                      </span>
                      <div className="text-5xl lg:text-6xl font-black font-mono text-yellow-400 tracking-tight">
                        {currentToken.id}
                      </div>
                      <span className="text-base lg:text-lg font-bold text-gray-200 block mt-1">
                        {currentToken.customer_name}
                      </span>
                      {serviceSummary && (
                        <p className="text-xs text-gray-400 max-w-xs mx-auto line-clamp-1">
                          {serviceSummary}
                        </p>
                      )}
                    </div>
                  ) : isOnBreak ? (
                    <div className="space-y-2">
                      <div className="inline-block px-6 py-2.5 rounded-2xl bg-orange-950/60 border border-orange-800 text-orange-400 font-black text-2xl lg:text-3xl tracking-tight">
                        {t('tv_on_break')}
                      </div>
                      <p className="text-xs text-gray-500">Temporarily resting</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-block px-8 py-3 rounded-2xl bg-emerald-950/70 border-2 border-emerald-600 text-emerald-400 font-black text-3xl lg:text-4xl tracking-tight shadow-lg shadow-emerald-600/10">
                        {t('tv_available')}
                      </div>
                      <p className="text-xs text-emerald-400/80 font-medium">Ready for next customer</p>
                    </div>
                  )}
                </div>

                {/* Status Pill Footer */}
                <div className="w-full pt-3 border-t border-gray-800/80 flex items-center justify-center">
                  <span
                    className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${
                      currentToken
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : isOnBreak
                        ? 'bg-gray-800 text-gray-500 border border-gray-700'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      currentToken ? 'bg-amber-400 animate-pulse' : isOnBreak ? 'bg-gray-600' : 'bg-emerald-400'
                    }`}></span>
                    {currentToken ? currentToken.status : isOnBreak ? 'On break' : 'Available'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Up Next Strip (Bottom Section) */}
      <footer className="border-t border-gray-800 pt-6 space-y-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-yellow-500 whitespace-nowrap flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5" />
              {t('tv_up_next')}:
            </span>

            {upNextFive.length === 0 ? (
              <span className="text-xs text-gray-500 italic">
                {t('no_one_waiting')}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {upNextFive.map((token, i) => {
                  const waitInfo = calculateTokenWaitTime(token);
                  return (
                    <div
                      key={token.id}
                      className="px-4 py-2 rounded-2xl bg-gray-900 border border-gray-700 flex items-center space-x-2.5 shadow-md"
                    >
                      <span className="font-mono font-black text-sm text-yellow-400">
                        {token.id}
                      </span>
                      <span className="text-xs text-gray-300 font-semibold max-w-[100px] truncate">
                        {token.customer_name}
                      </span>
                      <span className="text-[11px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md font-mono">
                        ~{waitInfo.waitMinutes}m
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Join Callout Ticker */}
          <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-900 px-4 py-2.5 rounded-2xl border border-gray-800">
            <QrCode className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-gray-300">
              {t('tv_scan_to_join')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
