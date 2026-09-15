import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle2, XCircle, RotateCcw, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

export const DevToolsBar: React.FC = () => {
  const { user, login, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [verifyResults, setVerifyResults] = useState<{ test: string; passed: boolean }[] | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSetup = async () => {
    setIsSettingUp(true);
    setResetMessage(null);
    try {
      const res = await api.setupDatabase();
      setResetMessage(`✅ Setup PGlite berhasil: ${res.tables.length} tabel & demo data siap.`);
      await refreshUser();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      setResetMessage('❌ Setup gagal: ' + err.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResetMessage(null);
    try {
      const res = await api.migrateDatabase();
      setResetMessage(`✅ Migrasi PGlite berhasil: ${res.tables.length} tabel aktif.`);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      setResetMessage('❌ Migrasi gagal: ' + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyResults(null);
    try {
      const res = await api.verifyDatabase();
      setVerifyResults(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Kembalikan semua data ke baseline demo original? Semua perubahan baru akan direset.')) {
      return;
    }
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetDatabase();
      setResetMessage(res.message);
      await refreshUser();
      setTimeout(() => setResetMessage(null), 3000);
    } catch (err: any) {
      setResetMessage('Reset gagal: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <aside
      id="dev-tools-panel"
      aria-label="Development and Scenario Tools"
      className="fixed bottom-14 left-0 right-0 z-20 max-w-md mx-auto px-3 pointer-events-none"
    >
      <div className="bg-gray-900/95 text-white rounded-xl shadow-lg border border-gray-700/80 backdrop-blur-md overflow-hidden pointer-events-auto transition-all text-xs">
        {/* Bar Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
          <div className="flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-[11px] text-gray-200">
              Demo Scenarios & DB
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-quick-switch-andi"
              onClick={() => login({ userId: 'u-andi' })}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                user?.id === 'u-andi'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title="Switch to Andi (Bakery)"
            >
              Andi
            </button>
            <button
              id="btn-quick-switch-siti"
              onClick={() => login({ userId: 'u-siti' })}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                user?.id === 'u-siti'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title="Switch to Siti (Mart)"
            >
              Siti
            </button>
            <button
              id="btn-quick-switch-budi"
              onClick={() => login({ userId: 'u-budi' })}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                user?.id === 'u-budi'
                  ? 'bg-purple-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title="Switch to Budi (Supervisor)"
            >
              Budi(Spv)
            </button>

            <button
              id="btn-toggle-dev-tools"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-white"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Panel */}
        {isOpen && (
          <div className="p-3 space-y-2.5 bg-gray-950/80">
            {resetMessage && (
              <div className="p-2 text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md">
                {resetMessage}
              </div>
            )}

            <div className="flex items-center space-x-1.5">
              <button
                id="btn-setup-pglite-database"
                onClick={handleSetup}
                disabled={isSettingUp || isMigrating}
                className="flex items-center space-x-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-[11px]"
                title="Jalankan migrasi skema tabel dan isi data awal baseline demo"
              >
                <span>{isSettingUp ? 'Setup...' : 'Setup DB'}</span>
              </button>

              <button
                id="btn-migrate-pglite-database"
                onClick={handleMigrate}
                disabled={isMigrating || isSettingUp}
                className="flex items-center space-x-1 py-1.5 px-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-[11px]"
                title="Terapkan skema & migrasi tabel PostgreSQL (PGlite)"
              >
                <span>{isMigrating ? 'Migrasi...' : 'Migrasi'}</span>
              </button>

              <button
                id="btn-run-scenarios-verify"
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-[11px]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Verifikasi...' : 'Verifikasi'}</span>
              </button>

              <button
                id="btn-reset-demo-database"
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center space-x-1 py-1.5 px-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 font-medium rounded-lg transition-colors text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResetting ? '...' : 'Reset'}</span>
              </button>
            </div>

            {/* Verification Checklist */}
            {verifyResults && (
              <div className="mt-2 p-2 bg-black/60 rounded-lg border border-gray-800 max-h-40 overflow-y-auto space-y-1">
                <p className="text-[10px] font-mono uppercase text-gray-400 mb-1">
                  Status Database PostgreSQL:
                </p>
                {verifyResults.map((r, i) => (
                  <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                    {r.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className={r.passed ? 'text-gray-300' : 'text-rose-300 font-bold'}>
                      {r.test}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
