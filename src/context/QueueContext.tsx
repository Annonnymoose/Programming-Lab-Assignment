import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { QueueToken, Barber, Service, SalonSettings, TokenStatus, BarberStatus } from '../types';
import {
  loadInitialData,
  persistAndBroadcast,
  subscribeToQueueUpdates,
  isOnlineQueueOpen,
  isSalonOpen,
  getActiveBarbersCount,
  calculateEstimatedWaitMinutes,
  canTransitionStatus,
} from '../lib/queueEngine';

interface QueueContextType {
  tokens: QueueToken[];
  barbers: Barber[];
  services: Service[];
  settings: SalonSettings;
  isOnlineOpen: boolean;
  isSalonOpenNow: boolean;
  waitingTokens: QueueToken[];
  activeTokens: QueueToken[];
  activeBarbersCount: number;
  overallWaitMinutes: number;
  isOverallWaitPaused: boolean;
  hasActiveTokenForPhone: (phone: string) => QueueToken | undefined;
  calculateWaitTimeForNewCustomer: (serviceIds: string[], preferredBarberId: string) => {
    waitMinutes: number;
    isPaused: boolean;
    aheadCount: number;
  };
  calculateTokenWaitTime: (token: QueueToken) => {
    waitMinutes: number;
    isPaused: boolean;
    position: number;
  };
  createToken: (params: {
    customer_name: string;
    phone: string;
    service_ids: string[];
    preferred_barber_id: string;
    is_walk_in?: boolean;
  }) => {
    success: boolean;
    token?: QueueToken;
    error?: 'INVALID_NAME' | 'INVALID_PHONE' | 'INVALID_SERVICES' | 'DUPLICATE_PHONE' | 'QUEUE_CLOSED';
    existingToken?: QueueToken;
  };
  callNextCustomer: (barberId: string) => QueueToken | null;
  callSpecificCustomer: (tokenId: string) => boolean;
  startService: (tokenId: string) => void;
  completeService: (tokenId: string) => void;
  cancelToken: (tokenId: string) => void;
  markNoShow: (tokenId: string) => void;
  toggleBarberStatus: (barberId: string) => void;
  setBarberStatus: (barberId: string, status: BarberStatus) => void;
  toggleBarberDuty: (barberId: string) => void;
  setMasterQueueOverride: (override: boolean | null) => void;
  updateService: (service: Service) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  lastCalledToken: QueueToken | null;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState(loadInitialData);
  const [lastCalledToken, setLastCalledToken] = useState<QueueToken | null>(null);

  // Sync with storage and other tabs
  const refreshFromStorage = useCallback(() => {
    setData(loadInitialData());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToQueueUpdates(refreshFromStorage);
    return () => unsubscribe();
  }, [refreshFromStorage]);

  const { tokens, barbers, services, settings } = data;

  const isOnlineOpen = useMemo(() => isOnlineQueueOpen(settings), [settings]);
  const isSalonOpenNow = useMemo(() => isSalonOpen(settings), [settings]);

  const waitingTokens = useMemo(() => {
    return tokens.filter(t => t.status === 'Waiting');
  }, [tokens]);

  const activeTokens = useMemo(() => {
    return tokens.filter(t => ['Waiting', 'Called', 'In chair'].includes(t.status));
  }, [tokens]);

  const activeBarbersCount = useMemo(() => {
    return getActiveBarbersCount(barbers);
  }, [barbers]);

  // Overall salon wait calculation
  const { waitMinutes: overallWaitMinutes, isPaused: isOverallWaitPaused } = useMemo(() => {
    return calculateEstimatedWaitMinutes(waitingTokens, barbers);
  }, [waitingTokens, barbers]);

