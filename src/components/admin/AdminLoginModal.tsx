import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { Lock, ShieldAlert, KeyRound, Check, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(null);

    const result = await login(password);
    setIsLoading(false);

    if (result.success) {
      setPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#ece6d8] border border-[#3e3831] p-6 w-full max-w-sm shadow-[4px_4px_0px_#3e3831] relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-[#746b60] hover:text-[#2d2722]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-[#3e3831] pb-3 mb-4">
          <div className="w-8 h-8 bg-[#c52838] flex items-center justify-center text-white">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2d2722]">
              Administrator Login
            </h3>
            <p className="text-[11px] font-mono text-[#746b60]">
              Radio receiver management & ingestion
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#fae2e4] border border-[#c52838] text-xs font-mono text-[#931523] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-[#544d44] mb-1">
              Admin Password
            </label>
            <input
              type="password"
              autoFocus
              required
              placeholder="Enter administrator password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-2 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
            <p className="text-[10px] font-mono text-[#746b60] mt-1">
              Default initial password: <code className="text-[#2d2722]">ambient-radio-admin</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3e3831]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-xs font-mono text-[#2d2722] hover:bg-[#dcd6c7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="px-4 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying...' : 'Access Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
