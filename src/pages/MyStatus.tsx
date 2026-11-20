import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import {
  Clock,
  Scissors,
  Share2,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  X,
  Volume2,
  Home,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export const MyStatus: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const {
    tokens,
    barbers,
    services,
    calculateTokenWaitTime,
    cancelToken,
  } = useQueue();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calledModalDismissed, setCalledModalDismissed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Find this customer's token
  const token = useMemo(() => {
    return tokens.find(t => t.id.toLowerCase() === id.toLowerCase());
  }, [tokens, id]);

  // Selected services details
  const tokenServices = useMemo(() => {
    if (!token) return [];
    return services.filter(s => token.service_ids.includes(s.id));
  }, [token, services]);

  // Barber details
  const assignedBarber = useMemo(() => {
    if (!token?.assigned_barber_id) return null;
    return barbers.find(b => b.id === token.assigned_barber_id);
  }, [token, barbers]);

  const preferredBarber = useMemo(() => {
    if (!token || token.preferred_barber_id === 'ANY') return null;
    return barbers.find(b => b.id === token.preferred_barber_id);
  }, [token, barbers]);

  // Wait time and position calculation from Central Queue Engine
  const { waitMinutes, isPaused, position } = useMemo(() => {
    if (!token) return { waitMinutes: 0, isPaused: false, position: 0 };
    return calculateTokenWaitTime(token);
  }, [token, calculateTokenWaitTime]);

  // Elapsed timer when in chair
  useEffect(() => {
    if (token?.status === 'In chair' && token.in_chair_at) {
      const startTime = new Date(token.in_chair_at).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [token?.status, token?.in_chair_at]);

  // Trigger vibration when Called
  const hasVibratedRef = useRef(false);
  useEffect(() => {
    if (token?.status === 'Called') {
      if (!hasVibratedRef.current) {
        hasVibratedRef.current = true;
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200, 100, 300]);
          } catch (_) {}
        }
      }
    } else {
      hasVibratedRef.current = false;
    }
  }, [token?.status]);

  // Format MM:SS for stopwatch
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Copy ticket link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Cancel Spot
  const handleConfirmCancel = () => {
    if (token) {
      cancelToken(token.id);
      setCancelModalOpen(false);
    }
  };

  // If token not found
  if (!token) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 text-center space-y-6 pt-16">
        <div className="p-8 rounded-3xl bg-gray-900 border border-gray-700 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-950/70 border border-red-800 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">{t('ticket_not_found')}</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('ticket_not_found_desc', { token: id })}
          </p>
          <div className="pt-2">
            <Link
              to="/join"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-sm tap-target transition"
            >
              <span>{t('btn_join_queue')}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ordinal position label
  const getPositionLabel = () => {
    if (position === 1) return t('ordinal_1');
    if (position === 2) return t('ordinal_2');
    if (position === 3) return t('ordinal_3');
    return t('ordinal_n', { n: position });
  };

  const barberDisplayName = assignedBarber?.name || preferredBarber?.name || t('any_barber');

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-gray-100 tap-target flex items-center justify-center transition"
          aria-label="Home"
        >
          <Home className="w-4 h-4" />
        </Link>

        {/* Live Sync Status Indicator */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-[11px] text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Sync</span>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-500 tap-target flex items-center justify-center transition"
          title={t('share_ticket')}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {copied && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center font-medium animate-fade-in">
          {t('link_copied')}
        </div>
      )}

      {/* 2nd in Line: 'Start coming to the salon' Amber Alert Banner */}
      {token.status === 'Waiting' && position === 2 && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 text-amber-200 shadow-xl shadow-amber-500/10 space-y-1 animate-pulse">
          <div className="flex items-center space-x-2 font-bold text-sm text-amber-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{t('banner_start_coming')}</span>
          </div>
          <p className="text-xs text-amber-200/90 pl-7 leading-relaxed">
            {language === 'GU'
              ? 'તમે લાઈનમાં આગળના ક્રમે છો. વિલંબ ટાળવા માટે કૃપા કરીને સલૂન તરફ રવાના થાઓ.'
              : 'You are next in line right after the current customer. Please start heading over!'}
          </p>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gray-900 border border-gray-700 shadow-2xl text-center space-y-6">
        {/* Token Badge */}
        <div>
          <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold block mb-1.5">
            {t('token_label')}
          </span>
          <div className="inline-block px-8 py-3 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 font-black text-4xl sm:text-5xl tracking-tight shadow-xl shadow-yellow-500/20">
            {token.id}
          </div>
          <span className="block text-sm font-semibold text-gray-200 mt-2">
            {token.customer_name}
          </span>
        </div>

        {/* Circular Countdown or Status Display */}
        {token.status === 'Waiting' && (
          <div className="py-2 flex flex-col items-center justify-center space-y-3">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-gray-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-yellow-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={isPaused ? 264 : Math.max(0, 264 - (waitMinutes / 60) * 264)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                {isPaused ? (
                  <span className="text-xs font-bold text-amber-400 px-2 leading-tight">
                    {t('queue_paused')}
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-gray-100 tracking-tight">
                      {waitMinutes}
                    </span>
                    <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">
                      {t('min')} {t('wait_countdown_label')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Position Pill */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs font-bold text-gray-200">
              <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
              <span>{getPositionLabel()}</span>
            </div>
          </div>
        )}

        {/* Status: Called */}
        {token.status === 'Called' && (
          <div className="p-5 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500 space-y-3 animate-gold-pulse">
            <span className="w-3 h-3 rounded-full bg-yellow-400 mx-auto block animate-ping"></span>
            <h3 className="text-lg font-black text-yellow-400">{t('alert_called_title')}</h3>
            <p className="text-xs text-gray-200">
              {t('alert_called_body', { barber: barberDisplayName })}
            </p>
          </div>
        )}

        {/* Status: In Chair */}
        {token.status === 'In chair' && (
          <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-700 space-y-3">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest block">
              {t('status_in_chair')}
            </span>
            <div className="text-4xl font-mono font-black text-gray-100 tracking-wider">
              {formatTime(elapsedSeconds)}
            </div>
            <p className="text-xs text-gray-300">
              {t('status_in_chair_msg', { barber: barberDisplayName })}
            </p>
          </div>
        )}

        {/* Status: Done */}
        {token.status === 'Done' && (
          <div className="p-6 rounded-2xl bg-gray-800/80 border border-emerald-700/80 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-100">{t('status_done')}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('status_done_msg')}
            </p>
            <div className="pt-2">
              <Link
                to="/join"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-yellow-500 text-gray-950 text-xs font-bold tap-target"
              >
                {t('btn_rejoin')}
              </Link>
            </div>
          </div>
        )}

        {/* Status: Cancelled or No-Show */}
        {(token.status === 'Cancelled' || token.status === 'No-show') && (
          <div className="p-5 rounded-2xl bg-gray-800/80 border border-red-800/60 space-y-3">
            <span className="text-sm font-bold text-red-400 block">
              {token.status === 'Cancelled' ? t('status_cancelled') : t('status_noshow')}
            </span>
            <p className="text-xs text-gray-400 leading-relaxed">
              {token.status === 'Cancelled' ? t('status_cancelled_msg') : t('status_noshow_msg')}
            </p>
            <div className="pt-2">
              <Link
                to="/join"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-yellow-500 text-gray-950 text-xs font-bold tap-target"
              >
                {t('btn_rejoin')}
              </Link>
            </div>
          </div>
        )}

        {/* Service Details & Summary Strip */}
        <div className="border-t border-gray-800 pt-4 text-left space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t('label_barber')}:</span>
            <span className="font-bold text-gray-200">{barberDisplayName}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 block">{t('label_services')}:</span>
            <div className="flex flex-wrap gap-1.5">
              {tokenServices.map((srv) => (
                <span
                  key={srv.id}
                  className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-200 flex items-center space-x-1"
                >
                  <span>{language === 'GU' ? srv.name_gu : srv.name_en}</span>
                  <span className="text-[10px] text-yellow-500 font-bold ml-1">
                    {t('rupee')}{srv.price}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-xs font-bold">
            <span className="text-gray-400">{t('summary_price')}:</span>
            <span className="text-sm text-yellow-400">{t('rupee')}{token.total_price}</span>
          </div>
        </div>

        {/* Cancel Spot Button (Only available while Waiting) */}
        {token.status === 'Waiting' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs text-red-400 hover:text-red-300 underline tap-target py-2"
            >
              {t('btn_cancel_ticket')}
            </button>
          </div>
        )}
      </div>

      {/* FULL-SCREEN GOLD 'It's your turn!' MODAL OVERLAY WHEN CALLED */}
      {token.status === 'Called' && !calledModalDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-gray-900 border-2 border-yellow-500 shadow-2xl p-7 text-center space-y-5 animate-gold-pulse">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-400 tracking-tight">
                {t('alert_called_title')}
              </h2>
              <div className="text-4xl font-extrabold text-gray-100 py-1 font-mono">
                {token.id}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {t('alert_called_body', { barber: barberDisplayName })}
              </p>
            </div>

            <button
              onClick={() => setCalledModalDismissed(true)}
              className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black text-sm shadow-xl shadow-yellow-500/30 tap-target transition transform active:scale-95"
            >
              {t('btn_proceed_to_chair')}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/70 border border-red-800 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-100">{t('modal_cancel_title')}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('modal_cancel_body')}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs border border-gray-600 tap-target transition"
              >
                {t('modal_cancel_keep')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 tap-target transition"
              >
                {t('modal_cancel_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
