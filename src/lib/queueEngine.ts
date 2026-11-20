import { Barber, QueueToken, Service, SalonSettings, TokenStatus, BarberStatus } from '../types';
import { supabase, isSupabaseConnected } from './supabase';

// Initial Seed Services
export const SEED_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name_en: 'Haircut',
    name_gu: 'હેરકટ',
    duration_minutes: 30,
    price: 150,
    is_active: true,
  },
  {
    id: 'srv-2',
    name_en: 'Beard trim',
    name_gu: 'દાઢી ટ્રિમ',
    duration_minutes: 15,
    price: 80,
    is_active: true,
  },
  {
    id: 'srv-3',
    name_en: 'Hair spa',
    name_gu: 'હેર સ્પા',
    duration_minutes: 45,
    price: 400,
    is_active: true,
  },
];

// Initial Seed Barbers
export const SEED_BARBERS: Barber[] = [
  { id: 'barber-1', name: 'Ravi', status: 'Available', on_duty: true },
  { id: 'barber-2', name: 'Amit', status: 'Available', on_duty: true },
  { id: 'barber-3', name: 'Imran', status: 'Available', on_duty: true },
];

export const DEFAULT_SETTINGS: SalonSettings = {
  is_open_override: null, // null = auto time check, true = force open, false = force closed
  closing_time_str: '21:00', // 9:00 PM
  online_cutoff_str: '20:30', // 8:30 PM
};

const STORAGE_KEYS = {
  TOKENS: 'salon_tokens',
  BARBERS: 'salon_barbers',
  SERVICES: 'salon_services',
  SETTINGS: 'salon_settings',
  LAST_TOKEN_NUM: 'salon_token_counter',
};

// Cross-tab broadcast channel for real-time local sync (< 50ms)
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('salon_queue_sync_channel')
  : null;

// Helper: Check if online queue is currently open
export function isOnlineQueueOpen(settings: SalonSettings): boolean {
  if (settings.is_open_override !== null) {
    return settings.is_open_override;
  }
  const now = new Date();
  const [cutoffH, cutoffM] = settings.online_cutoff_str.split(':').map(Number);
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffH, cutoffM, 0, 0);

  const [closeH, closeM] = settings.closing_time_str.split(':').map(Number);
  const closeTime = new Date();
  closeTime.setHours(closeH, closeM, 0, 0);

  // If before cutoff time, it's open
  return now < cutoffTime;
}

// Helper: Check if salon is open for walk-ins
export function isSalonOpen(settings: SalonSettings): boolean {
  if (settings.is_open_override === false) {
    return false;
  }
  const now = new Date();
  const [closeH, closeM] = settings.closing_time_str.split(':').map(Number);
  const closeTime = new Date();
  closeTime.setHours(closeH, closeM, 0, 0);
  return now < closeTime;
}

// Calculation: Active barbers count (on duty and not on break)
export function getActiveBarbersCount(barbers: Barber[]): number {
  return barbers.filter(b => b.on_duty && b.status !== 'On break').length;
}

// Calculation: Estimated Wait Time
// Formula: Total minutes of services ahead / Number of active barbers
export function calculateEstimatedWaitMinutes(
  tokensAhead: QueueToken[],
  barbers: Barber[]
): { waitMinutes: number; isPaused: boolean; textCode?: string } {
  const activeCount = getActiveBarbersCount(barbers);

  if (activeCount === 0) {
    return { waitMinutes: 0, isPaused: true, textCode: 'queue_paused' };
  }

  // Sum total service minutes ahead
  const totalMinutesAhead = tokensAhead.reduce((acc, token) => {
    return acc + (token.total_duration_minutes || 0);
  }, 0);

  const waitMinutes = Math.ceil(totalMinutesAhead / activeCount);
  return { waitMinutes, isPaused: false };
}

// State transition validation (Strictly One-Way Lifecycle)
const ALLOWED_TRANSITIONS: Record<TokenStatus, TokenStatus[]> = {
  'Waiting': ['Called', 'Cancelled'],
  'Called': ['In chair', 'No-show'],
  'In chair': ['Done'],
  'Done': [],
  'Cancelled': [],
  'No-show': [],
};

export function canTransitionStatus(from: TokenStatus, to: TokenStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Load initial state with localStorage hydration
export function loadInitialData() {
  let tokens: QueueToken[] = [];
  let barbers: Barber[] = SEED_BARBERS;
  let services: Service[] = SEED_SERVICES;
  let settings: SalonSettings = DEFAULT_SETTINGS;

  if (typeof window !== 'undefined') {
    try {
      const savedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      if (savedTokens) tokens = JSON.parse(savedTokens);

      const savedBarbers = localStorage.getItem(STORAGE_KEYS.BARBERS);
      if (savedBarbers) barbers = JSON.parse(savedBarbers);

      const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (savedServices) services = JSON.parse(savedServices);

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) settings = JSON.parse(savedSettings);
    } catch (e) {
      console.error('Error loading salon storage data:', e);
    }
  }

  return { tokens, barbers, services, settings };
}

// Save state to storage and broadcast
export function persistAndBroadcast(data: {
  tokens?: QueueToken[];
  barbers?: Barber[];
  services?: Service[];
  settings?: SalonSettings;
}) {
  if (typeof window === 'undefined') return;

  if (data.tokens) localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(data.tokens));
  if (data.barbers) localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(data.barbers));
  if (data.services) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data.services));
  if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SALON_STATE_UPDATED', timestamp: Date.now() });
  }
}

export function subscribeToQueueUpdates(callback: () => void): () => void {
  if (!broadcastChannel) {
    const handleStorage = (e: StorageEvent) => {
      if (Object.values(STORAGE_KEYS).includes(e.key || '')) {
        callback();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.type === 'SALON_STATE_UPDATED') {
      callback();
    }
  };

  broadcastChannel.addEventListener('message', handleMessage);
  return () => broadcastChannel.removeEventListener('message', handleMessage);
}
