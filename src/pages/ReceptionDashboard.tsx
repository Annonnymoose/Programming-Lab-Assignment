import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import {
  ClipboardList,
  PlusCircle,
  Clock,
  User,
  Phone,
  Scissors,
  Sparkles,
  AlertTriangle,
  Coffee,
  CheckCircle,
  XCircle,
  UserX,
  Play,
  Check,
  X,
  Radio
} from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    tokens,
    barbers,
    services,
    waitingTokens,
    isOnlineOpen,
    isSalonOpenNow,
    callNextCustomer,
    callSpecificCustomer,
    toggleBarberStatus,
    startService,
    completeService,
    cancelToken,
    markNoShow,
    createToken,
  } = useQueue();

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Walk-In Modal State
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['srv-1']);
  const [preferredBarberId, setPreferredBarberId] = useState('ANY');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cancel Confirmation Modal State
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active services
  const activeServices = useMemo(() => services.filter(s => s.is_active), [services]);

  // Handle Walk-in submission
  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError(t('error_name_required'));
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setFormError(t('error_phone_invalid'));
      return;
    }

    if (selectedServiceIds.length < 1 || selectedServiceIds.length > 3) {
      setFormError(t('error_services_required'));
      return;
    }

    const res = createToken({
      customer_name: trimmedName,
      phone: cleanPhone,
      service_ids: selectedServiceIds,
      preferred_barber_id: preferredBarberId,
      is_walk_in: true,
    });

    if (!res.success) {
      if (res.error === 'DUPLICATE_PHONE') {
        setFormError(t('error_already_in_queue', { token: res.existingToken?.id || '' }));
      } else {
        setFormError('Failed to add customer.');
      }
      return;
    }

    // Success
    setWalkinModalOpen(false);
    setCustomerName('');
    setPhone('');
    setSelectedServiceIds(['srv-1']);
    setPreferredBarberId('ANY');
    showToast(`Walk-in added: #${res.token?.id}`);
  };

  // Toggle Walk-In service selection (1 to 3 items)
  const toggleWalkinService = (id: string) => {
    setFormError(null);
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(prev => prev.filter(sId => sId !== id));
      }
    } else {
      if (selectedServiceIds.length < 3) {
        setSelectedServiceIds(prev => [...prev, id]);
      }
    }
  };

  // Mask Phone for display: ******1234
  const maskPhone = (ph: string) => {
    const clean = ph.replace(/\D/g, '');
    if (clean.length < 4) return clean;
    return `******${clean.slice(-4)}`;
  };

  // Calculate wait duration in minutes since token created
  const getWaitDurationMinutes = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const diffMs = Date.now() - createdTime;
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Handle Call Next for Barber
  const handleCallNext = (barberId: string) => {
    const calledToken = callNextCustomer(barberId);
    if (!calledToken) {
      showToast(t('no_matching_waiting'));
    } else {
      showToast(`Called token ${calledToken.id}`);
    }
  };

  // Filter queue tokens: all currently Waiting or Called (active uncompleted list)
  const waitingAndCalledTokens = useMemo(() => {
    return tokens.filter(t => t.status === 'Waiting' || t.status === 'Called');
  }, [tokens]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Reception Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-900 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-100 tracking-tight">
              {t('reception_title')}
            </h1>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                isOnlineOpen
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
                {isOnlineOpen ? 'Online Queue Active' : 'Online Closed (Walk-ins Only)'}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400 font-mono">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Action: Add Walk-In Customer */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setWalkinModalOpen(true)}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-black text-sm shadow-lg shadow-yellow-500/20 tap-target transition transform active:scale-95 min-h-touch"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>{t('btn_add_walkin')}</span>
          </button>
        </div>
      </div>

      {/* Temporary Toast Message */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-yellow-500 text-gray-950 font-bold text-xs text-center shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Landscape Two-Column Grid: Left (Barber Stations ~40%) | Right (Waiting Queue ~60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: 3 Barber Stations (40% width in landscape) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center">
              <Scissors className="w-3.5 h-3.5 mr-1.5" />
              {t('barber_stations_title')} ({barbers.length})
            </h2>
          </div>

          <div className="space-y-3">
            {barbers.map((barber) => {
              const isOnBreak = barber.status === 'On break';
              const currentToken = tokens.find(t => t.id === barber.current_token_id);
              const isServing = currentToken && (currentToken.status === 'In chair' || currentToken.status === 'Called');

              return (
                <div
                  key={barber.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 shadow-lg ${
                    isOnBreak
                      ? 'bg-gray-900/60 border-orange-900/40 opacity-80'
                      : isServing
                      ? 'bg-gray-900 border-yellow-500/50'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  {/* Barber Header */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-100">{barber.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOnBreak
                            ? 'bg-orange-950 text-orange-400 border-orange-800'
                            : isServing
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        {isOnBreak
                          ? (language === 'GU' ? 'વિરામ પર' : 'On break')
                          : isServing
                          ? (language === 'GU' ? 'સેવા ચાલુ' : 'Serving')
                          : (language === 'GU' ? 'ઉપલબ્ધ' : 'Available')}
                      </span>
                    </div>

                    {/* Break / Available Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleBarberStatus(barber.id)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition tap-target ${
                        isOnBreak
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                      }`}
                    >
                      <Coffee className="w-3 h-3 text-orange-400" />
                      <span>{isOnBreak ? t('barber_toggle_available') : t('barber_toggle_break')}</span>
                    </button>
                  </div>

                  {/* Current Client Status in Chair */}
                  {isServing && currentToken ? (
                    <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block">{t('serving_label')}:</span>
                          <span className="text-base font-extrabold text-yellow-400">
                            {currentToken.id} · {currentToken.customer_name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-900 border border-gray-700 text-gray-300">
                          {currentToken.status}
                        </span>
                      </div>

                      {/* Remaining Service Time Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Progress</span>
                          <span>{currentToken.total_duration_minutes} min scheduled</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: currentToken.status === 'In chair' ? '65%' : '15%',
                            }}
                          />
                        </div>
                      </div>

                      {/* In Chair Action buttons */}
                      <div className="flex gap-2 pt-1">
                        {currentToken.status === 'Called' && (
                          <button
                            onClick={() => startService(currentToken.id)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tap-target flex items-center justify-center transition"
                          >
                            <Play className="w-3.5 h-3.5 mr-1" />
                            {t('btn_start_service')}
                          </button>
                        )}
                        {currentToken.status === 'In chair' && (
                          <button
                            onClick={() => completeService(currentToken.id)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-xs tap-target flex items-center justify-center transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            {t('btn_complete_service')}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-800/40 border border-dashed border-gray-700/60 text-center text-xs text-gray-500">
                      {isOnBreak ? 'Barber currently on break' : 'Station free — ready for customer'}
                    </div>
                  )}

                  {/* Primary Dispatch Action: [ Call Next ] */}
                  <div>
                    <button
                      type="button"
                      disabled={isOnBreak || Boolean(isServing)}
                      onClick={() => handleCallNext(barber.id)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tap-target flex items-center justify-center transition ${
                        isOnBreak || isServing
                          ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                          : 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-md shadow-yellow-500/20'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 mr-1.5" />
                      <span>{t('btn_call_next')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Ordered Waiting Queue (60% width in landscape) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {t('waiting_queue_title')} ({waitingAndCalledTokens.length})
            </h2>
            <span className="text-[11px] text-gray-400">First-Come, First-Served</span>
          </div>

          {waitingAndCalledTokens.length === 0 ? (
            <div className="p-10 rounded-2xl bg-gray-900 border border-gray-700 text-center space-y-3">
              <UserX className="w-10 h-10 mx-auto text-gray-600" />
              <p className="text-sm text-gray-400 font-medium">{t('empty_queue')}</p>
              <button
                onClick={() => setWalkinModalOpen(true)}
                className="text-xs text-yellow-500 hover:underline inline-flex items-center"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                {t('btn_add_walkin')}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-900 border border-gray-700 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-800/90 uppercase text-[10px] text-gray-400 border-b border-gray-700">
                    <tr>
                      <th className="p-3.5">{t('th_token')}</th>
                      <th className="p-3.5">{t('th_customer')}</th>
                      <th className="p-3.5">{t('th_services')}</th>
                      <th className="p-3.5">{t('th_barber')}</th>
                      <th className="p-3.5">{t('th_wait')}</th>
                      <th className="p-3.5 text-right">{t('th_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {waitingAndCalledTokens.map((item, idx) => {
                      const waitMins = getWaitDurationMinutes(item.created_at);
                      const isOver60 = waitMins > 60;
                      const prefBarber = barbers.find(b => b.id === item.preferred_barber_id);
                      const prefName = prefBarber ? prefBarber.name : t('any_barber');

                      return (
                        <tr
                          key={item.id}
                          className={`transition ${
                            isOver60
                              ? 'bg-amber-950/40 border-l-4 border-amber-500'
                              : item.status === 'Called'
                              ? 'bg-yellow-500/5'
                              : 'hover:bg-gray-800/50'
                          }`}
                        >
                          {/* Token ID */}
                          <td className="p-3.5 font-mono font-bold text-sm text-yellow-400 whitespace-nowrap">
                            {item.id}
                            {item.status === 'Called' && (
                              <span className="block text-[9px] uppercase font-bold text-amber-400">
                                Called
                              </span>
                            )}
                          </td>

                          {/* Customer Name & Masked Phone */}
                          <td className="p-3.5">
                            <span className="font-bold text-gray-100 block">
                              {item.customer_name}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              {maskPhone(item.phone)}
                            </span>
                          </td>

                          {/* Services */}
                          <td className="p-3.5">
                            <span className="text-gray-200 block font-medium">
                              {item.total_duration_minutes}m · {t('rupee')}{item.total_price}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {item.service_ids.length} {language === 'GU' ? 'સેવા' : 'services'}
                            </span>
                          </td>

                          {/* Barber Preference */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              item.preferred_barber_id === 'ANY'
                                ? 'bg-gray-800 text-gray-300 border-gray-700'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {prefName}
                            </span>
                          </td>

                          {/* Wait Time with >60 min Amber Warning */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              {isOver60 && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              )}
                              <span className={`font-mono text-xs font-bold ${
                                isOver60 ? 'text-amber-400' : 'text-gray-300'
                              }`}>
                                {waitMins} min
                              </span>
                            </div>
                            {isOver60 && (
                              <span className="text-[9px] font-bold text-amber-400 block">
                                {t('alert_long_wait')}
                              </span>
                            )}
                          </td>

                          {/* Actions: Call, No-show, Cancel */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Direct Call from row if Waiting */}
                              {item.status === 'Waiting' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const success = callSpecificCustomer(item.id);
                                    if (success) {
                                      showToast(`Customer #${item.id} called!`);
                                    } else {
                                      showToast(t('no_matching_waiting'));
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-xs font-bold tap-target transition shadow-sm"
                                  title={t('btn_action_call')}
                                >
                                  {t('btn_action_call')}
                                </button>
                              )}

                              {/* No-show */}
                              <button
                                type="button"
                                onClick={() => markNoShow(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-red-400 text-xs font-semibold border border-gray-700 tap-target transition"
                                title={t('btn_action_noshow')}
                              >
                                {t('btn_action_noshow')}
                              </button>

                              {/* Cancel */}
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-xs font-semibold border border-gray-700 tap-target transition"
                                title={t('btn_action_cancel')}
                              >
                                {t('btn_action_cancel')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WALK-IN QUICK ENTRY MODAL DIALOG */}
      {walkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2 text-yellow-500">
                <PlusCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-100">{t('walkin_modal_title')}</h3>
              </div>
              <button
                onClick={() => setWalkinModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 tap-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">{t('walkin_modal_desc')}</p>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleWalkinSubmit} className="space-y-4">
              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_full_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('placeholder_full_name')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                />
              </div>

              {/* 10-Digit Mobile */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_phone')} *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                />
              </div>

              {/* Services Multi-Select (1 to 3) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_services')} ({selectedServiceIds.length} / 3) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleWalkinService(service.id)}
                        className={`p-2.5 rounded-xl border text-left transition tap-target ${
                          isSelected
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xs font-bold block">
                          {language === 'GU' ? service.name_gu : service.name_en}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {service.duration_minutes}m · ₹{service.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barber Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_barber')}
                </label>
                <select
                  value={preferredBarberId}
                  onChange={(e) => setPreferredBarberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                >
                  <option value="ANY">{t('barber_any')}</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.status === 'On break' ? `(${t('barber_on_break')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold border border-gray-700 tap-target"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-xs font-bold shadow-lg shadow-yellow-500/20 tap-target"
                >
                  {t('btn_confirm_join')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/70 border border-red-800 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-100">{t('modal_cancel_title')}</h3>
            <p className="text-xs text-gray-400">{t('modal_cancel_body')}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold border border-gray-700 tap-target"
              >
                {t('modal_cancel_keep')}
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelToken(confirmCancelId);
                  setConfirmCancelId(null);
                  showToast('Ticket cancelled');
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold tap-target shadow-lg shadow-red-600/25"
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
