import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import {
  Scissors,
  Coffee,
  Play,
  CheckCircle,
  Clock,
  User,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export const BarberView: React.FC = () => {
  const { name = 'ravi' } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const {
    barbers,
    tokens,
    services,
    waitingTokens,
    callNextCustomer,
    startService,
    completeService,
    toggleBarberStatus,
  } = useQueue();

  // Find barber record
  const barber = useMemo(() => {
    return barbers.find(b => b.name.toLowerCase() === name.toLowerCase()) || barbers[0];
  }, [barbers, name]);

  // Current active customer assigned to this barber
  const currentToken = useMemo(() => {
    if (!barber) return null;
    return tokens.find(t => 
      t.assigned_barber_id === barber.id && (t.status === 'Called' || t.status === 'In chair')
    ) || null;
  }, [tokens, barber]);

  // Active customer services details
  const currentTokenServices = useMemo(() => {
    if (!currentToken) return [];
    return services.filter(s => currentToken.service_ids.includes(s.id));
  }, [currentToken, services]);

  // Next upcoming customer designated for this barber
  const nextCustomer = useMemo(() => {
    if (!barber) return null;
    return waitingTokens.find(t => 
      t.preferred_barber_id === barber.id || t.preferred_barber_id === 'ANY'
    ) || null;
  }, [waitingTokens, barber]);

  // Live stopwatch timer when In Chair
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (currentToken?.status === 'In chair' && currentToken.in_chair_at) {
      const startTime = new Date(currentToken.in_chair_at).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [currentToken?.status, currentToken?.in_chair_at]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isOnBreak = barber.status === 'On break';

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-5 pb-24">
      {/* Barber Station Switcher Tabs */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-700">
        {barbers.map((b) => {
          const isActive = b.name.toLowerCase() === barber.name.toLowerCase();
          return (
            <Link
              key={b.id}
              to={`/barber/${b.name.toLowerCase()}`}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition tap-target flex items-center justify-center space-x-1 ${
                isActive
                  ? 'bg-yellow-500 text-gray-950 shadow-md shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{b.name}</span>
              {b.status === 'On break' && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-1"></span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Barber Station Profile Header Card */}
      <div className="p-4 rounded-2xl bg-gray-900 border border-gray-700 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-100 flex items-center">
              <span>{barber.name}</span>
              <span className="text-xs font-normal text-gray-400 ml-1.5">· Station {barber.name === 'Ravi' ? 1 : barber.name === 'Amit' ? 2 : 3}</span>
            </h1>
            <span
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border ${
                isOnBreak
                  ? 'bg-orange-950 text-orange-400 border-orange-800'
                  : currentToken
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                isOnBreak ? 'bg-orange-400' : currentToken ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}></span>
              {isOnBreak
                ? (language === 'GU' ? 'વિરામ પર' : 'On break')
                : currentToken
                ? (language === 'GU' ? 'સેવા ચાલુ' : 'Busy (Serving)')
                : (language === 'GU' ? 'ઉપલબ્ધ' : 'Available')}
            </span>
          </div>
        </div>

        {/* Break / Available Toggle Button */}
        <button
          type="button"
          onClick={() => toggleBarberStatus(barber.id)}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition tap-target ${
            isOnBreak
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900/80 shadow-md'
              : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-orange-400" />
          <span>{isOnBreak ? t('barber_toggle_available') : t('barber_toggle_break')}</span>
        </button>
      </div>

      {/* CURRENT CLIENT WORK CARD (ACTIVE SERVICE) */}
      <div className="p-6 rounded-3xl bg-gray-900 border border-gray-700 shadow-2xl space-y-5 text-center">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
          <span className="text-xs uppercase font-extrabold tracking-wider text-yellow-500">
            {t('current_client_title')}
          </span>
          {currentToken && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
              currentToken.status === 'In chair'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
            }`}>
              {currentToken.status}
            </span>
          )}
        </div>

        {!currentToken ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-dashed border-gray-700 text-gray-500 mx-auto flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-300">{t('no_active_client')}</h3>
              <p className="text-xs text-gray-500">
                {isOnBreak
                  ? 'Station paused while on break.'
                  : 'Ready to serve next customer in line.'}
              </p>
            </div>

            {!isOnBreak && (
              <button
                type="button"
                onClick={() => callNextCustomer(barber.id)}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black text-xs tap-target transition shadow-lg shadow-yellow-500/20"
              >
                <Scissors className="w-4 h-4 mr-1.5" />
                <span>{t('btn_call_next')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5 text-left">
            {/* Client Token & Name */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/80 border border-gray-700">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">
                  {t('token_label')}
                </span>
                <span className="text-3xl font-black text-yellow-400 font-mono">
                  {currentToken.id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-100 block">
                  {currentToken.customer_name}
                </span>
                <span className="text-xs text-gray-400">
                  {currentToken.total_duration_minutes} min scheduled
                </span>
              </div>
            </div>

            {/* Stopwatch when In Chair */}
            {currentToken.status === 'In chair' && (
              <div className="p-5 rounded-2xl bg-gray-950 border border-emerald-800/60 text-center space-y-1.5 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block">
                  {t('elapsed_label')}
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black text-gray-100 tracking-wider">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
            )}

            {/* Service Checklist */}
            <div className="space-y-2">
              <span className="text-xs text-gray-400 font-semibold block">
                {t('th_services')}:
              </span>
              <div className="space-y-1.5">
                {currentTokenServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-2.5 rounded-xl bg-gray-800 border border-gray-700/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 text-gray-200">
                      <span className="w-4 h-4 rounded-md bg-yellow-500/20 border border-yellow-500 text-yellow-500 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span className="font-bold">{language === 'GU' ? srv.name_gu : srv.name_en}</span>
                    </div>
                    <span className="text-gray-400 font-medium">{srv.duration_minutes}m · ₹{srv.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sequential Action Button: [ Start ] -> [ Done ] */}
            <div className="pt-2">
              {currentToken.status === 'Called' ? (
                <button
                  type="button"
                  onClick={() => startService(currentToken.id)}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 tap-target transition flex items-center justify-center min-h-[52px]"
                >
                  <Play className="w-5 h-5 mr-2" />
                  <span>{t('btn_start_service')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => completeService(currentToken.id)}
                  className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black text-sm shadow-xl shadow-yellow-500/25 tap-target transition flex items-center justify-center min-h-[52px]"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>{t('btn_complete_service')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 'NEXT FOR YOU' PREVIEW CARD */}
      <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">
            {t('next_client_preview')}
          </span>
          <Clock className="w-3.5 h-3.5 text-gray-500" />
        </div>

        {nextCustomer ? (
          <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-yellow-400">
                  {nextCustomer.id}
                </span>
                <span className="text-xs font-bold text-gray-200">
                  {nextCustomer.customer_name}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {nextCustomer.total_duration_minutes}m · {nextCustomer.preferred_barber_id === 'ANY' ? t('any_barber') : barber.name}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
              Next in line
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-1">{t('no_next_client')}</p>
        )}
      </div>
    </div>
  );
};
