export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'buffering' | 'error';

export type RepeatMode = 'off' | 'all' | 'one';

export type TrackSource = 'local' | 'stream' | 'youtube' | 'direct_url';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds (0 if live stream)
  source: TrackSource;
  audioUrl: string;
  youtubeId?: string;
  genre: string;
  tags: string[];
  fileSize?: number; // in bytes
  storagePath?: string;
  isDownloaded: boolean;
  license?: string;
  coverUrl?: string;
  bitrate?: number;
  format?: string;
  playCount: number;
  lastPlayedAt?: string;
  addedAt: string;
  stationPreset?: string;
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  subtitle: string;
  streamUrl: string;
  type: 'stream' | 'playlist';
  playlistId?: string;
  description: string;
  hasMetadata: boolean;
  nowPlaying?: {
    title: string;
    artist: string;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: string;
  genre?: string;
}

export interface UserSettings {
  volume: number; // 0 to 100
  isMuted: boolean;
  crossfade: number; // seconds (0 to 10)
  repeatMode: RepeatMode;
  shuffle: boolean;
  sleepTimerMinutes: number | null;
  activeStationId: string;
  activeTrackId: string | null;
  compactPlayer: boolean;
}

export interface ListeningHistoryEntry {
  id: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  genre: string;
  playedAt: string;
  durationSeconds: number;
}

export interface ServerStats {
  totalTracks: number;
  totalDurationSeconds: number;
  storageUsedBytes: number;
  totalPlays: number;
  totalListeningMinutes: number;
  topTracks: { title: string; artist: string; playCount: number }[];
}
