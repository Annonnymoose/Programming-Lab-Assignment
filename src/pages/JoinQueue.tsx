import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { ArrowLeft, Check, User, Phone, Sparkles, Scissors, Clock, AlertTriangle, ArrowRight, Ticket } from 'lucide-react';

export const JoinQueue: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const {
    services,
    barbers,
    isOnlineOpen,
    createToken,
    calculateWaitTimeForNewCustomer,
  } = useQueue();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['srv-1']); // default Haircut
  const [selectedBarberId, setSelectedBarberId] = useState<string>('ANY');

  // Error & Feedback State
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    services?: string;
    duplicate?: { tokenId: string };
    general?: string;
  }>({});

  // Active services list
  const activeServices = useMemo(() => {
    return services.filter(s => s.is_active);
  }, [services]);

  // Dynamic calculations for selected services
  const selectedServices = useMemo(() => {
    return activeServices.filter(s => selectedServiceIds.includes(s.id));
  }, [activeServices, selectedServiceIds]);

  const totalMinutes = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices]);

  const estimatedWait = useMemo(() => {
    return calculateWaitTimeForNewCustomer(selectedServiceIds, selectedBarberId);
  }, [calculateWaitTimeForNewCustomer, selectedServiceIds, selectedBarberId]);

  // Toggle service selection (1 to 3 items)
  const toggleService = (id: string) => {
    setErrors(prev => ({ ...prev, services: undefined }));
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length === 1) {
        setErrors(prev => ({ ...prev, services: t('error_services_required') }));
        return;
      }
      setSelectedServiceIds(prev => prev.filter(sId => sId !== id));
    } else {
      if (selectedServiceIds.length >= 3) {
        setErrors(prev => ({ ...prev, services: t('error_services_required') }));
        return;
      }
      setSelectedServiceIds(prev => [...prev, id]);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(rawVal);
    setErrors(prev => ({ ...prev, phone: undefined, duplicate: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.name = t('error_name_required');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = t('error_phone_invalid');
    }

    if (selectedServiceIds.length < 1 || selectedServiceIds.length > 3) {
      newErrors.services = t('error_services_required');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Call Central Queue Engine
    const result = createToken({
      customer_name: customerName,
      phone: cleanPhone,
      service_ids: selectedServiceIds,
      preferred_barber_id: selectedBarberId,
      is_walk_in: false,
    });

    if (!result.success) {
      if (result.error === 'DUPLICATE_PHONE' && result.existingToken) {
        setErrors({
          duplicate: { tokenId: result.existingToken.id },
        });
      } else if (result.error === 'QUEUE_CLOSED') {
        setErrors({ general: t('queue_closed_banner') });
      } else if (result.error === 'INVALID_PHONE') {
        setErrors({ phone: t('error_phone_invalid') });
      } else {
        setErrors({ general: 'Failed to join queue. Please check your inputs.' });
      }
      return;
    }

    if (result.token) {
      navigate(`/status/${result.token.id}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="p-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-gray-100 tap-target flex items-center justify-center transition"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-100 tracking-tight">
            {t('join_title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {t('join_subtitle')}
          </p>
        </div>
      </div>

      {/* Online Queue Closed Warning Banner */}
      {!isOnlineOpen && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-700/80 text-amber-300 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>{t('online_closed_badge')}</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {t('queue_closed_banner')}
          </p>
        </div>
      )}

      {/* Duplicate Phone Number Alert */}
      {errors.duplicate && (
        <div className="p-5 rounded-2xl bg-red-950/70 border border-red-700/80 text-red-200 space-y-3 animate-shake">
          <div className="flex items-center space-x-2 font-bold text-sm text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{t('error_already_in_queue', { token: errors.duplicate.tokenId })}</span>
          </div>
          <p className="text-xs text-red-300">
            {language === 'GU'
              ? 'દરેક મોબાઇલ નંબર માટે ફક્ત એક સક્રિય ટોકન માન્ય છે.'
              : 'Only one active ticket is permitted per mobile number at a time.'}
          </p>
          <Link
            to={`/status/${errors.duplicate.tokenId}`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-xs tap-target transition shadow-lg"
          >
            <Ticket className="w-4 h-4 mr-2" />
            <span>{t('btn_go_to_existing_ticket')} (#{errors.duplicate.tokenId})</span>
          </Link>
        </div>
      )}

      {/* Main Join Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
            <User className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
            {t('label_full_name')} <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="text"
            disabled={!isOnlineOpen}
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder={t('placeholder_full_name')}
            className={`w-full px-4 py-3 rounded-xl bg-gray-900 border text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition min-h-touch ${
              errors.name ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-400 font-medium pl-1">{errors.name}</p>
          )}
        </div>

        {/* 10-Digit Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
            <Phone className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
            {t('label_phone')} <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm font-semibold">
              +91
            </div>
            <input
              type="tel"
              inputMode="numeric"
              disabled={!isOnlineOpen}
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t('placeholder_phone')}
              className={`w-full pl-14 pr-4 py-3 rounded-xl bg-gray-900 border text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition font-mono min-h-touch ${
                errors.phone ? 'border-red-500' : 'border-gray-700'
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="text-xs text-red-400 font-medium pl-1">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-gray-400 pl-1">
              {language === 'GU'
                ? '૧૦ અંકનો મોબાઈલ નંબર (દા.ત. 9876543210)'
                : '10 digits starting with 6-9 (e.g. 9876543210)'}
            </p>
          )}
        </div>

        {/* Multi-Select Active Services (1 to 3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
              {t('label_services')} <span className="text-red-400 ml-1">*</span>
            </label>
            <span className="text-[11px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full font-medium">
              {selectedServiceIds.length} / 3
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {activeServices.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id);
              const displayName = language === 'GU' ? service.name_gu : service.name_en;

              return (
                <button
                  key={service.id}
                  type="button"
                  disabled={!isOnlineOpen}
                  onClick={() => toggleService(service.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between tap-target ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500 shadow-md shadow-yellow-500/10'
                      : 'bg-gray-900/90 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-yellow-500 border-yellow-500 text-gray-950'
                          : 'border-gray-600 bg-gray-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-100 block">
                        {displayName}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {service.duration_minutes} {t('min')}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-yellow-400">
                    {t('rupee')}{service.price}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.services && (
            <p className="text-xs text-red-400 font-medium pl-1">{errors.services}</p>
          )}
        </div>

        {/* Barber Preference Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
            <Scissors className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
            {t('label_barber')}
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Any Barber (Fastest) */}
            <button
              type="button"
              disabled={!isOnlineOpen}
              onClick={() => setSelectedBarberId('ANY')}
              className={`p-3 rounded-xl border text-left transition tap-target ${
                selectedBarberId === 'ANY'
                  ? 'bg-yellow-500/10 border-yellow-500 shadow-md shadow-yellow-500/10'
                  : 'bg-gray-900/90 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-100 block">
                  {t('barber_any')}
                </span>
                {selectedBarberId === 'ANY' && (
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                )}
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">
                {language === 'GU' ? 'સૌથી ઓછો પ્રતીક્ષા સમય' : 'Shortest wait time'}
              </span>
            </button>

            {/* Individual Barbers */}
            {barbers.map((barber) => {
              const isSelected = selectedBarberId === barber.id;
              const isOnBreak = barber.status === 'On break';
              const isOffDuty = !barber.on_duty;

              return (
                <button
                  key={barber.id}
                  type="button"
                  disabled={!isOnlineOpen || isOffDuty}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`p-3 rounded-xl border text-left transition tap-target ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500 shadow-md shadow-yellow-500/10'
                      : 'bg-gray-900/90 border-gray-700 hover:border-gray-600'
                  } ${isOffDuty ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-100 block">
                      {barber.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    )}
                  </div>
                  {isOnBreak ? (
                    <span className="text-[10px] text-orange-400 block mt-1">
                      {barber.name} {language === 'GU' ? 'વિરામ પર છે' : 'is on break'}
                    </span>
                  ) : isOffDuty ? (
                    <span className="text-[10px] text-gray-500 block mt-1">
                      {language === 'GU' ? 'આજે રજા પર છે' : 'Off duty today'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {barber.status === 'Busy'
                        ? (language === 'GU' ? 'હાલમાં કાર્યરત' : 'Currently busy')
                        : (language === 'GU' ? 'ઉપલબ્ધ' : 'Available')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Summary Card */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">
              {t('summary_title')}
            </span>
            <span className="text-xs text-gray-400">
              {selectedServices.length} {language === 'GU' ? 'સેવા પસંદ' : 'selected'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-[10px] text-gray-400 block">{t('summary_duration')}</span>
              <span className="text-sm font-bold text-gray-100">{totalMinutes} {t('min')}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-[10px] text-gray-400 block">{t('summary_price')}</span>
              <span className="text-sm font-bold text-yellow-400">{t('rupee')}{totalPrice}</span>
            </div>
            <div className="p-2 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-[10px] text-gray-400 block">{t('summary_wait')}</span>
              <span className="text-sm font-bold text-emerald-400">
                {estimatedWait.isPaused ? 'Paused' : `~${estimatedWait.waitMinutes} ${t('min')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isOnlineOpen}
            className={`w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-black text-base shadow-xl transition transform active:scale-98 tap-target min-h-[52px] ${
              isOnlineOpen
                ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-yellow-500/25 cursor-pointer'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{t('btn_confirm_join')}</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
};
