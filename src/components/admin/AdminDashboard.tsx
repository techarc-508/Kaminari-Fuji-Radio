import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useRadio } from '../../context/RadioContext.tsx';
import { OverviewSection } from './OverviewSection.tsx';
import { ImportQueueSection } from './ImportQueueSection.tsx';
import { MusicLibrarySection } from './MusicLibrarySection.tsx';
import { PlaylistsSection } from './PlaylistsSection.tsx';
import { MetadataEditorSection } from './MetadataEditorSection.tsx';
import { DownloadHistorySection } from './DownloadHistorySection.tsx';
import { StorageManagerSection } from './StorageManagerSection.tsx';
import { RadioStationsSection } from './RadioStationsSection.tsx';
import { SettingsSection } from './SettingsSection.tsx';
import { AdminLoginModal } from './AdminLoginModal.tsx';
import type { Track } from '../../types/radio.ts';
import {
  Shield,
  Download,
  Music,
  ListMusic,
  Edit3,
  History,
  HardDrive,
  Radio,
  Sliders,
  LogOut,
  Radio as RadioIcon,
  Lock,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToRadio: () => void;
}

export type AdminTab =
  | 'overview'
  | 'queue'
  | 'library'
  | 'playlists'
  | 'metadata'
  | 'history'
  | 'storage'
  | 'stations'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToRadio }) => {
  const { isAuthenticated, logout, jobs } = useAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // If not authenticated, show prominent login challenge screen matching vintage styling
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#ece6d8] flex flex-col items-center justify-center p-4">
        <div className="bg-[#e4dfd1] border-2 border-[#3e3831] p-8 max-w-md w-full shadow-[4px_4px_0px_#3e3831] text-center space-y-4">
          <div className="w-12 h-12 bg-[#c52838] flex items-center justify-center text-white mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h1 className="font-serif font-bold text-2xl text-[#2d2722]">
              Kaminari Radio Administration
            </h1>
            <p className="text-xs font-mono text-[#746b60] mt-1">
              yt-dlp Music Ingestion, Storage Pipeline & Catalog Management
            </p>
          </div>

          <div className="p-3 bg-[#ece6d8] border border-[#3e3831] text-xs font-mono text-[#544d44] text-left">
            <div className="font-bold text-[#2d2722] mb-1">Protected Area</div>
            Administrative authorization is required to access media downloads, file mutation, and server storage volumes.
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full py-2.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-bold transition-colors shadow-sm"
            >
              Enter Administrator Password
            </button>
            <button
              onClick={onBackToRadio}
              className="w-full py-2 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono transition-colors"
            >
              ← Return to Kaminari Radio
            </button>
          </div>
        </div>

        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  const activeDownloadsCount = jobs.filter(
    (j) => j.status === 'downloading' || j.status === 'processing'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#ece6d8] text-[#2d2722]">
      {/* Top Bar for Admin */}
      <header className="border-b border-[#3e3831] bg-[#ece6d8] px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRadio}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-xs font-mono text-[#2d2722] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kaminari Radio</span>
          </button>

          <div className="h-4 w-[1px] bg-[#3e3831]/40 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#c52838] text-white flex items-center justify-center font-bold text-[11px]">
              A
            </div>
            <span className="font-serif font-bold text-base md:text-lg tracking-tight text-[#2d2722]">
              Admin Dashboard & Ingestion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden sm:inline text-[#746b60]">
            Logged in as <strong className="text-[#2d2722]">admin</strong>
          </span>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-[#3e3831] bg-[#fae2e4] text-[#c52838] hover:bg-[#c52838] hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="border border-[#3e3831] bg-[#e4dfd1]/80 p-1 flex items-center gap-1 overflow-x-auto shadow-xs text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'queue'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import Queue</span>
            {activeDownloadsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#c52838] animate-ping ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music Library</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'playlists'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'metadata'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Metadata Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Download History</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'stations'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Radio Stations</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 border border-[#3e3831] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-[#c52838] text-white font-bold'
                : 'bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <OverviewSection onNavigate={(tab) => setActiveTab(tab as AdminTab)} />
          )}

          {activeTab === 'queue' && (
            <ImportQueueSection />
          )}

          {activeTab === 'library' && (
            <MusicLibrarySection
              onEditTrack={(track) => {
                setEditingTrack(track);
                setActiveTab('metadata');
              }}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsSection />
          )}

          {activeTab === 'metadata' && (
            <MetadataEditorSection
              initialTrack={editingTrack}
              onDone={() => setEditingTrack(null)}
            />
          )}

          {activeTab === 'history' && (
            <DownloadHistorySection />
          )}

          {activeTab === 'storage' && (
            <StorageManagerSection />
          )}

          {activeTab === 'stations' && (
            <RadioStationsSection />
          )}

          {activeTab === 'settings' && (
            <SettingsSection />
          )}
        </div>
      </div>
    </div>
  );
};