  // Check if a 10-digit phone number already has an active token
  const hasActiveTokenForPhone = useCallback((phone: string): QueueToken | undefined => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    return tokens.find(t => 
      ['Waiting', 'Called', 'In chair'].includes(t.status) &&
      t.phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );
  }, [tokens]);

  // Calculate wait for a prospective customer selecting services and barber preference
  const calculateWaitTimeForNewCustomer = useCallback((
    serviceIds: string[],
    preferredBarberId: string
  ) => {
    const activeCount = getActiveBarbersCount(barbers);
    if (activeCount === 0) {
      return { waitMinutes: 0, isPaused: true, aheadCount: waitingTokens.length };
    }

    // Filter tokens ahead according to barber preference
    let relevantAheadTokens: QueueToken[] = [];
    if (preferredBarberId === 'ANY') {
      relevantAheadTokens = waitingTokens;
    } else {
      relevantAheadTokens = waitingTokens.filter(t => 
        t.preferred_barber_id === preferredBarberId || t.preferred_barber_id === 'ANY'
      );
    }

    // Also consider in-chair time if any
    const totalDurationAhead = relevantAheadTokens.reduce((acc, t) => acc + (t.total_duration_minutes || 0), 0);
    
    // If specific barber chosen, wait is divided by 1 (that specific barber), otherwise by all active barbers
    const divisor = preferredBarberId === 'ANY' ? activeCount : 1;
    const waitMinutes = Math.ceil(totalDurationAhead / divisor);

    return {
      waitMinutes,
      isPaused: false,
      aheadCount: relevantAheadTokens.length,
    };
  }, [barbers, waitingTokens]);

  // Calculate wait and position for an existing token
  const calculateTokenWaitTime = useCallback((token: QueueToken) => {
    if (token.status === 'In chair') {
      return { waitMinutes: 0, isPaused: false, position: 0 };
    }
    if (token.status === 'Called') {
      return { waitMinutes: 0, isPaused: false, position: 1 };
    }
    if (token.status !== 'Waiting') {
      return { waitMinutes: 0, isPaused: false, position: 0 };
    }

    const activeCount = getActiveBarbersCount(barbers);
    if (activeCount === 0) {
      return { waitMinutes: 0, isPaused: true, position: 1 };
    }

    // Find all waiting tokens created earlier than this token
    const tokenIndex = waitingTokens.findIndex(t => t.id === token.id);
    const position = tokenIndex >= 0 ? tokenIndex + 1 : 1;
    const tokensAhead = tokenIndex >= 0 ? waitingTokens.slice(0, tokenIndex) : [];

    const totalMinutesAhead = tokensAhead.reduce((acc, t) => acc + (t.total_duration_minutes || 0), 0);
    const divisor = token.preferred_barber_id === 'ANY' ? activeCount : 1;
    const waitMinutes = Math.ceil(totalMinutesAhead / divisor);

    return {
      waitMinutes,
      isPaused: false,
      position,
    };
  }, [barbers, waitingTokens]);

  // Create a new queue token (with duplicate check & cutoff validation)
  const createToken = useCallback((params: {
    customer_name: string;
    phone: string;
    service_ids: string[];
    preferred_barber_id: string;
    is_walk_in?: boolean;
  }) => {
    const { customer_name, phone, service_ids, preferred_barber_id, is_walk_in = false } = params;

    // Check online cutoff unless walk-in
    if (!is_walk_in && !isOnlineOpen) {
      return { success: false, error: 'QUEUE_CLOSED' as const };
    }

    const trimmedName = customer_name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'INVALID_NAME' as const };
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { success: false, error: 'INVALID_PHONE' as const };
    }

    if (!service_ids || service_ids.length < 1 || service_ids.length > 3) {
      return { success: false, error: 'INVALID_SERVICES' as const };
    }

    // Check duplicate active token for this phone
    const existing = hasActiveTokenForPhone(cleanPhone);
    if (existing) {
      return { success: false, error: 'DUPLICATE_PHONE' as const, existingToken: existing };
    }

    // Calculate totals from selected services
    const selectedServices = services.filter(s => service_ids.includes(s.id));
    const total_duration_minutes = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
    const total_price = selectedServices.reduce((acc, s) => acc + s.price, 0);

    // Get next token ID strictly sequentially (e.g. S-1, S-2...)
    let maxIdNum = 0;
    tokens.forEach(t => {
      const match = t.id.match(/^S-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    });

    try {
      const savedCounter = localStorage.getItem('salon_token_counter');
      if (savedCounter) {
        const num = parseInt(savedCounter, 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    } catch (_) {}

    const nextCounter = maxIdNum + 1;
    localStorage.setItem('salon_token_counter', String(nextCounter));

    const newToken: QueueToken = {
      id: `S-${nextCounter}`,
      customer_name: trimmedName,
      phone: cleanPhone,
      service_ids,
      preferred_barber_id: preferred_barber_id || 'ANY',
      status: 'Waiting',
      created_at: new Date().toISOString(),
      is_walk_in,
      total_duration_minutes,
      total_price,
    };

    const updatedTokens = [...tokens, newToken];
    setData(prev => ({ ...prev, tokens: updatedTokens }));
    persistAndBroadcast({ tokens: updatedTokens });

    // Store in localStorage for user convenience
    if (typeof window !== 'undefined') {
      localStorage.setItem('salon_last_token', newToken.id);
    }

    return { success: true, token: newToken };
  }, [isOnlineOpen, hasActiveTokenForPhone, services, tokens]);

  // Barber matching algorithm: Call next customer for Barber X
  const callNextCustomer = useCallback((barberId: string): QueueToken | null => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber || !barber.on_duty || barber.status === 'On break') {
      return null;
    }

    // Ensure barber is not already occupied with another customer
    if (barber.current_token_id) {
      const activeForBarber = tokens.find(t => 
        t.id === barber.current_token_id && (t.status === 'Called' || t.status === 'In chair')
      );
      if (activeForBarber) {
        return null;
      }
    }

    // Find earliest Waiting customer matching this barber or 'ANY'
    const matchedToken = waitingTokens.find(token => 
      token.preferred_barber_id === barberId || token.preferred_barber_id === 'ANY'
    );

    if (!matchedToken) {
      return null;
    }

    if (!canTransitionStatus(matchedToken.status, 'Called')) {
      return null;
    }

    const updatedTokens = tokens.map(t => {
      if (t.id === matchedToken.id) {
        return {
          ...t,
          status: 'Called' as TokenStatus,
          assigned_barber_id: barberId,
          called_at: new Date().toISOString(),
        };
      }
      return t;
    });

    const updatedBarbers = barbers.map(b => {
      if (b.id === barberId) {
        return {
          ...b,
          status: 'Busy' as BarberStatus,
          current_token_id: matchedToken.id,
        };
      }
      return b;
    });

    const calledTokenWithBarber = {
      ...matchedToken,
      status: 'Called' as TokenStatus,
      assigned_barber_id: barberId,
      called_at: new Date().toISOString(),
    };

    setLastCalledToken(calledTokenWithBarber);
    setData(prev => ({ ...prev, tokens: updatedTokens, barbers: updatedBarbers }));
    persistAndBroadcast({ tokens: updatedTokens, barbers: updatedBarbers });

    return calledTokenWithBarber;
  }, [barbers, waitingTokens, tokens]);

  // Call a specific waiting token directly (matches eligible available barber)
  const callSpecificCustomer = useCallback((tokenId: string): boolean => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token || token.status !== 'Waiting') return false;

    // Find an available barber matching this customer's preference
    let eligibleBarber: Barber | undefined;
    if (token.preferred_barber_id === 'ANY') {
      eligibleBarber = barbers.find(b => 
        b.on_duty && b.status !== 'On break' && (!b.current_token_id || !tokens.some(t => t.id === b.current_token_id && ['Called', 'In chair'].includes(t.status)))
      );
    } else {
      const targetBarber = barbers.find(b => b.id === token.preferred_barber_id);
      if (targetBarber && targetBarber.on_duty && targetBarber.status !== 'On break') {
        const isOccupied = tokens.some(t => t.id === targetBarber.current_token_id && ['Called', 'In chair'].includes(t.status));
        if (!isOccupied) eligibleBarber = targetBarber;
      }
    }

    if (!eligibleBarber) return false;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'Called' as TokenStatus,
          assigned_barber_id: eligibleBarber!.id,
          called_at: new Date().toISOString(),
        };
      }
      return t;
    });

    const updatedBarbers = barbers.map(b => {
      if (b.id === eligibleBarber!.id) {
        return {
          ...b,
          status: 'Busy' as BarberStatus,
          current_token_id: tokenId,
        };
      }
      return b;
    });

    const calledTokenWithBarber = {
      ...token,
      status: 'Called' as TokenStatus,
      assigned_barber_id: eligibleBarber.id,
      called_at: new Date().toISOString(),
    };

    setLastCalledToken(calledTokenWithBarber);
    setData(prev => ({ ...prev, tokens: updatedTokens, barbers: updatedBarbers }));
    persistAndBroadcast({ tokens: updatedTokens, barbers: updatedBarbers });
    return true;
  }, [tokens, barbers]);

  // Barber starts service (Called -> In chair)
  const startService = useCallback((tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token || !canTransitionStatus(token.status, 'In chair')) return;

    const now = new Date().toISOString();
    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'In chair' as TokenStatus,
          in_chair_at: now,
        };
      }
      return t;
    });

    const updatedBarbers = barbers.map(b => {
      if (b.id === token.assigned_barber_id) {
        return {
          ...b,
          status: 'Busy' as BarberStatus,
          current_token_id: tokenId,
          started_at: now,
        };
      }
      return b;
    });

    setData(prev => ({ ...prev, tokens: updatedTokens, barbers: updatedBarbers }));
    persistAndBroadcast({ tokens: updatedTokens, barbers: updatedBarbers });
  }, [tokens, barbers]);

  // Barber finishes service (In chair -> Done)
  const completeService = useCallback((tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token || !canTransitionStatus(token.status, 'Done')) return;

    const now = new Date().toISOString();
    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'Done' as TokenStatus,
          completed_at: now,
        };
      }
      return t;
    });

    const updatedBarbers = barbers.map(b => {
      if (b.id === token.assigned_barber_id) {
        return {
          ...b,
          status: 'Available' as BarberStatus,
          current_token_id: null,
          started_at: null,
        };
      }
      return b;
    });

    setData(prev => ({ ...prev, tokens: updatedTokens, barbers: updatedBarbers }));
    persistAndBroadcast({ tokens: updatedTokens, barbers: updatedBarbers });
  }, [tokens, barbers]);

  // Customer or Reception cancels ticket (Waiting -> Cancelled)
  const cancelToken = useCallback((tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token || !canTransitionStatus(token.status, 'Cancelled')) return;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return { ...t, status: 'Cancelled' as TokenStatus };
      }
      return t;
    });

    setData(prev => ({ ...prev, tokens: updatedTokens }));
    persistAndBroadcast({ tokens: updatedTokens });
  }, [tokens]);

  // Reception or Barber marks No-show (Called -> No-show)
  const markNoShow = useCallback((tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token || !canTransitionStatus(token.status, 'No-show')) return;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return { ...t, status: 'No-show' as TokenStatus };
      }
      return t;
    });

    // Free the barber who called this customer
    const updatedBarbers = barbers.map(b => {
      if (b.current_token_id === tokenId) {
        return {
          ...b,
          status: 'Available' as BarberStatus,
          current_token_id: null,
          started_at: null,
        };
      }
      return b;
    });

    setData(prev => ({ ...prev, tokens: updatedTokens, barbers: updatedBarbers }));
    persistAndBroadcast({ tokens: updatedTokens, barbers: updatedBarbers });
  }, [tokens, barbers]);

  // Toggle Barber break status
  const toggleBarberStatus = useCallback((barberId: string) => {
    const updatedBarbers = barbers.map(b => {
      if (b.id === barberId) {
        const nextStatus: BarberStatus = b.status === 'On break' ? 'Available' : 'On break';
        return { ...b, status: nextStatus };
      }
      return b;
    });
    setData(prev => ({ ...prev, barbers: updatedBarbers }));
    persistAndBroadcast({ barbers: updatedBarbers });
  }, [barbers]);

  const setBarberStatus = useCallback((barberId: string, status: BarberStatus) => {
    const updatedBarbers = barbers.map(b => {
      if (b.id === barberId) {
        return { ...b, status };
      }
      return b;
    });
    setData(prev => ({ ...prev, barbers: updatedBarbers }));
    persistAndBroadcast({ barbers: updatedBarbers });
  }, [barbers]);

  // Toggle Barber on-duty status
  const toggleBarberDuty = useCallback((barberId: string) => {
    const updatedBarbers = barbers.map(b => {
      if (b.id === barberId) {
        return { ...b, on_duty: !b.on_duty };
      }
      return b;
    });
    setData(prev => ({ ...prev, barbers: updatedBarbers }));
    persistAndBroadcast({ barbers: updatedBarbers });
  }, [barbers]);

  // Set Master Queue Override
  const setMasterQueueOverride = useCallback((override: boolean | null) => {
    const updatedSettings = { ...settings, is_open_override: override };
    setData(prev => ({ ...prev, settings: updatedSettings }));
    persistAndBroadcast({ settings: updatedSettings });
  }, [settings]);

  // Update a Service
  const updateService = useCallback((service: Service) => {
    const updatedServices = services.map(s => s.id === service.id ? service : s);
    setData(prev => ({ ...prev, services: updatedServices }));
    persistAndBroadcast({ services: updatedServices });
  }, [services]);

  // Add a Service
  const addService = useCallback((serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    const updatedServices = [...services, newService];
    setData(prev => ({ ...prev, services: updatedServices }));
    persistAndBroadcast({ services: updatedServices });
  }, [services]);

  return (
    <QueueContext.Provider
      value={{
        tokens,
        barbers,
        services,
        settings,
        isOnlineOpen,
        isSalonOpenNow,
        waitingTokens,
        activeTokens,
        activeBarbersCount,
        overallWaitMinutes,
        isOverallWaitPaused,
        hasActiveTokenForPhone,
        calculateWaitTimeForNewCustomer,
        calculateTokenWaitTime,
        createToken,
        callNextCustomer,
        callSpecificCustomer,
        startService,
        completeService,
        cancelToken,
        markNoShow,
        toggleBarberStatus,
        setBarberStatus,
        toggleBarberDuty,
        setMasterQueueOverride,
        updateService,
        addService,
        lastCalledToken,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
