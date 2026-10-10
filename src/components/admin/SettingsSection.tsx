import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import type { AuditLogEntry } from '../../types/admin.ts';
import {
  Key,
  Shield,
  Sliders,
  Check,
  AlertCircle,
  FileText,
  Lock,
  Cpu,
} from 'lucide-react';

export const SettingsSection: React.FC = () => {
  const { token, storageData, updateStorageSettings } = useAdmin();

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ingestion settings
  const [maxConcurrency, setMaxConcurrency] = useState(2);
  const [defaultFormat, setDefaultFormat] = useState('mp3');
  const [defaultQuality, setDefaultQuality] = useState('320k');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Audit logs state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (token) {
      fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setLogs(data || []))
        .catch(console.error);
    }
  }, [token]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Admin password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Password update failed' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Connection failed' });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStorageSettings({
      maxConcurrentDownloads: maxConcurrency,
      defaultFormat: defaultFormat as any,
      defaultQuality: defaultQuality as any,
    });
    setSettingsMsg('Preferences saved successfully.');
    setTimeout(() => setSettingsMsg(null), 3000);
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-6">
      <div className="border-b border-[#3e3831] pb-3">
        <h2 className="text-xl font-serif font-bold text-[#2d2722]">
          Administration & Ingestion Pipeline Settings
        </h2>
        <p className="text-xs font-mono text-[#746b60]">
          Security credentials, download concurrency limits, and security audit log
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Security & Password Change */}
        <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#c52838]" />
            <span>Change Administrator Password</span>
          </h3>

          {pwMsg && (
            <div
              className={`p-2 border text-xs flex items-center gap-1.5 ${
                pwMsg.type === 'success'
                  ? 'bg-[#e0edd8] border-[#557b42] text-[#2d4b1f]'
                  : 'bg-[#fae2e4] border-[#c52838] text-[#931523]'
              }`}
            >
              {pwMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{pwMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-2.5">
            <div>
              <label className="block text-[#544d44] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
            <div>
              <label className="block text-[#544d44] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
            <div>
              <label className="block text-[#544d44] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] font-bold"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Engine Concurrency & Defaults */}
        <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#c52838]" />
            <span>Worker Concurrency & Format Defaults</span>
          </h3>

          {settingsMsg && (
            <div className="p-2 bg-[#e0edd8] border border-[#557b42] text-xs text-[#2d4b1f] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-[#544d44] mb-1">Max Concurrent Subprocess Downloads</label>
              <select
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              >
                <option value={1}>1 (Conservative, mini PCs)</option>
                <option value={2}>2 (Recommended default)</option>
                <option value={4}>4 (High-speed server)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#544d44] mb-1">Default Output Audio Codec</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              >
                <option value="mp3">MP3</option>
                <option value="flac">FLAC</option>
                <option value="opus">Opus</option>
                <option value="ogg">OGG</option>
              </select>
            </div>

            <div>
              <label className="block text-[#544d44] mb-1">Default Bitrate Preset</label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              >
                <option value="320k">320k (CBR High)</option>
                <option value="256k">256k</option>
                <option value="192k">192k</option>
                <option value="best">VBR Best</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] font-bold"
              >
                Save Engine Defaults
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/40 p-4 font-mono text-xs space-y-3">
        <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c52838]" />
          <span>Administrative Action Audit Log ({logs.length})</span>
        </h3>
        <p className="text-[11px] text-[#544d44]">
          Records all administrative logins, download executions, deletions, and configuration changes.
        </p>

        <div className="border border-[#3e3831] bg-[#ece6d8] max-h-56 overflow-y-auto divide-y divide-[#3e3831]/20">
          {logs.map((log) => (
            <div key={log.id} className="p-2 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-bold text-[#c52838]">{log.action}</span>
                <span className="text-[#2d2722] ml-2">{log.details}</span>
              </div>
              <span className="text-[#746b60] shrink-0 ml-2">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
