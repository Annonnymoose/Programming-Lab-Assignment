import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useQueue } from '../context/QueueContext';
import { Service } from '../types';
import {
  ShieldCheck,
  Scissors,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  PlusCircle,
  Edit2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';

export const OwnerAdmin: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    tokens,
    barbers,
    services,
    settings,
    waitingTokens,
    toggleBarberDuty,
    setMasterQueueOverride,
    updateService,
    addService,
  } = useQueue();

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Service Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState('');
  const [nameGu, setNameGu] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(150);
  const [isActive, setIsActive] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);

  // Today's KPI Calculations
  const kpiData = useMemo(() => {
    const doneTokens = tokens.filter(t => t.status === 'Done');
    const noshowTokens = tokens.filter(t => t.status === 'No-show');

    // Calculate Average Wait for serviced customers
    const waitedTokens = tokens.filter(t => t.called_at || t.in_chair_at);
    let avgWaitMinutes = 0;
    if (waitedTokens.length > 0) {
      const totalWaitMs = waitedTokens.reduce((acc, t) => {
        const start = new Date(t.created_at).getTime();
        const called = new Date(t.called_at || t.in_chair_at || t.created_at).getTime();
        return acc + Math.max(0, called - start);
      }, 0);
      avgWaitMinutes = Math.round(totalWaitMs / waitedTokens.length / 60000);
    }

    return {
      servedCount: doneTokens.length,
      avgWaitMinutes,
      noShowCount: noshowTokens.length,
      waitingCount: waitingTokens.length,
    };
  }, [tokens, waitingTokens]);

  // Open modal to add a new service
  const handleOpenAdd = () => {
    setEditingServiceId(null);
    setNameEn('');
    setNameGu('');
    setDuration(30);
    setPrice(150);
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing service
  const handleOpenEdit = (srv: Service) => {
    setEditingServiceId(srv.id);
    setNameEn(srv.name_en);
    setNameGu(srv.name_gu);
    setDuration(srv.duration_minutes);
    setPrice(srv.price);
    setIsActive(srv.is_active);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Service
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      setModalError('English service name is required.');
      return;
    }
    if (!nameGu.trim()) {
      setModalError('Gujarati service name is required.');
      return;
    }
    if (duration <= 0) {
      setModalError('Duration must be greater than 0 minutes.');
      return;
    }
    if (price < 0) {
      setModalError('Price cannot be negative.');
      return;
    }

    if (editingServiceId) {
      updateService({
        id: editingServiceId,
        name_en: nameEn.trim(),
        name_gu: nameGu.trim(),
        duration_minutes: Number(duration),
        price: Number(price),
        is_active: isActive,
      });
      showToast('Service updated successfully.');
    } else {
      addService({
        name_en: nameEn.trim(),
        name_gu: nameGu.trim(),
        duration_minutes: Number(duration),
        price: Number(price),
        is_active: isActive,
      });
      showToast('New service added successfully.');
    }

    setIsModalOpen(false);
  };

  // Toggle Service Active status directly from table
  const handleToggleActive = (srv: Service) => {
    updateService({ ...srv, is_active: !srv.is_active });
    showToast(`${srv.name_en} marked ${!srv.is_active ? 'active' : 'inactive'}.`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gray-900 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-3 text-yellow-500">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-100 tracking-tight">
              {t('admin_title')}
            </h1>
            <p className="text-xs text-gray-400">
              PIN Gate Verified (PIN: 1234) · Full Operational & Queue Controls
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          <span>{t('pin_authed_badge')}</span>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-yellow-500 text-gray-950 font-bold text-xs text-center shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* TODAY'S KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Served Today */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{t('kpi_served_today')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {kpiData.servedCount}
          </div>
          <span className="text-[10px] text-gray-500">Completed services</span>
        </div>

        {/* Average Wait Time */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{t('kpi_avg_wait')}</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-3xl font-black text-yellow-400 font-mono">
            {kpiData.avgWaitMinutes} {t('min')}
          </div>
          <span className="text-[10px] text-gray-500">From arrival to chair</span>
        </div>

        {/* No-Shows Today */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{t('kpi_noshows')}</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400 font-mono">
            {kpiData.noShowCount}
          </div>
          <span className="text-[10px] text-gray-500">Missed calls</span>
        </div>

        {/* Currently Waiting */}
        <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>{t('kpi_active_queue')}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono">
            {kpiData.waitingCount}
          </div>
          <span className="text-[10px] text-gray-500">In waiting line</span>
        </div>
      </div>

      {/* MASTER QUEUE SWITCH & STAFF ON DUTY TODAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Master Queue Override Switch */}
        <div className="p-6 rounded-3xl bg-gray-900 border border-gray-700 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-500">
              {t('master_queue_toggle')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Controls whether customers can join virtual line online. (Auto cutoff is 8:30 PM).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-gray-800 border border-gray-700">
            {/* Auto (Default) */}
            <button
              type="button"
              onClick={() => {
                setMasterQueueOverride(null);
                showToast('Online queue set to Auto (Cutoff at 8:30 PM).');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition tap-target ${
                settings.is_open_override === null
                  ? 'bg-yellow-500 text-gray-950 shadow-md shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('master_auto')}
            </button>

            {/* Force Open */}
            <button
              type="button"
              onClick={() => {
                setMasterQueueOverride(true);
                showToast('Online queue forced OPEN.');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition tap-target ${
                settings.is_open_override === true
                  ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('master_open')}
            </button>

            {/* Force Closed */}
            <button
              type="button"
              onClick={() => {
                setMasterQueueOverride(false);
                showToast('Online queue forced CLOSED.');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition tap-target ${
                settings.is_open_override === false
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t('master_closed')}
            </button>
          </div>
        </div>

        {/* Barbers On Duty Today */}
        <div className="p-6 rounded-3xl bg-gray-900 border border-gray-700 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-yellow-500">
              {t('barbers_duty_title')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toggle barbers present today. Off-duty staff are excluded from wait formulas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className={`p-3 rounded-2xl border transition flex flex-col justify-between space-y-2 ${
                  barber.on_duty
                    ? 'bg-gray-800/90 border-gray-700'
                    : 'bg-gray-900/60 border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-100">{barber.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      barber.on_duty ? 'bg-emerald-400' : 'bg-gray-600'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleBarberDuty(barber.id);
                    showToast(`${barber.name} marked ${!barber.on_duty ? 'On Duty' : 'Off Duty'}.`);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition tap-target flex items-center justify-center space-x-1 border ${
                    barber.on_duty
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750'
                  }`}
                >
                  <span>{barber.on_duty ? t('duty_on') : t('duty_off')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICE CATALOG MANAGER */}
      <div className="p-6 rounded-3xl bg-gray-900 border border-gray-700 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-2 text-yellow-500">
            <Scissors className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold text-gray-100">{t('service_manager_title')}</h2>
              <p className="text-xs text-gray-400">Configure prices, durations, and active statuses</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-xs tap-target transition shadow-md shadow-yellow-500/20"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>{t('btn_add_service')}</span>
          </button>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-800/80 uppercase text-[10px] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-3.5">{t('th_srv_name')}</th>
                <th className="p-3.5">{t('th_srv_duration')}</th>
                <th className="p-3.5">{t('th_srv_price')}</th>
                <th className="p-3.5">{t('th_srv_status')}</th>
                <th className="p-3.5 text-right">{t('th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {services.map((srv) => (
                <tr key={srv.id} className="hover:bg-gray-800/40 transition">
                  {/* Service Name (EN & GU) */}
                  <td className="p-3.5 font-bold text-gray-100">
                    <div>{srv.name_en}</div>
                    <div className="text-[11px] text-gray-400 font-normal">{srv.name_gu}</div>
                  </td>

                  {/* Duration */}
                  <td className="p-3.5 text-gray-300">
                    {srv.duration_minutes} {t('min')}
                  </td>

                  {/* Price */}
                  <td className="p-3.5 text-yellow-400 font-bold text-sm">
                    {t('rupee')}{srv.price}
                  </td>

                  {/* Active Toggle */}
                  <td className="p-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(srv)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition tap-target ${
                        srv.is_active
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        srv.is_active ? 'bg-emerald-400' : 'bg-gray-600'
                      }`} />
                      <span>{srv.is_active ? t('service_active') : t('service_inactive')}</span>
                    </button>
                  </td>

                  {/* Edit Action */}
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(srv)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-yellow-400 border border-gray-700 tap-target inline-flex items-center justify-center transition"
                      title={t('btn_edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT SERVICE MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-gray-900 border border-gray-700 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-100 flex items-center space-x-2">
                <Scissors className="w-4 h-4 text-yellow-500 mr-2" />
                <span>{editingServiceId ? t('modal_edit_service_title') : t('modal_add_service_title')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 tap-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4">
              {/* Name EN */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_service_name_en')} *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Haircut"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                />
              </div>

              {/* Name GU */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-300">
                  {t('label_service_name_gu')} *
                </label>
                <input
                  type="text"
                  required
                  value={nameGu}
                  onChange={(e) => setNameGu(e.target.value)}
                  placeholder="e.g. હેરકટ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-300">
                    {t('label_duration_minutes')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-300">
                    {t('label_price_inr')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-touch"
                  />
                </div>
              </div>

              {/* Active Toggle in form */}
              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500 bg-gray-800 border-gray-700"
                  />
                  <span className="text-xs font-bold text-gray-200">
                    {isActive ? t('service_active') : t('service_inactive')}
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold border border-gray-700 tap-target"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-xs font-bold shadow-lg shadow-yellow-500/20 tap-target"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
