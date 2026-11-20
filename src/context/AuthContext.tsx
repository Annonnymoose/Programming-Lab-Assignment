import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isStaffAuthed: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  staffPin: string;
}

const DEFAULT_STAFF_PIN = '1234';
const AUTH_STORAGE_KEY = 'salon_staff_auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStaffAuthed, setIsStaffAuthed] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const login = (pin: string): boolean => {
    if (pin.trim() === DEFAULT_STAFF_PIN) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsStaffAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsStaffAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ isStaffAuthed, login, logout, staffPin: DEFAULT_STAFF_PIN }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
