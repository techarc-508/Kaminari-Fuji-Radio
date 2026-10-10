import React, { useState, useEffect } from 'react';
import { RadioProvider, useRadio } from './context/RadioContext.tsx';
import { RadioReceiver } from './components/RadioReceiver.tsx';
import { CompactPlayerBar } from './components/CompactPlayerBar.tsx';
import { MusicLibrary } from './components/MusicLibrary.tsx';
import { PlaylistsManager } from './components/PlaylistsManager.tsx';
import { PlaybackQueue } from './components/PlaybackQueue.tsx';
import { ImportTrackForm } from './components/ImportTrackForm.tsx';
import { StatsAndSettings } from './components/StatsAndSettings.tsx';
import { AddStreamModal } from './components/AddStreamModal.tsx';
import {
  Radio,
  Library,
  ListMusic,
  ListPlus,
  UploadCloud,
  Sliders,
  Sparkles,
  Volume2,
  Minimize2,
  Maximize2,
  ChevronUp,
} from 'lucide-react';

import { AdminProvider } from './context/AdminContext.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { Shield, Keyboard as KeyboardIcon } from 'lucide-react';
import { KeyboardShortcutsModal, ShortcutsFooterBar } from './components/KeyboardShortcutsModal.tsx';

function MainApp() {
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    queue,
    volume,
    setVolume,
    currentTime,
    duration,
    seekTo,
    toggleSpectrum,
    stations,
    selectStation,
    toggleShuffle,
    cycleRepeatMode,
  } = useRadio();

  const [viewMode, setViewMode] = useState<'radio' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'radio';
  });
  const [activeTab, setActiveTab] = useState<'receiver' | 'library' | 'playlists' | 'queue' | 'import' | 'settings'>('receiver');
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(false);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Tab selection with auto-collapse for sections like Music Library
  const handleSelectTab = (tab: 'receiver' | 'library' | 'playlists' | 'queue' | 'import' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'receiver') {
      setIsPlayerCollapsed(false);
    } else {
      // When user clicks on any section like Music library, collapse the whole player
      setIsPlayerCollapsed(true);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
      } else if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        prevTrack();
      } else if (e.altKey && e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.altKey && e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 10));
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        seekTo(Math.min(duration || 99999, currentTime + 10));
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        toggleSpectrum();
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleShuffle();
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        cycleRepeatMode();
      } else if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.code === 'Escape') {
        setShowShortcutsModal(false);
        setShowAddStreamModal(false);
      } else if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const stationIdx = parseInt(e.key, 10) - 1;
        if (stations && stations[stationIdx]) {
          e.preventDefault();
          selectStation(stations[stationIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    toggleMute,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    currentTime,
    duration,
    seekTo,
    toggleSpectrum,
    stations,
    selectStation,
    toggleShuffle,
    cycleRepeatMode,
  ]);

  if (viewMode === 'admin') {
    return <AdminDashboard onBackToRadio={() => setViewMode('radio')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ece6d8] text-[#2d2722] selection:bg-[#c52838] selection:text-white">
      {/* 3-Zone Top Bar following Frontend Design Constitution */}
      <header className="border-b border-[#3e3831] bg-[#ece6d8] px-4 md:px-8 py-3.5 flex items-center justify-between gap-8 sticky top-0 z-40 shadow-xs">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-6 h-6 bg-[#c52838] flex items-center justify-center text-white">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="font-serif font-bold text-lg md:text-xl tracking-tight text-[#2d2722]">
            Radio Receiver
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
          <button
            onClick={() => handleSelectTab('receiver')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'receiver' && !isPlayerCollapsed ? 'text-[#c52838] font-bold border-b border-[#c52838] pb-0.5' : 'text-[#746b60] hover:text-[#2d2722]'
            }`}
          >
            Receiver
          </button>
          <button
            onClick={() => handleSelectTab('library')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'library' ? 'text-[#c52838] font-bold border-b border-[#c52838] pb-0.5' : 'text-[#746b60] hover:text-[#2d2722]'
            }`}
          >
            Music Library
          </button>
          <button
            onClick={() => handleSelectTab('playlists')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'playlists' ? 'text-[#c52838] font-bold border-b border-[#c52838] pb-0.5' : 'text-[#746b60] hover:text-[#2d2722]'
            }`}
          >
            Stations & Playlists
          </button>
          <button
            onClick={() => handleSelectTab('queue')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'queue' ? 'text-[#c52838] font-bold border-b border-[#c52838] pb-0.5' : 'text-[#746b60] hover:text-[#2d2722]'
            }`}
          >
            Queue ({queue.length})
          </button>
          <button
            onClick={() => handleSelectTab('settings')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'settings' ? 'text-[#c52838] font-bold border-b border-[#c52838] pb-0.5' : 'text-[#746b60] hover:text-[#2d2722]'
            }`}
          >
            Metrics & Setup
          </button>
        </nav>

        {/* Zone 3: Primary Action & Admin Portal Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts Cheat Sheet (?)"
            className="px-2.5 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <KeyboardIcon className="w-3.5 h-3.5 text-[#2d2722]" />
            <span className="hidden sm:inline">Keys</span>
            <kbd className="hidden md:inline px-1 border border-[#3e3831] bg-[#ece6d8] text-[10px]">?</kbd>
          </button>

          <button
            onClick={() => setViewMode('admin')}
            title="Administrator Ingestion & Dashboard"
            className="px-2.5 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-[#c52838]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            onClick={() => handleSelectTab('import')}
            className="px-3.5 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium whitespace-nowrap shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Import Audio</span>
            <span className="sm:hidden">+ Import</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-5">
        {/* Top Player Console: Full RadioReceiver or Collapsed Sleek Bar (as in image.png) */}
        {!isPlayerCollapsed ? (
          <section aria-label="Main Radio Receiver" className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#746b60] px-1">
              <span className="font-bold text-[#c52838] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Master Receiver Console
              </span>
              <button
                onClick={() => setIsPlayerCollapsed(true)}
                className="px-2.5 py-1 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] hover:text-[#c52838] transition-colors flex items-center gap-1.5 text-xs font-mono shadow-xs"
                title="Collapse player into sleek compact bar"
              >
                <Minimize2 className="w-3.5 h-3.5 text-[#c52838]" />
                <span>Collapse Player</span>
              </button>
            </div>
            <RadioReceiver onOpenAddStream={() => setShowAddStreamModal(true)} />
          </section>
        ) : (
          <section aria-label="Collapsed Radio Bar" className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#746b60] px-1">
              <span className="text-[11px] font-mono text-[#746b60] uppercase tracking-wider">
                ● Radio Stream Active
              </span>
              <button
                onClick={() => setIsPlayerCollapsed(false)}
                className="px-2.5 py-1 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] hover:text-[#c52838] transition-colors flex items-center gap-1.5 text-xs font-mono shadow-xs"
                title="Expand full master radio receiver panel"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#c52838]" />
                <span>Expand Full Player</span>
              </button>
            </div>
            {/* Sleek Collapsed Player Bar matching user's screenshot image.png */}
            <CompactPlayerBar onExpand={() => setIsPlayerCollapsed(false)} isCollapsed={true} />
          </section>
        )}

        {/* Media Services Section Header & Active Section Items Directly Below */}
        <section aria-label="Media Services">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-2 mb-4 gap-2">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2d2722]">
              Media services
            </h2>

            {/* Sub-navigation tabs matching screenshot context */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => handleSelectTab('receiver')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'receiver' && !isPlayerCollapsed
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleSelectTab('library')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'library'
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Music Library
              </button>
              <button
                onClick={() => handleSelectTab('playlists')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'playlists'
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Stations & Playlists
              </button>
              <button
                onClick={() => handleSelectTab('queue')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'queue'
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Queue ({queue.length})
              </button>
              <button
                onClick={() => handleSelectTab('import')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'import'
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Import / Upload
              </button>
              <button
                onClick={() => handleSelectTab('settings')}
                className={`px-3 py-1 text-xs font-mono border border-[#3e3831] whitespace-nowrap transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-[#c52838] text-white font-medium'
                    : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
                }`}
              >
                Analytics & Setup
              </button>
            </div>
          </div>

          {/* Active Tab View / Section's Actual Items Directly Below */}
          <div>
            {activeTab === 'receiver' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#ece6d8] border border-[#3e3831] p-4 shadow-[2px_2px_0px_#3e3831]">
                  <h3 className="font-serif font-bold text-base text-[#2d2722] mb-1">
                    Continuous Ambient Playback
                  </h3>
                  <p className="text-xs font-mono text-[#746b60] mb-3">
                    Broadcasting non-stop royalty-free instrumental soundscapes, lofi study beats, and atmospheric drone signals. Tracks advance automatically with zero gaps.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectTab('library')}
                      className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-xs font-mono text-[#2d2722]"
                    >
                      Browse Music Catalog →
                    </button>
                    <button
                      onClick={() => setViewMode('admin')}
                      className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono"
                    >
                      yt-dlp Ingestion & Admin Portal →
                    </button>
                  </div>
                </div>

                <div className="bg-[#ece6d8] border border-[#3e3831] p-4 shadow-[2px_2px_0px_#3e3831]">
                  <h3 className="font-serif font-bold text-base text-[#2d2722] mb-1">
                    Self-Hosted Deployment Status
                  </h3>
                  <p className="text-xs font-mono text-[#746b60] mb-3">
                    Mounted volumes: <code className="text-[#2d2722]">/data/music/</code> (Lossless & MP3s), <code className="text-[#2d2722]">/data/artwork/</code>, SQLite & JSON catalog persistence.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectTab('settings')}
                      className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-xs font-mono text-[#2d2722]"
                    >
                      View Server Telemetry →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <MusicLibrary onOpenImport={() => handleSelectTab('import')} />
            )}

            {activeTab === 'playlists' && (
              <PlaylistsManager onOpenAddStream={() => setShowAddStreamModal(true)} />
            )}

            {activeTab === 'queue' && (
              <PlaybackQueue />
            )}

            {activeTab === 'import' && (
              <ImportTrackForm onSuccess={() => handleSelectTab('library')} />
            )}

            {activeTab === 'settings' && (
              <StatsAndSettings />
            )}
          </div>
        </section>
      </main>

      {/* Persistent Keyboard Shortcuts Footer Bar for Power Users */}
      <ShortcutsFooterBar onOpenModal={() => setShowShortcutsModal(true)} />

      {/* Footer */}
      <footer className="border-t border-[#3e3831] bg-[#e4dfd1]/80 px-4 py-3 mt-auto text-xs font-mono text-[#746b60] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Self-Hosted Ambient Radio Receiver</span>
          <span>·</span>
          <span>Continuous Instrumental & Lofi Broadcast</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="hover:text-[#c52838] underline flex items-center gap-1"
          >
            <span>All Shortcuts</span>
            <kbd className="px-1 border border-[#3e3831] bg-[#ece6d8] text-[10px]">?</kbd>
          </button>
          <span>·</span>
          <button
            onClick={() => setViewMode('admin')}
            className="hover:text-[#c52838] underline"
          >
            Admin Ingestion Portal
          </button>
        </div>
      </footer>

      {/* Modal for all keyboard shortcuts */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Modal for adding radio streams */}
      <AddStreamModal
        isOpen={showAddStreamModal}
        onClose={() => setShowAddStreamModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <RadioProvider>
        <MainApp />
      </RadioProvider>
    </AdminProvider>
  );
}
