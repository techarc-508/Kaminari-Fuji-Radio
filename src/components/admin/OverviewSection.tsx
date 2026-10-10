import React, { useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useRadio } from '../../context/RadioContext.tsx';
import {
  Music,
  ListMusic,
  Download,
  AlertTriangle,
  HardDrive,
  Clock,
  Play,
  ArrowRight,
  Radio,
  CheckCircle2,
  FolderSync,
} from 'lucide-react';

interface OverviewSectionProps {
  onNavigate: (tab: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigate }) => {
  const { stats, refreshStats } = useAdmin();
  const { currentTrack, currentStation, playbackStatus, playTrack } = useRadio();

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Tracks</span>
            <Music className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {stats?.totalTracks ?? 0}
          </div>
        </div>

        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Playlists</span>
            <ListMusic className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {stats?.totalPlaylists ?? 0}
          </div>
        </div>

        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Queued Imports</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {stats?.queuedImports ?? 0}
          </div>
        </div>

        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Active Downloads</span>
            <Download className="w-3.5 h-3.5 text-[#c52838]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#c52838] tabular-nums">
            {stats?.activeDownloads ?? 0}
          </div>
        </div>

        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Failed Jobs</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#b02130]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {stats?.failedDownloads ?? 0}
          </div>
        </div>

        <div className="bg-[#ece6d8] border border-[#3e3831] p-3 shadow-xs">
          <div className="flex items-center justify-between text-[#746b60] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">Storage Used</span>
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#2d2722] tabular-nums">
            {formatFileSize(stats?.storageUsedBytes)}
          </div>
        </div>
      </div>

      {/* Currently Playing Track Banner */}
      <div className="bg-[#e4dfd1]/80 border border-[#3e3831] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#3e3831] bg-[#c52838] flex items-center justify-center text-white shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-[#746b60] tracking-wider">
              Kaminari Radio Broadcast Status: <span className="font-bold text-[#c52838]">{playbackStatus.toUpperCase()}</span>
            </div>
            <h3 className="font-serif font-bold text-base text-[#2d2722]">
              {currentTrack?.title || currentStation?.name || 'Kaminari Radio Idle'}
            </h3>
            <p className="text-xs font-mono text-[#746b60]">
              {currentTrack ? `${currentTrack.artist} · ${currentTrack.genre}` : currentStation?.subtitle || 'Select preset to play'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('queue')}
            className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>+ Import with yt-dlp</span>
          </button>
          <button
            onClick={() => onNavigate('storage')}
            className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono transition-colors"
          >
            Storage & Duplicates
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Recently Imported Tracks & Recently Edited Tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recently Imported Tracks */}
        <div className="bg-[#ece6d8] border border-[#3e3831] p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
            <h3 className="font-serif font-bold text-base text-[#2d2722]">
              Recently Imported Tracks
            </h3>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-mono text-[#c52838] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {stats?.recentlyImported && stats.recentlyImported.length > 0 ? (
              stats.recentlyImported.map((track: any) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 border border-[#3e3831]/40 bg-[#e4dfd1]/50 hover:bg-[#e4dfd1] transition-colors text-xs font-mono"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="font-serif font-semibold text-[#2d2722] truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#746b60] truncate">
                      {track.artist} · {track.genre}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[#746b60] tabular-nums">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={() => playTrack(track)}
                      className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#c52838] hover:text-white transition-colors"
                      title="Play in radio"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-[#746b60] py-3 text-center">
                No imported tracks found. Use yt-dlp Importer to add audio.
              </p>
            )}
          </div>
        </div>

        {/* Recently Edited Tracks */}
        <div className="bg-[#ece6d8] border border-[#3e3831] p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
            <h3 className="font-serif font-bold text-base text-[#2d2722]">
              Recently Modified Catalog Entries
            </h3>
            <button
              onClick={() => onNavigate('metadata')}
              className="text-xs font-mono text-[#c52838] hover:underline flex items-center gap-1"
            >
              <span>Metadata Editor</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {stats?.recentlyEdited && stats.recentlyEdited.length > 0 ? (
              stats.recentlyEdited.map((track: any) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 border border-[#3e3831]/40 bg-[#e4dfd1]/50 hover:bg-[#e4dfd1] transition-colors text-xs font-mono"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="font-serif font-semibold text-[#2d2722] truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#746b60] truncate">
                      {track.artist} {track.album ? `· ${track.album}` : ''}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase text-[#746b60] border border-[#3e3831]/30 px-1 py-0.5 shrink-0">
                    {track.source === 'local' ? 'Disk' : 'Stream'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-[#746b60] py-3 text-center">
                No recently edited tracks.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
