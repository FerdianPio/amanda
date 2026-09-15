import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { X, UserCheck, Shield, Briefcase } from 'lucide-react';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getDemoAccounts().then(setAccounts).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = async (u: any) => {
    setLoading(true);
    try {
      await login({ userId: u.id });
      onClose();
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="user-switcher-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div
        id="user-switcher-card"
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Ganti Akun Demo</h2>
            <p className="text-xs text-gray-500">
              Ganti role & Business Unit secara instan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {accounts.map((acc) => {
            const isCurrent = user?.id === acc.id;
            return (
              <button
                key={acc.id}
                id={`btn-select-user-${acc.id}`}
                onClick={() => handleSelectUser(acc)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all hover:shadow-xs"
                style={{
                  borderColor: isCurrent ? acc.accent : '#E5E7EB',
                  backgroundColor: isCurrent ? acc.accentSoft : 'white',
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: acc.accent }}
                  >
                    {acc.initials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-gray-900">{acc.name}</p>
                      {acc.role === 'supervisor' ? (
                        <span className="flex items-center text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Spv
                        </span>
                      ) : (
                        <span className="flex items-center text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                          <Briefcase className="w-2.5 h-2.5 mr-0.5" /> Sales
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {acc.businessUnitName} • {acc.area}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <div className="flex items-center text-xs font-bold" style={{ color: acc.accent }}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500">
            Login session dikelola aman via JWT dan PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
};
