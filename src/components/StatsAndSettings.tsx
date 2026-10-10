import React, { useState, useEffect, useMemo } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import type { ListeningHistoryEntry, ServerStats } from '../types/radio.ts';
import {
  Clock,
  HardDrive,
  BarChart3,
  Sliders,
  Radio,
  History,
  Key,
  Check,
  PieChart as PieIcon,
  Disc,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const GENRE_COLORS = [
  '#c52838', // Vintage Crimson
  '#3e3831', // Deep Charcoal
  '#746b60', // Vintage Slate
  '#a33b20', // Rust
  '#d97736', // Burnt Amber
  '#557b42', // Forest Moss
  '#8c7b64', // Sandstone
  '#b08968', // Sepia Oak
  '#4a5568', // Steel
  '#9f5f80', // Dusty Plum
];

export const StatsAndSettings: React.FC = () => {
  const {
    crossfade,
    setCrossfade,
    sleepTimerRemaining,
    setSleepTimer,
    stats,
    volume,
    repeatMode,
    shuffle,
    tracks,
  } = useRadio();

  const [history, setHistory] = useState<ListeningHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      })
      .catch(console.error);
  }, []);

  // Compute Genre distribution for Recharts visualization
  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    tracks.forEach((t) => {
      const g = (t.genre && t.genre.trim()) || 'Ambient / Lofi';
      counts[g] = (counts[g] || 0) + 1;
    });

    const total = tracks.length || 1;
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: Number(((value / total) * 100).toFixed(1)),
        color: GENRE_COLORS[index % GENRE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [tracks]);

  // Custom vintage tooltip for Recharts
  const renderGenreTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#ece6d8] border border-[#3e3831] px-3 py-2 text-xs font-mono shadow-[2px_2px_0px_#3e3831]">
          <p className="font-bold text-[#2d2722] flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 inline-block border border-[#3e3831]"
              style={{ backgroundColor: data.color }}
            />
            {data.name}
          </p>
          <p className="text-[#c52838] font-bold mt-0.5">
            {data.value} {data.value === 1 ? 'track' : 'tracks'} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
      <div className="flex items-center justify-between border-b border-[#3e3831] pb-3 mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Receiver Metrics & Preferences
          </h2>
          <p className="text-xs font-mono text-[#746b60] mt-0.5">
            Listening analytics, crossfade parameters, and storage paths
          </p>
        </div>

        <div className="flex items-center gap-1 border border-[#3e3831] bg-[#e4dfd1] p-0.5">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1 text-xs font-mono transition-colors ${
              activeTab === 'stats' ? 'bg-[#c52838] text-white font-medium' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            Analytics & History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 text-xs font-mono transition-colors ${
              activeTab === 'settings' ? 'bg-[#c52838] text-white font-medium' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            Audio Engine Settings
          </button>
        </div>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
              <span className="text-[10px] font-mono uppercase text-[#746b60] block">
                Total Listening
              </span>
              <span className="text-xl font-serif font-bold text-[#2d2722] tabular-nums">
                {stats?.totalListeningMinutes || 0}m
              </span>
            </div>

            <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
              <span className="text-[10px] font-mono uppercase text-[#746b60] block">
                Track Plays
              </span>
              <span className="text-xl font-serif font-bold text-[#2d2722] tabular-nums">
                {stats?.totalPlays || 0}
              </span>
            </div>

            <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
              <span className="text-[10px] font-mono uppercase text-[#746b60] block">
                Cataloged Tracks
              </span>
              <span className="text-xl font-serif font-bold text-[#2d2722] tabular-nums">
                {stats?.totalTracks || 0}
              </span>
            </div>

            <div className="p-3 border border-[#3e3831] bg-[#e4dfd1]/60">
              <span className="text-[10px] font-mono uppercase text-[#746b60] block">
                Disk Usage
              </span>
              <span className="text-xl font-serif font-bold text-[#2d2722] tabular-nums">
                {formatFileSize(stats?.storageUsedBytes)}
              </span>
            </div>
          </div>

          {/* Genre Distribution Visualization using Recharts */}
          <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <h3 className="text-sm font-serif font-bold text-[#2d2722] flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-[#c52838]" />
                <span>Music Library Genre Distribution</span>
              </h3>
              <span className="text-[11px] font-mono text-[#746b60]">
                {genreData.length} unique {genreData.length === 1 ? 'genre' : 'genres'} · {tracks.length} tracks
              </span>
            </div>

            {genreData.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[#746b60]">
                No tracks or genres in the music library yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Recharts Interactive Pie Chart */}
                <div className="md:col-span-6 h-64 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="#ece6d8"
                        strokeWidth={2}
                        isAnimationActive={true}
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={renderGenreTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat in Donut Hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-serif font-bold text-[#2d2722] leading-none">
                      {tracks.length}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#746b60] tracking-wider mt-0.5">
                      Tracks
                    </span>
                  </div>
                </div>

                {/* Genre Breakdown Table & Legend */}
                <div className="md:col-span-6 border border-[#3e3831] bg-[#ece6d8] p-3 max-h-64 overflow-y-auto">
                  <div className="text-[11px] font-mono font-bold text-[#746b60] uppercase tracking-wider pb-1.5 mb-2 border-b border-[#3e3831]/20 flex justify-between">
                    <span>Genre</span>
                    <span>Count / Share</span>
                  </div>
                  <div className="space-y-2">
                    {genreData.map((entry, idx) => (
                      <div key={idx} className="text-xs font-mono">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="flex items-center gap-1.5 text-[#2d2722] font-medium truncate max-w-[160px]">
                            <span
                              className="w-2.5 h-2.5 inline-block shrink-0 border border-[#3e3831]"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="truncate">{entry.name}</span>
                          </span>
                          <span className="tabular-nums text-[#3e3831] font-semibold text-[11px] shrink-0">
                            {entry.value} ({entry.percentage}%)
                          </span>
                        </div>
                        {/* Progress meter */}
                        <div className="h-1.5 w-full bg-[#e4dfd1] border border-[#3e3831]/20 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${entry.percentage}%`,
                              backgroundColor: entry.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Played Tracks */}
          <div>
            <h3 className="text-sm font-serif font-bold text-[#2d2722] mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#c52838]" />
              <span>Most Streamed Radio Tracks</span>
            </h3>
            <div className="border border-[#3e3831] bg-[#e4dfd1]/40 overflow-hidden">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[#e4dfd1] border-b border-[#3e3831] text-[#746b60] text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Artist</th>
                    <th className="py-2 px-3 text-right">Times Played</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3e3831]/20">
                  {stats?.topTracks && stats.topTracks.length > 0 ? (
                    stats.topTracks.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#e4dfd1]">
                        <td className="py-2 px-3 font-semibold text-[#2d2722]">{item.title}</td>
                        <td className="py-2 px-3 text-[#746b60]">{item.artist}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#c52838] font-bold">
                          {item.playCount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-[#746b60]">
                        No tracks played yet in this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-serif font-bold text-[#2d2722] mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#c52838]" />
                <span>Recent Listening History</span>
              </h3>
              <div className="border border-[#3e3831] bg-[#e4dfd1]/40 max-h-48 overflow-y-auto">
                <div className="divide-y divide-[#3e3831]/20 text-xs font-mono">
                  {history.slice(0, 8).map((h) => (
                    <div key={h.id} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#2d2722]">{h.trackTitle}</span>
                        <span className="text-[#746b60] ml-2">— {h.artist}</span>
                      </div>
                      <span className="text-[11px] text-[#746b60]">
                        {new Date(h.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Settings tab */
        <div className="space-y-5 text-xs font-mono">
          {/* Crossfade setting */}
          <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[#2d2722] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#c52838]" />
                <span>Audio Crossfade Duration</span>
              </label>
              <span className="font-bold text-[#c52838] tabular-nums">{crossfade} seconds</span>
            </div>
            <p className="text-[11px] text-[#746b60] mb-3">
              Applies a smooth transition fade between sequential audio tracks.
            </p>
            <input
              type="range"
              min="0"
              max="10"
              value={crossfade}
              onChange={(e) => setCrossfade(Number(e.target.value))}
              className="retro-slider w-full"
            />
            <div className="flex justify-between text-[10px] text-[#746b60] mt-1">
              <span>0s (Gapless)</span>
              <span>5s</span>
              <span>10s (Long ambient blend)</span>
            </div>
          </div>

          {/* Sleep Timer setting */}
          <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[#2d2722] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c52838]" />
                <span>Sleep Timer Preset</span>
              </label>
              <span className="text-[#c52838] font-bold">
                {sleepTimerRemaining ? `${Math.ceil(sleepTimerRemaining / 60)}m active` : 'Off'}
              </span>
            </div>
            <p className="text-[11px] text-[#746b60] mb-3">
              Automatically pauses playback and puts the receiver into quiet standby mode.
            </p>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSleepTimer(mins)}
                  className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]"
                >
                  {mins} min
                </button>
              ))}
              <button
                onClick={() => setSleepTimer(null)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#fae2e4] text-[#c52838]"
              >
                Disable Timer
              </button>
            </div>
          </div>

          {/* Storage Paths Information */}
          <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
            <h4 className="font-semibold text-[#2d2722] mb-2 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#c52838]" />
              <span>Self-Hosted Storage Mount Points</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-[#544d44]">
              <div className="flex justify-between border-b border-[#3e3831]/20 pb-1">
                <span>Music Volume:</span>
                <span className="font-semibold text-[#2d2722]">/data/music/</span>
              </div>
              <div className="flex justify-between border-b border-[#3e3831]/20 pb-1">
                <span>Artwork Storage:</span>
                <span className="font-semibold text-[#2d2722]">/data/artwork/</span>
              </div>
              <div className="flex justify-between border-b border-[#3e3831]/20 pb-1">
                <span>Database File:</span>
                <span className="font-semibold text-[#2d2722]">/data/db.json</span>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
            <h4 className="font-semibold text-[#2d2722] mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#c52838]" />
              <span>Keyboard Control Affordances</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#544d44]">
              <div><kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722]">Space</kbd> Play / Pause</div>
              <div><kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722]">M</kbd> Mute / Unmute</div>
              <div><kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722]">MediaNext</kbd> Next Track</div>
              <div><kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722]">MediaPrev</kbd> Prev Track</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
