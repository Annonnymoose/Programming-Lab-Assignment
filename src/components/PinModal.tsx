import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Delete, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PinModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onSuccess, onCancel }) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = (inputPin: string) => {
    const success = login(inputPin);
    if (success) {
      setPin('');
      setError(false);
      if (onSuccess) onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 text-center">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-yellow-500">
            <Lock className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-100">{t('pin_modal_title')}</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 tap-target flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">{t('pin_modal_desc')}</p>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center space-x-4 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index
                  ? 'bg-yellow-500 border-yellow-500 scale-110 shadow-lg shadow-yellow-500/50'
                  : 'bg-gray-800 border-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 text-xs font-medium text-red-400 bg-red-950/60 border border-red-800 rounded-lg py-2 px-3 animate-shake">
            {t('pin_error')}
          </div>
        )}

        {/* Numeric Keypad (Minimum 44px tap target) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-xl font-bold text-gray-100 transition active:scale-95 border border-gray-700 tap-target flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-sm font-semibold text-gray-400 transition active:scale-95 border border-gray-700 tap-target flex items-center justify-center"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-xl font-bold text-gray-100 transition active:scale-95 border border-gray-700 tap-target flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-xl bg-gray-800/60 hover:bg-gray-700 text-gray-400 transition active:scale-95 border border-gray-700 tap-target flex items-center justify-center"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Back Link */}
        <button
          onClick={handleClose}
          className="text-xs text-gray-400 hover:text-gray-200 underline tap-target"
        >
          {t('pin_cancel')}
        </button>
      </div>
    </div>
  );
};
