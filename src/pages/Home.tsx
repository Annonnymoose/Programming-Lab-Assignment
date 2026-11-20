import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Link } from 'react-router-dom';
import { Clock, Scissors, ArrowRight, ShieldCheck, Tv, ClipboardList, AlertCircle, Ticket } from 'lucide-react';

export const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    barbers,
    waitingTokens,
    overallWaitMinutes,
    isOverallWaitPaused,
    isOnlineOpen,
    isSalonOpenNow,
    activeBarbersCount,
  } = useQueue();

  const [savedTokenId, setSavedTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastToken = localStorage.getItem('salon_last_token');
      if (lastToken) setSavedTokenId(lastToken);
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6 text-center">
        {/* Salon Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm">
          {isSalonOpenNow ? (
            isOnlineOpen ? (
              <span className="flex items-center text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                {t('open_badge')}
              </span>
            ) : (
              <span className="flex items-center text-amber-400 bg-amber-950/70 border border-amber-700/60 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                {t('online_closed_badge')}
              </span>
            )
          ) : (
            <span className="flex items-center text-red-400 bg-red-950/70 border border-red-700/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
              {t('closed_badge')}
            </span>
          )}
        </div>

        {/* Hero Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-100 tracking-tight">
            {t('hero_title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            {t('hero_subtitle')}
          </p>
        </div>

        {/* Live Queue Summary Hero Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl text-left space-y-5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-xs uppercase tracking-widest text-yellow-500 font-bold flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-yellow-500" />
              Live Queue Status
            </span>
            <span className="text-[11px] text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
              {activeBarbersCount} {language === 'GU' ? 'સક્રિય બાર્બર' : 'Active Barbers'}
            </span>
          </div>

          {/* Wait Time / Queue Status Message */}
          <div className="py-2">
            {isOverallWaitPaused ? (
              <div className="flex items-center space-x-3 text-amber-400 bg-amber-950/40 p-4 rounded-xl border border-amber-800/60">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold">
                  {t('queue_paused')}
                </span>
              </div>
            ) : waitingTokens.length === 0 ? (
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {t('no_one_waiting')}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'GU' ? 'પ્રતીક્ષા સમય: ૦ મિનિટ' : 'Estimated wait: 0 minutes'}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-100">
                  {t('people_waiting', { count: waitingTokens.length, min: overallWaitMinutes })}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'GU'
                    ? 'તમારો નંબર સુરક્ષિત કરવા નીચે આપેલ બટન દબાવો.'
                    : 'Real-time estimated wait time calculated dynamically.'}
                </p>
              </div>
            )}
          </div>

          {/* Barber Status Chips */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <span className="text-xs text-gray-400 font-medium block">
              {t('barber_availability')}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {barbers.map((barber) => {
                let badgeClass = 'border-emerald-800/60 text-emerald-300 bg-emerald-950/40';
                let dotClass = 'bg-emerald-400';
                let statusLabel = language === 'GU' ? 'ઉપલબ્ધ' : 'Available';

                if (!barber.on_duty) {
                  badgeClass = 'border-gray-800 text-gray-500 bg-gray-900';
                  dotClass = 'bg-gray-600';
                  statusLabel = language === 'GU' ? 'ગેરહાજર' : 'Off Duty';
                } else if (barber.status === 'On break') {
                  badgeClass = 'border-orange-900/60 text-orange-400 bg-orange-950/40';
                  dotClass = 'bg-orange-500';
                  statusLabel = language === 'GU' ? 'વિરામ પર' : 'On break';
                } else if (barber.status === 'Busy') {
                  badgeClass = 'border-amber-800/60 text-amber-300 bg-amber-950/40';
                  dotClass = 'bg-amber-400 animate-pulse';
                  statusLabel = barber.current_token_id 
                    ? `${barber.current_token_id}`
                    : (language === 'GU' ? 'કાર્યરત' : 'Busy');
                }

                return (
                  <div
                    key={barber.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${badgeClass}`}
                  >
                    <span className="font-bold text-gray-200">{barber.name}</span>
                    <span className="flex items-center text-[11px] font-medium ml-2">
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${dotClass}`}></span>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary CTA Button: [ Join Queue ] */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isOnlineOpen ? (
            <Link
              to="/join"
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black text-base shadow-xl shadow-yellow-500/25 transition transform active:scale-95 tap-target min-h-[52px]"
            >
              <span>{t('btn_join_queue')}</span>
              <ArrowRight className="w-5 h-5 ml-2.5" />
            </Link>
          ) : (
            <div className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-center space-y-1">
              <span className="text-sm font-bold text-amber-400 block">
                {t('queue_closed_banner')}
              </span>
            </div>
          )}

          {/* Quick link to existing ticket if user already joined */}
          {savedTokenId && (
            <Link
              to={`/status/${savedTokenId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-yellow-500 font-bold text-sm border border-yellow-500/40 tap-target min-h-[52px] transition"
            >
              <Ticket className="w-4 h-4 mr-2" />
              <span>{t('btn_view_status')} (#{savedTokenId})</span>
            </Link>
          )}
        </div>

        {/* Quick Portal Navigation Cards */}
        <div className="pt-6 border-t border-gray-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <Link
            to="/join"
            className="p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-gray-300 flex flex-col items-center justify-center space-y-1.5 tap-target transition"
          >
            <Scissors className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{t('nav_join')}</span>
          </Link>
          <Link
            to="/reception"
            className="p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-gray-300 flex flex-col items-center justify-center space-y-1.5 tap-target transition"
          >
            <ClipboardList className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{t('nav_reception')}</span>
          </Link>
          <Link
            to="/display"
            className="p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-gray-300 flex flex-col items-center justify-center space-y-1.5 tap-target transition"
          >
            <Tv className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{t('nav_display')}</span>
          </Link>
          <Link
            to="/admin"
            className="p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-gray-300 flex flex-col items-center justify-center space-y-1.5 tap-target transition"
          >
            <ShieldCheck className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{t('nav_admin')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
