import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  verifyPassword,
  createSession,
  destroySession,
  requireAdmin,
  logAudit,
  getAuditLogs,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  updateAdminPassword,
} from './auth.ts';
import {
  inspectUrl,
  createDownloadJob,
  getAllJobs,
  getJobById,
  cancelJob,
  runJob,
  jobEvents,
} from './downloader.ts';
import {
  calculateStorageMetrics,
  findDuplicates,
  DEFAULT_STORAGE_SETTINGS,
} from './storage.ts';
import type { Track, Playlist, RadioStation } from '../types/radio.ts';

export function createAdminRouter(options: {
  getDb: () => any;
  saveDb: (db: any) => void;
  musicDir: string;
  tempDir: string;
  artworkDir: string;
}): Router {
  const router = Router();
  const { getDb, saveDb, musicDir, tempDir, artworkDir } = options;

  let storageSettings = { ...DEFAULT_STORAGE_SETTINGS };

  // 1. Auth: Login
  router.post('/login', (req: Request, res: Response) => {
    const ip = req.ip || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Too many failed login attempts. Try again in 10 minutes.' });
      return;
    }

    const { password, username } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    if (verifyPassword(password)) {
      resetRateLimit(ip);
      const token = createSession(username || 'admin');
      logAudit('LOGIN_SUCCESS', 'Administrator logged into dashboard', req);
      res.json({ token, username: username || 'admin' });
    } else {
      recordFailedAttempt(ip);
      logAudit('LOGIN_FAILED', 'Invalid password attempt', req);
      res.status(401).json({ error: 'Invalid administrator password' });
    }
  });

  // 2. Auth: Logout
  router.post('/logout', (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) destroySession(token);
    res.json({ success: true });
  });

  // 3. Auth: Verify current token
  router.get('/me', requireAdmin, (_req: Request, res: Response) => {
    res.json({ authenticated: true, username: 'admin' });
  });

  // 4. Update Password
  router.put('/password', requireAdmin, (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!verifyPassword(oldPassword)) {
      res.status(400).json({ error: 'Current password incorrect' });
      return;
    }
    if (!updateAdminPassword(newPassword)) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }
    logAudit('PASSWORD_UPDATED', 'Admin password changed', req);
    res.json({ success: true });
  });

  // 5. SSE Live Progress Stream
  router.get('/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial active jobs snapshot
    res.write(`data: ${JSON.stringify({ type: 'initial', jobs: getAllJobs() })}\n\n`);

    const updateListener = (job: any) => {
      res.write(`data: ${JSON.stringify({ type: 'job-update', job })}\n\n`);
    };

    jobEvents.on('job-updated', updateListener);

    req.on('close', () => {
      jobEvents.off('job-updated', updateListener);
    });
  });

  // 6. Overview & Stats
  router.get('/stats', requireAdmin, (_req: Request, res: Response) => {
    const db = getDb();
    const jobs = getAllJobs();
    const metrics = calculateStorageMetrics(musicDir, artworkDir);

    const queuedCount = jobs.filter((j) => j.status === 'queued' || j.status === 'pending').length;
    const activeCount = jobs.filter((j) => j.status === 'downloading' || j.status === 'processing').length;
    const failedCount = jobs.filter((j) => j.status === 'failed').length;

    res.json({
      totalTracks: db.tracks.length,
      totalPlaylists: db.playlists.length,
      totalStations: db.stations.length,
      queuedImports: queuedCount,
      activeDownloads: activeCount,
      failedDownloads: failedCount,
      storageUsedBytes: metrics.musicBytes + metrics.artworkBytes,
      recentlyImported: db.tracks.slice(0, 5),
      recentlyEdited: db.tracks.slice(0, 5),
      currentlyPlaying: db.settings?.activeTrackId
        ? db.tracks.find((t: Track) => t.id === db.settings.activeTrackId) || null
        : null,
      activeJobs: jobs.slice(0, 5),
    });
  });

  // 7. Inspect YouTube URL before downloading
  router.post('/inspect', requireAdmin, async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    try {
      const inspectData = await inspectUrl(url);
      res.json(inspectData);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Inspection failed' });
    }
  });

  // 8. List Download Jobs
  router.get('/jobs', requireAdmin, (_req: Request, res: Response) => {
    res.json(getAllJobs());
  });

  // 9. Create & Start Background Download Job
  router.post('/jobs', requireAdmin, async (req: Request, res: Response) => {
    const {
      url,
      sourceType,
      playlistTitle,
      totalItems,
      outputFormat,
      quality,
      targetPlaylistId,
      targetStationId,
      autoAddToLibrary,
      metadataOverrides,
    } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const job = createDownloadJob({
      url,
      sourceType: sourceType || 'video',
      playlistTitle,
      totalItems: totalItems || 1,
      outputFormat: outputFormat || storageSettings.defaultFormat,
      quality: quality || storageSettings.defaultQuality,
      targetPlaylistId,
      targetStationId,
      autoAddToLibrary: autoAddToLibrary ?? true,
      metadataOverrides,
    });

    logAudit('DOWNLOAD_JOB_CREATED', `Created download job for ${url} (${job.outputFormat})`, req);

    // Launch background worker process asynchronously
    runJob(
      job,
      { musicDir, tempDir, artworkDir },
      {
        onTrackCreated: (track: Track) => {
          const db = getDb();
          db.tracks.unshift(track);
          db.stats.totalTracks = db.tracks.length;
          db.stats.storageUsedBytes += track.fileSize || 0;
          saveDb(db);
        },
        onAddToPlaylist: (playlistId: string, trackId: string) => {
          const db = getDb();
          const pl = db.playlists.find((p: Playlist) => p.id === playlistId);
          if (pl && !pl.trackIds.includes(trackId)) {
            pl.trackIds.push(trackId);
            saveDb(db);
          }
        },
      }
    ).catch((err) => {
      console.error('Job worker execution error:', err);
    });

    res.status(201).json(job);
  });

  // 10. Cancel Job
  router.post('/jobs/:id/cancel', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const success = cancelJob(id);
    if (success) {
      logAudit('JOB_CANCELLED', `Cancelled download job ${id}`, req);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  });

  // 11. Retry Job
  router.post('/jobs/:id/retry', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const oldJob = getJobById(id);
    if (!oldJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const newJob = createDownloadJob({
      url: oldJob.sourceUrl,
      sourceType: oldJob.sourceType,
      playlistTitle: oldJob.playlistTitle,
      totalItems: oldJob.totalItems,
      outputFormat: oldJob.outputFormat,
      quality: oldJob.quality,
      targetPlaylistId: oldJob.targetPlaylistId,
      targetStationId: oldJob.targetStationId,
      autoAddToLibrary: oldJob.autoAddToLibrary,
      metadataOverrides: oldJob.metadataOverrides,
    });

    runJob(
      newJob,
      { musicDir, tempDir, artworkDir },
      {
        onTrackCreated: (track: Track) => {
          const db = getDb();
          db.tracks.unshift(track);
          saveDb(db);
        },
      }
    ).catch(console.error);

    res.json(newJob);
  });

  // 12. Storage Metrics & Settings
  router.get('/storage', requireAdmin, (_req: Request, res: Response) => {
    const db = getDb();
    const metrics = calculateStorageMetrics(musicDir, artworkDir);
    const duplicates = findDuplicates(db.tracks);

    // Find orphaned files (in disk but not in database)
    const diskFiles = fs.readdirSync(musicDir).filter((f) => fs.statSync(path.join(musicDir, f)).isFile());
    const dbFilePaths = new Set(db.tracks.map((t: Track) => t.storagePath ? path.basename(t.storagePath) : ''));
    const unindexedFiles = diskFiles.filter((f) => !dbFilePaths.has(f));

    // Find missing files (in DB with source='local' but missing on disk)
    const missingDbTracks = db.tracks.filter(
      (t: Track) => t.source === 'local' && t.storagePath && !fs.existsSync(t.storagePath)
    );

    res.json({
      metrics,
      settings: storageSettings,
      duplicatesCount: duplicates.length,
      unindexedCount: unindexedFiles.length,
      missingCount: missingDbTracks.length,
      unindexedFiles: unindexedFiles.slice(0, 10),
      duplicates: duplicates.slice(0, 10),
    });
  });

  router.put('/storage/settings', requireAdmin, (req: Request, res: Response) => {
    storageSettings = { ...storageSettings, ...req.body };
    logAudit('SETTINGS_UPDATED', 'Updated storage and download settings', req);
    res.json(storageSettings);
  });

  // 13. Duplicates List
  router.get('/duplicates', requireAdmin, (_req: Request, res: Response) => {
    const db = getDb();
    const duplicates = findDuplicates(db.tracks);
    res.json(duplicates);
  });

  // 14. Bulk Metadata Update
  router.put('/tracks/bulk', requireAdmin, (req: Request, res: Response) => {
    const { trackIds, updates } = req.body;
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      res.status(400).json({ error: 'trackIds array required' });
      return;
    }

    const db = getDb();
    let updatedCount = 0;

    db.tracks = db.tracks.map((track: Track) => {
      if (trackIds.includes(track.id)) {
        updatedCount++;
        return {
          ...track,
          artist: updates.artist !== undefined ? updates.artist : track.artist,
          album: updates.album !== undefined ? updates.album : track.album,
          genre: updates.genre !== undefined ? updates.genre : track.genre,
          license: updates.license !== undefined ? updates.license : track.license,
        };
      }
      return track;
    });

    saveDb(db);
    logAudit('BULK_METADATA_UPDATE', `Updated metadata for ${updatedCount} track(s)`, req);
    res.json({ success: true, updatedCount });
  });

  // 15. Bulk Delete Tracks
  router.delete('/tracks/bulk', requireAdmin, (req: Request, res: Response) => {
    const { trackIds, deletePhysicalFiles } = req.body;
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      res.status(400).json({ error: 'trackIds array required' });
      return;
    }

    const db = getDb();
    let deletedFilesCount = 0;

    if (deletePhysicalFiles) {
      for (const id of trackIds) {
        const track = db.tracks.find((t: Track) => t.id === id);
        if (track?.storagePath && fs.existsSync(track.storagePath)) {
          try {
            fs.unlinkSync(track.storagePath);
            deletedFilesCount++;
          } catch {}
        }
      }
    }

    db.tracks = db.tracks.filter((t: Track) => !trackIds.includes(t.id));
    db.playlists.forEach((pl: Playlist) => {
      pl.trackIds = pl.trackIds.filter((tId) => !trackIds.includes(tId));
    });

    saveDb(db);
    logAudit('BULK_DELETE_TRACKS', `Deleted ${trackIds.length} tracks (files removed: ${deletedFilesCount})`, req);
    res.json({ success: true, deletedTracks: trackIds.length, deletedFilesCount });
  });

  // 16. Clean Orphaned Database Records
  router.post('/storage/clean-orphans', requireAdmin, (req: Request, res: Response) => {
    const db = getDb();
    const initialCount = db.tracks.length;

    db.tracks = db.tracks.filter((t: Track) => {
      if (t.source === 'local' && t.storagePath) {
        return fs.existsSync(t.storagePath);
      }
      return true;
    });

    const removed = initialCount - db.tracks.length;
    saveDb(db);
    logAudit('CLEAN_ORPHANS', `Removed ${removed} missing file database records`, req);
    res.json({ success: true, removedCount: removed });
  });

  // 17. Audit Logs
  router.get('/audit-logs', requireAdmin, (_req: Request, res: Response) => {
    res.json(getAuditLogs());
  });

  return router;
}
