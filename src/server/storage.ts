import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Track } from '../types/radio.ts';
import type { StorageSettings, DuplicateDetectionResult } from '../types/admin.ts';

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  folderTemplate: '{artist} - {title}',
  defaultFormat: 'mp3',
  defaultQuality: '320k',
  maxConcurrentDownloads: 2,
  autoRescanOnImport: true,
  ytDlpPath: '/usr/local/bin/yt-dlp',
  ffmpegPath: '/usr/bin/ffmpeg',
};

// Sanitize filename or path segment
export function sanitizePathComponent(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '.')
    .trim() || 'Unknown';
}

// Compute file SHA-256 checksum
export function getFileChecksum(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch {
    return null;
  }
}

// Generate destination file path based on template
export function generateFilePath(
  musicDir: string,
  template: StorageSettings['folderTemplate'],
  track: { title: string; artist: string; album?: string; genre?: string },
  ext: string
): string {
  const safeExt = ext.startsWith('.') ? ext : `.${ext}`;
  const safeArtist = sanitizePathComponent(track.artist || 'Unknown Artist');
  const safeTitle = sanitizePathComponent(track.title || 'Untitled');
  const safeAlbum = sanitizePathComponent(track.album || 'Unknown Album');
  const safeGenre = sanitizePathComponent(track.genre || 'Ambient');

  if (template === '{genre}/{artist}/{album}/{title}') {
    const dir = path.join(musicDir, safeGenre, safeArtist, safeAlbum);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${safeTitle}${safeExt}`);
  }

  // Default: {artist} - {title}
  return path.join(musicDir, `${safeArtist} - ${safeTitle}${safeExt}`);
}

// Duplicate Detection
export function findDuplicates(tracks: Track[]): DuplicateDetectionResult[] {
  const results: DuplicateDetectionResult[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      const a = tracks[i];
      const b = tracks[j];
      const pairKey = `${a.id}_${b.id}`;
      if (visited.has(pairKey)) continue;

      // 1. Exact YouTube ID match
      if (a.youtubeId && b.youtubeId && a.youtubeId === b.youtubeId) {
        results.push({
          trackA: { id: a.id, title: a.title, artist: a.artist, fileSize: a.fileSize, addedAt: a.addedAt },
          trackB: { id: b.id, title: b.title, artist: b.artist, fileSize: b.fileSize, addedAt: b.addedAt },
          reason: 'exact_source_id',
          confidence: 1.0,
        });
        visited.add(pairKey);
        continue;
      }

      // 2. Exact audio URL match
      if (a.audioUrl && b.audioUrl && a.audioUrl === b.audioUrl) {
        results.push({
          trackA: { id: a.id, title: a.title, artist: a.artist, fileSize: a.fileSize, addedAt: a.addedAt },
          trackB: { id: b.id, title: b.title, artist: b.artist, fileSize: b.fileSize, addedAt: b.addedAt },
          reason: 'canonical_url',
          confidence: 1.0,
        });
        visited.add(pairKey);
        continue;
      }

      // 3. Normalized Title & Artist match
      const normA = `${a.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${a.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const normB = `${b.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${b.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      if (normA && normB && normA === normB) {
        results.push({
          trackA: { id: a.id, title: a.title, artist: a.artist, fileSize: a.fileSize, addedAt: a.addedAt },
          trackB: { id: b.id, title: b.title, artist: b.artist, fileSize: b.fileSize, addedAt: b.addedAt },
          reason: 'title_artist_similarity',
          confidence: 0.9,
        });
        visited.add(pairKey);
      }
    }
  }

  return results;
}

// Storage space calculation
export function calculateStorageMetrics(musicDir: string, artworkDir: string): {
  musicBytes: number;
  artworkBytes: number;
  totalFiles: number;
} {
  let musicBytes = 0;
  let artworkBytes = 0;
  let totalFiles = 0;

  function walkDir(dir: string, isArtwork = false) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, isArtwork);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          totalFiles++;
          if (isArtwork) artworkBytes += stats.size;
          else musicBytes += stats.size;
        }
      }
    } catch (e) {
      console.warn('Error walking directory:', dir, e);
    }
  }

  walkDir(musicDir, false);
  walkDir(artworkDir, true);

  return { musicBytes, artworkBytes, totalFiles };
}
