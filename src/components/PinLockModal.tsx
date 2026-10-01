import React, { useState } from 'react';
import { Lock, Delete, Fingerprint, KeyRound, Check } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'setup';
  currentPin: string;
  onSuccess: (newPin?: string) => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  currentPin,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (error) setError('');

    if (mode === 'unlock') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          if (next === currentPin) {
            setTimeout(() => {
              setPin('');
              onSuccess();
            }, 150);
          } else {
            setTimeout(() => {
              setError('Code PIN incorrect. Réessayez.');
              setPin('');
            }, 200);
          }
        }
      }
    } else {
      // setup mode
      if (step === 'enter') {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      } else {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            setTimeout(() => {
              onSuccess(pin);
            }, 200);
          } else {
            setTimeout(() => {
              setError('Les codes ne correspondent pas.');
              setConfirmPin('');
            }, 200);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (mode === 'unlock') {
      setPin(pin.slice(0, -1));
    } else {
      if (step === 'enter') {
        setPin(pin.slice(0, -1));
      } else {
        setConfirmPin(confirmPin.slice(0, -1));
      }
    }
  };

  const handleBiometric = () => {
    // Biometric instant pass
    onSuccess();
  };

  const currentDisplayLength = mode === 'unlock' ? pin.length : step === 'enter' ? pin.length : confirmPin.length;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
      <div className="w-full flex justify-between items-center text-slate-400">
        <span className="text-xs font-mono">StarOffice Vault</span>
        {onCancel && mode === 'setup' && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Annuler
          </button>
        )}
      </div>

      <div className="flex flex-col items-center text-center max-w-xs">
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
          {mode === 'unlock' ? <Lock className="w-8 h-8" /> : <KeyRound className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          {mode === 'unlock'
            ? 'StarOffice est verrouillé'
            : step === 'enter'
            ? 'Définir un code PIN'
            : 'Confirmer le code PIN'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'unlock'
            ? 'Entrez votre code à 4 chiffres ou utilisez la biométrie'
            : step === 'enter'
            ? 'Choisissez 4 chiffres pour protéger vos documents'
            : 'Saisissez de nouveau votre code PIN'}
        </p>

        {/* PIN Dots */}
        <div className="flex gap-4 mb-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                idx < currentDisplayLength
                  ? 'bg-indigo-500 scale-110 shadow-md shadow-indigo-500/50'
                  : 'border-2 border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-400 font-medium mt-2 animate-bounce">{error}</p>}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-white font-semibold text-2xl flex items-center justify-center transition-all shadow-md active:scale-95"
          >
            {d}
          </button>
        ))}

        {mode === 'unlock' ? (
          <button
            onClick={handleBiometric}
            className="h-16 rounded-full bg-slate-800/40 hover:bg-slate-700/60 active:bg-emerald-600/30 text-emerald-400 flex items-center justify-center transition-all"
            title="Capteur d'empreinte digitale"
          >
            <Fingerprint className="w-7 h-7" />
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-white font-semibold text-2xl flex items-center justify-center transition-all shadow-md active:scale-95"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="h-16 rounded-full bg-slate-800/40 hover:bg-slate-700/60 active:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          title="Effacer"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
