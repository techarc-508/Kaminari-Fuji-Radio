export type AdminJobStatus =
  | 'pending'
  | 'inspecting'
  | 'queued'
  | 'downloading'
  | 'processing'
  | 'importing'
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'cancelled';

export type AudioFormat = 'mp3' | 'flac' | 'opus' | 'ogg' | 'm4a' | 'original';
export type AudioQuality = '128k' | '192k' | '256k' | '320k' | 'best';

export interface DownloadJob {
  id: string;
  sourceUrl: string;
  sourceType: 'video' | 'playlist' | 'direct';
  playlistTitle?: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentItemTitle?: string;
  currentItemIndex: number;
  progressPercent: number;
  downloadSpeed?: string;
  eta?: string;
  status: AdminJobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  outputFormat: AudioFormat;
  quality: AudioQuality;
  targetPlaylistId?: string;
  targetStationId?: string;
  autoAddToLibrary: boolean;
  logs: string[];
  downloadedTrackIds: string[];
  metadataOverrides?: {
    title?: string;
    genre?: string;
    artist?: string;
    album?: string;
    tags?: string[];
    license?: string;
  };
}

export interface VideoInspectEntry {
  id: string;
  title: string;
  duration?: number;
  uploader?: string;
  thumbnail?: string;
  url: string;
  selected?: boolean;
}

export interface VideoInspectResult {
  isPlaylist: boolean;
  title: string;
  uploader?: string;
  thumbnail?: string;
  itemCount: number;
  entries: VideoInspectEntry[];
}

export interface StorageSettings {
  folderTemplate: '{artist} - {title}' | '{genre}/{artist}/{album}/{title}';
  defaultFormat: AudioFormat;
  defaultQuality: AudioQuality;
  maxConcurrentDownloads: number;
  autoRescanOnImport: boolean;
  ytDlpPath: string;
  ffmpegPath: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface DuplicateDetectionResult {
  trackA: { id: string; title: string; artist: string; fileSize?: number; addedAt: string };
  trackB: { id: string; title: string; artist: string; fileSize?: number; addedAt: string };
  reason: 'exact_source_id' | 'canonical_url' | 'checksum_match' | 'title_artist_similarity';
  confidence: number;
}
