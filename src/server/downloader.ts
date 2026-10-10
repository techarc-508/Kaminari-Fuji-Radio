import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import type { DownloadJob, VideoInspectResult, VideoInspectEntry, AudioFormat, AudioQuality } from '../types/admin.ts';
import type { Track } from '../types/radio.ts';
import { generateFilePath, getFileChecksum } from './storage.ts';

export const jobEvents = new EventEmitter();

// In-memory active and past jobs
let jobs: DownloadJob[] = [];
const activeProcesses = new Map<string, ChildProcess>();

// Find yt-dlp binary
export function getYtDlpPath(): string {
  if (fs.existsSync('/usr/local/bin/yt-dlp')) return '/usr/local/bin/yt-dlp';
  if (fs.existsSync('/tmp/yt-dlp')) return '/tmp/yt-dlp';
  return 'yt-dlp';
}

// Find ffmpeg binary
export function getFfmpegPath(): string {
  if (fs.existsSync('/usr/bin/ffmpeg')) return '/usr/bin/ffmpeg';
  return 'ffmpeg';
}

// SSRF & URL Validation
export function validateMediaUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are permitted' };
    }

    const hostname = parsed.hostname.toLowerCase();
    // Block internal IP ranges and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return { valid: false, error: 'Target URL resolved to an unsafe internal network address' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Inspect YouTube Video or Playlist Metadata
