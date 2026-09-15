import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Check, RefreshCw } from 'lucide-react';

interface ThemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({ isOpen, onClose }) => {
  const { businessUnit, theme, updateThemeColors } = useAuth();

  const [accent, setAccent] = useState(theme?.accent || '#C97A3A');
  const [accentSoft, setAccentSoft] = useState(theme?.accentSoft || '#F5E7DA');
  const [primary, setPrimary] = useState(theme?.primaryColor || '#0D6E63');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Amanda Bakery (Warm Bronze)',
      accent: '#C97A3A',
      accentSoft: '#F5E7DA',
      primary: '#0D6E63',
    },
    {
      name: 'Amanda Mart (Emerald Retail)',
      accent: '#2E7D32',
      accentSoft: '#E8F5E9',
      primary: '#1B5E20',
    },
    {
      name: 'Amanda Mart (Sapphire Retail)',
      accent: '#1D4ED8',
      accentSoft: '#DBEAFE',
      primary: '#1E3A8A',
    },
    {
      name: 'Amanda Fresh (Ruby Red)',
      accent: '#B91C1C',
      accentSoft: '#FEE2E2',
      primary: '#7F1D1D',
    },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateThemeColors({
        accentColor: accent,
        accentSoftColor: accentSoft,
        primaryColor: primary,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to update theme:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="theme-editor-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    >
      <div
        id="theme-editor-card"
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Kustomisasi Tema {businessUnit?.name}
            </h2>
            <p className="text-xs text-gray-500">
              Warna tersimpan persisten di PostgreSQL
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Preset Palettes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Pilihan Preset Branding:
            </label>
            <div className="space-y-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAccent(p.accent);
                    setAccentSoft(p.accentSoft);
                    setPrimary(p.primary);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg border text-xs font-medium hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: accent === p.accent ? accent : '#E5E7EB',
                    backgroundColor: accent === p.accent ? p.accentSoft : 'white',
                  }}
                >
                  <span className="text-gray-800">{p.name}</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-4 h-4 rounded-full shadow-xs"
                      style={{ backgroundColor: p.accent }}
                    />
                    <span
                      className="w-4 h-4 rounded-full shadow-xs border border-gray-200"
                      style={{ backgroundColor: p.accentSoft }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Warna Aksen Kustom (HEX):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => {
                  setAccent(e.target.value);
                  setAccentSoft(`${e.target.value}25`);
                }}
                className="w-9 h-9 rounded-lg border border-gray-300 p-0.5 cursor-pointer"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          {/* Live Preview Pill */}
          <div
            className="p-3 rounded-xl border flex items-center justify-between"
            style={{ backgroundColor: accentSoft, borderColor: accent }}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ backgroundColor: accent }}
              >
                {theme?.initials || 'BU'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Preview Tampilan</p>
                <p className="text-[11px] text-gray-600">Aksen aktif & soft accent</p>
              </div>
            </div>
            <button
              className="px-2.5 py-1 text-xs font-semibold text-white rounded-md shadow-xs"
              style={{ backgroundColor: accent }}
            >
              Contoh Tombol
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg"
          >
            Batal
          </button>
          <button
            id="btn-save-theme-to-postgres"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-opacity disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan ke DB...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan ke PostgreSQL</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