export async function inspectUrl(url: string): Promise<VideoInspectResult> {
  const validation = validateMediaUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL');
  }

  const ytdlp = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-single-json',
      '--flat-playlist',
      '--skip-download',
      '--no-warnings',
      url,
    ];

    const child = spawn(ytdlp, args, { shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Inspection failed with exit code ${code}`));
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const isPlaylist = Array.isArray(data.entries) && data.entries.length > 0;

        if (isPlaylist) {
          const entries: VideoInspectEntry[] = data.entries.map((entry: any, index: number) => ({
            id: entry.id || `entry-${index}`,
            title: entry.title || `Track ${index + 1}`,
            duration: entry.duration || 0,
            uploader: entry.uploader || entry.channel || data.uploader || 'YouTube Artist',
            thumbnail: entry.thumbnails?.[0]?.url || data.thumbnail || '',
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            selected: true,
          }));

          resolve({
            isPlaylist: true,
            title: data.title || 'YouTube Playlist',
            uploader: data.uploader || data.channel || 'Various Artists',
            thumbnail: data.thumbnails?.[0]?.url || (entries[0] && entries[0].thumbnail) || '',
            itemCount: entries.length,
            entries,
          });
        } else {
          // Single video
          resolve({
            isPlaylist: false,
            title: data.title || 'YouTube Video',
            uploader: data.uploader || data.channel || 'YouTube Artist',
            thumbnail: data.thumbnail || '',
            itemCount: 1,
            entries: [
              {
                id: data.id || 'single',
                title: data.title || 'YouTube Video',
                duration: data.duration || 0,
                uploader: data.uploader || data.channel || 'YouTube Artist',
                thumbnail: data.thumbnail || '',
                url: data.webpage_url || url,
                selected: true,
              },
            ],
          });
        }
      } catch (err: any) {
        reject(new Error(`Failed to parse metadata JSON: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to execute yt-dlp binary: ${err.message}`));
    });
  });
}

// Create Download Job
export function createDownloadJob(params: {
  url: string;
  sourceType: 'video' | 'playlist' | 'direct';
  playlistTitle?: string;
  totalItems: number;
  outputFormat: AudioFormat;
  quality: AudioQuality;
  targetPlaylistId?: string;
  targetStationId?: string;
  autoAddToLibrary: boolean;
  metadataOverrides?: DownloadJob['metadataOverrides'];
  selectedUrls?: string[];
}): DownloadJob {
  const newJob: DownloadJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sourceUrl: params.url,
    sourceType: params.sourceType,
    playlistTitle: params.playlistTitle,
    totalItems: params.totalItems,
    completedItems: 0,
    failedItems: 0,
    currentItemIndex: 0,
    progressPercent: 0,
    status: 'queued',
    createdAt: new Date().toISOString(),
    outputFormat: params.outputFormat || 'mp3',
    quality: params.quality || '320k',
    targetPlaylistId: params.targetPlaylistId,
    targetStationId: params.targetStationId,
    autoAddToLibrary: params.autoAddToLibrary ?? true,
    logs: [`Job queued with ${params.totalItems} items (${params.outputFormat}, ${params.quality})`],
    downloadedTrackIds: [],
    metadataOverrides: params.metadataOverrides,
  };

  jobs.unshift(newJob);
  broadcastJobUpdate(newJob);
  return newJob;
}

export function getAllJobs(): DownloadJob[] {
  return jobs;
}

export function getJobById(id: string): DownloadJob | undefined {
  return jobs.find((j) => j.id === id);
}

export function broadcastJobUpdate(job: DownloadJob) {
  jobEvents.emit('job-updated', job);
}

// Cancel a running job
export function cancelJob(jobId: string): boolean {
  const job = getJobById(jobId);
  if (!job) return false;

  const child = activeProcesses.get(jobId);
  if (child) {
    child.kill('SIGTERM');
    activeProcesses.delete(jobId);
  }

  job.status = 'cancelled';
  job.errorMessage = 'Cancelled by administrator';
  job.logs.push('Job was cancelled by administrator');
  job.completedAt = new Date().toISOString();
  broadcastJobUpdate(job);
  return true;
}

// Background Worker Processor
export async function runJob(
  job: DownloadJob,
  paths: { musicDir: string; tempDir: string; artworkDir: string },
  callbacks: {
    onTrackCreated: (track: Track) => void;
    onAddToPlaylist?: (playlistId: string, trackId: string) => void;
  }
) {
  job.status = 'downloading';
  job.startedAt = new Date().toISOString();
  broadcastJobUpdate(job);

  const ytdlp = getYtDlpPath();
  const format = job.outputFormat === 'original' ? 'bestaudio' : job.outputFormat;
  const quality = job.quality === 'best' ? '0' : job.quality.replace('k', '');

  // Temp working directory for this job
  const jobTempDir = path.join(paths.tempDir, job.id);
  if (!fs.existsSync(jobTempDir)) fs.mkdirSync(jobTempDir, { recursive: true });

  const outputTemplate = path.join(jobTempDir, '%(title)s.%(ext)s');

  const args = [
    '--extract-audio',
    '--audio-format', format === 'bestaudio' ? 'mp3' : format,
    '--audio-quality', quality,
    '--embed-thumbnail',
    '--add-metadata',
    '--no-playlist', // download individually or handle
    '-o', outputTemplate,
    '--newline',
    job.sourceUrl,
  ];

  if (job.sourceType === 'playlist') {
    // Enable playlist extraction
    args.splice(args.indexOf('--no-playlist'), 1);
  }

  job.logs.push(`Starting yt-dlp extraction with format=${format}, quality=${quality}...`);
  broadcastJobUpdate(job);

  return new Promise<void>((resolve) => {
    const child = spawn(ytdlp, args, { shell: false });
    activeProcesses.set(job.id, child);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        // Progress regex: [download]  45.0% of 4.20MiB at 2.4MiB/s ETA 00:03
        const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i);
        if (progressMatch) {
          job.progressPercent = Math.min(100, parseFloat(progressMatch[1]));
          job.downloadSpeed = progressMatch[3];
          job.eta = progressMatch[4];
          broadcastJobUpdate(job);
        }

        // Destination file regex: [ExtractAudio] Destination: ...
        const destMatch = line.match(/(?:Destination:|has already been downloaded):\s*(.+)$/i);
        if (destMatch) {
          job.currentItemTitle = path.basename(destMatch[1].trim());
          job.logs.push(`Processing: ${job.currentItemTitle}`);
          broadcastJobUpdate(job);
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      const err = chunk.toString().trim();
      if (err) {
        job.logs.push(`[stderr] ${err}`);
        broadcastJobUpdate(job);
      }
    });

    child.on('close', (code) => {
      activeProcesses.delete(job.id);

      if (code !== 0 && job.status !== 'cancelled') {
        job.status = 'failed';
        job.errorMessage = `yt-dlp process completed with exit code ${code}`;
        job.logs.push(`Error: Job terminated with exit code ${code}`);
        job.completedAt = new Date().toISOString();
        broadcastJobUpdate(job);
        resolve();
        return;
      }

      if (job.status === 'cancelled') {
        resolve();
        return;
      }

      job.status = 'processing';
      job.logs.push('Moving downloaded media to persistent music library...');
      broadcastJobUpdate(job);

      // Process downloaded files in jobTempDir
      try {
        const files = fs.readdirSync(jobTempDir);
        let importedCount = 0;

        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (['.mp3', '.flac', '.opus', '.ogg', '.m4a', '.wav'].includes(ext)) {
            const rawTitle = path.parse(file).name;
            const srcPath = path.join(jobTempDir, file);
            const stats = fs.statSync(srcPath);

            // Metadata override or parsed title
            const trackTitle = job.metadataOverrides?.title || rawTitle.replace(/[-_]/g, ' ');
            const trackArtist = job.metadataOverrides?.artist || 'YouTube Creator';
            const trackGenre = job.metadataOverrides?.genre || 'Ambient / Instrumental';

            // Destination path
            const destFileName = `${Date.now()}-${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destPath = path.join(paths.musicDir, destFileName);

            fs.copyFileSync(srcPath, destPath);

            const newTrack: Track = {
              id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: trackTitle,
              artist: trackArtist,
              album: job.metadataOverrides?.album || job.playlistTitle || 'yt-dlp Audio Ingestion',
              duration: 180, // Default duration if not extracted
              source: 'local',
              audioUrl: `/api/audio/${destFileName}`,
              genre: trackGenre,
              tags: job.metadataOverrides?.tags || ['yt-dlp', 'imported', 'ambient'],
              fileSize: stats.size,
              storagePath: destPath,
              isDownloaded: true,
              license: job.metadataOverrides?.license || 'Authorized Download / Personal Archive',
              playCount: 0,
              addedAt: new Date().toISOString(),
            };

            callbacks.onTrackCreated(newTrack);
            job.downloadedTrackIds.push(newTrack.id);

            if (job.targetPlaylistId && callbacks.onAddToPlaylist) {
              callbacks.onAddToPlaylist(job.targetPlaylistId, newTrack.id);
            }

            importedCount++;
            job.completedItems = importedCount;
            job.logs.push(`Imported "${newTrack.title}" (${(stats.size / (1024 * 1024)).toFixed(1)} MB)`);
          }
        }

        // Clean up temp directory
        try {
          fs.rmSync(jobTempDir, { recursive: true, force: true });
        } catch {}

        job.status = importedCount > 0 ? 'completed' : 'partially_completed';
        job.progressPercent = 100;
        job.completedAt = new Date().toISOString();
        job.logs.push(`Job completed. ${importedCount} track(s) added to persistent library.`);
        broadcastJobUpdate(job);
      } catch (err: any) {
        job.status = 'failed';
        job.errorMessage = `Error organizing files: ${err.message}`;
        job.logs.push(`Error: ${err.message}`);
        broadcastJobUpdate(job);
      }

      resolve();
    });

    child.on('error', (err) => {
      activeProcesses.delete(job.id);
      job.status = 'failed';
      job.errorMessage = `Subprocess execution error: ${err.message}`;
      job.logs.push(`Fatal execution error: ${err.message}`);
      job.completedAt = new Date().toISOString();
      broadcastJobUpdate(job);
      resolve();
    });
  });
}
