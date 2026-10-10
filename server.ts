import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import type { Track, RadioStation, Playlist, UserSettings, ListeningHistoryEntry, ServerStats } from './src/types/radio.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(express.json());

import { createAdminRouter } from './src/server/adminRoutes.ts';

// Persistent directories
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MUSIC_DIR = path.join(DATA_DIR, 'music');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');
const TEMP_DIR = path.join(DATA_DIR, 'temp');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });
if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Multer storage for uploaded audio files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MUSIC_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExts = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
    if (allowedExts.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (mp3, wav, ogg, flac, m4a, aac) are supported'));
    }
  },
});

interface DatabaseSchema {
  tracks: Track[];
  stations: RadioStation[];
  playlists: Playlist[];
  settings: UserSettings;
  history: ListeningHistoryEntry[];
  stats: ServerStats;
}

const DEFAULT_STATIONS: RadioStation[] = [
  {
    id: 'lofi-chillhop',
    name: 'Lofi Chillhop',
    genre: 'Lo-Fi Chillhop',
    subtitle: 'Lofi Chillhop · live stream',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    type: 'stream',
    description: 'Relaxing lo-fi beats, gentle crackle, warm rhodes piano and mellow grooves for focus and tranquility.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Lofi Chillhop',
      artist: 'iLoveRadio',
    },
  },
  {
    id: 'nightwave-plaza',
    name: 'Nightwave Plaza',
    genre: 'Vaporwave / Synthwave',
    subtitle: 'Vaporwave & Future Funk · 24/7 stream',
    streamUrl: 'https://radio.plaza.one/mp3',
    type: 'stream',
    description: 'The premier online vaporwave & nostalgic synth broadcast station.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Plaza Broadcast',
      artist: 'Nightwave Plaza',
    },
  },
  {
    id: 'somafm-space-station',
    name: 'SomaFM · Space Station',
    genre: 'Ambient / Space',
    subtitle: 'Deep space ambient · SomaFM stream',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-mp3',
    type: 'stream',
    description: 'Tune in, turn on, space out. Spaced-out ambient and mid-tempo electronica.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Space Station Soma',
      artist: 'SomaFM',
    },
  },
  {
    id: 'rplab-radio',
    name: 'RPLab Radio',
    genre: 'Downtempo / Ambient',
    subtitle: 'Ambient groove salad · chillout broadcast',
    streamUrl: 'https://ice2.somafm.com/groovesalad-128-mp3',
    type: 'stream',
    description: 'A nicely chilled plate of ambient/downtempo beats and peaceful atmospheric grooves.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Groove Salad Ambient',
      artist: 'RPLab & SomaFM',
    },
  },
  {
    id: 'ambient-piano',
    name: 'Ambient Piano',
    genre: 'Neo-Classical / Piano',
    subtitle: 'Minimal piano & drone · contemplative stream',
    streamUrl: 'https://ice4.somafm.com/dronezone-128-mp3',
    type: 'stream',
    description: 'Served best chilled, safe with most medications. Atmospheric drone with contemplative piano layers.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Atmospheric Reflections',
      artist: 'Drone Zone Soundscape',
    },
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    genre: 'Electronic / Focus',
    subtitle: 'Hacker ambient & downtempo · SomaFM stream',
    streamUrl: 'https://ice6.somafm.com/defcon-128-mp3',
    type: 'stream',
    description: 'Music for thinking, programming, and deep mental focus without vocal distractions.',
    hasMetadata: false,
    nowPlaying: {
      title: 'Defcon Ambient Signal',
      artist: 'SomaFM Broadcast',
    },
  },
];

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Warm Midnight Tape',
    artist: 'Analog Study',
    album: 'C-60 Memories',
    duration: 168,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/681/681285_1648170-lq.mp3',
    genre: 'Lo-Fi Chillhop',
    tags: ['lofi', 'vintage', 'tape', 'chill'],
    fileSize: 2688000,
    isDownloaded: false,
    license: 'Creative Commons CC-BY 4.0',
    playCount: 14,
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    stationPreset: 'lofi-chillhop',
  },
  {
    id: 'track-2',
    title: 'Starlight Drift',
    artist: 'Cosmic Navigator',
    album: 'Orbital Resonance',
    duration: 215,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/565/565431_11861866-lq.mp3',
    genre: 'Ambient / Space',
    tags: ['space', 'drone', 'synthesizer', 'calm'],
    fileSize: 3440000,
    isDownloaded: false,
    license: 'Creative Commons CC0',
    playCount: 9,
    addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    stationPreset: 'somafm-space-station',
  },
  {
    id: 'track-3',
    title: 'Rain on Autumn Leaves',
    artist: 'Komorebi Piano Ensemble',
    album: 'Quiet Solitude',
    duration: 154,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
    genre: 'Neo-Classical / Piano',
    tags: ['piano', 'rain', 'acoustic', 'peaceful'],
    fileSize: 2464000,
    isDownloaded: false,
    license: 'Creative Commons CC-BY 3.0',
    playCount: 21,
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    stationPreset: 'ambient-piano',
  },
  {
    id: 'track-4',
    title: 'Neon Boulevard at 2 AM',
    artist: 'Midnight Cruiser',
    album: 'Retrowave Horizons',
    duration: 228,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/522/522248_11861866-lq.mp3',
    genre: 'Vaporwave / Synthwave',
    tags: ['synthwave', 'night', 'retro', 'electronic'],
    fileSize: 3648000,
    isDownloaded: false,
    license: 'Creative Commons CC-BY 4.0',
    playCount: 18,
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    stationPreset: 'nightwave-plaza',
  },
  {
    id: 'track-5',
    title: 'Weightless Horizon',
    artist: 'Auraform',
    album: 'Deep Sleep Fields',
    duration: 260,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/652/652390_11861866-lq.mp3',
    genre: 'Ambient / Drone',
    tags: ['meditation', 'sleep', 'relax', 'deep drone'],
    fileSize: 4160000,
    isDownloaded: false,
    license: 'Creative Commons CC0',
    playCount: 11,
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    stationPreset: 'somafm-space-station',
  },
  {
    id: 'track-6',
    title: 'Sunday Morning Coffee & Vinyl',
    artist: 'Bespoke Beats',
    album: 'Morning Routine',
    duration: 145,
    source: 'direct_url',
    audioUrl: 'https://cdn.freesound.org/previews/538/538422_11861866-lq.mp3',
    genre: 'Lo-Fi Chillhop',
    tags: ['lofi', 'coffee', 'study', 'acoustic'],
    fileSize: 2320000,
    isDownloaded: false,
    license: 'Creative Commons CC-BY 3.0',
    playCount: 16,
    addedAt: new Date().toISOString(),
    stationPreset: 'lofi-chillhop',
  },
];

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-lofi',
    name: 'Lofi Chillhop Essentials',
    description: 'Cozy, relaxing downtempo beats with soft tape warmth and vinyl dust.',
    trackIds: ['track-1', 'track-6'],
    createdAt: new Date().toISOString(),
    genre: 'Lo-Fi Chillhop',
  },
  {
    id: 'pl-ambient',
    name: 'Deep Space & Drone Sanctuary',
    description: 'Hypnotic continuous soundscapes for zero-gravity drifting.',
    trackIds: ['track-2', 'track-5'],
    createdAt: new Date().toISOString(),
    genre: 'Ambient / Space',
  },
  {
    id: 'pl-piano',
    name: 'Calm Piano & Solitude',
    description: 'Pure acoustic piano melodies mixed with natural silence and rain.',
    trackIds: ['track-3'],
    createdAt: new Date().toISOString(),
    genre: 'Neo-Classical / Piano',
  },
  {
    id: 'pl-synthwave',
    name: 'Night Drive 1984',
    description: 'Warm analog synthesizers, linndrum beats, and retrofuturistic night driving.',
    trackIds: ['track-4'],
    createdAt: new Date().toISOString(),
    genre: 'Vaporwave / Synthwave',
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  volume: 80,
  isMuted: false,
  crossfade: 2,
  repeatMode: 'all',
  shuffle: false,
  sleepTimerMinutes: null,
  activeStationId: 'lofi-chillhop',
  activeTrackId: null,
  compactPlayer: false,
};

// Database helper functions
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        tracks: data.tracks || DEFAULT_TRACKS,
        stations: data.stations || DEFAULT_STATIONS,
        playlists: data.playlists || DEFAULT_PLAYLISTS,
        settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        history: data.history || [],
        stats: data.stats || {
          totalTracks: (data.tracks || DEFAULT_TRACKS).length,
          totalDurationSeconds: 1160,
          storageUsedBytes: 16320000,
          totalPlays: 89,
          totalListeningMinutes: 342,
          topTracks: [],
        },
      };
    }
  } catch (err) {
    console.error('Error reading database file, using defaults:', err);
  }

  const initialDb: DatabaseSchema = {
    tracks: DEFAULT_TRACKS,
    stations: DEFAULT_STATIONS,
    playlists: DEFAULT_PLAYLISTS,
    settings: DEFAULT_SETTINGS,
    history: [],
    stats: {
      totalTracks: DEFAULT_TRACKS.length,
      totalDurationSeconds: 1160,
      storageUsedBytes: 16320000,
      totalPlays: 89,
      totalListeningMinutes: 342,
      topTracks: [
        { title: 'Rain on Autumn Leaves', artist: 'Komorebi Piano Ensemble', playCount: 21 },
        { title: 'Neon Boulevard at 2 AM', artist: 'Midnight Cruiser', playCount: 18 },
        { title: 'Sunday Morning Coffee', artist: 'Bespoke Beats', playCount: 16 },
        { title: 'Warm Midnight Tape', artist: 'Analog Study', playCount: 14 },
      ],
    },
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

let db = loadDatabase();

// Mount Admin Dashboard & yt-dlp Queue Router
app.use(
  '/api/admin',
  createAdminRouter({
    getDb: () => db,
    saveDb: (newDb: any) => {
      db = newDb;
      saveDatabase(newDb);
    },
    musicDir: MUSIC_DIR,
    tempDir: TEMP_DIR,
    artworkDir: ARTWORK_DIR,
  })
);

// --- REST API ENDPOINTS ---

// 1. Radio Stations
app.get('/api/stations', (_req: Request, res: Response) => {
  res.json(db.stations);
});

app.post('/api/stations', (req: Request, res: Response) => {
  const { name, genre, subtitle, streamUrl, description } = req.body;
  if (!name || !streamUrl) {
    res.status(400).json({ error: 'Name and streamUrl are required' });
    return;
  }
  const newStation: RadioStation = {
    id: `custom-station-${Date.now()}`,
    name,
    genre: genre || 'Ambient Radio',
    subtitle: subtitle || `${name} · custom stream`,
    streamUrl,
    type: 'stream',
    description: description || 'Custom user-added ambient stream',
    hasMetadata: false,
    nowPlaying: {
      title: name,
      artist: 'Custom Stream',
    },
  };
  db.stations.push(newStation);
  saveDatabase(db);
  res.status(201).json(newStation);
});

app.delete('/api/stations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.stations = db.stations.filter(s => s.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 2. Tracks (Listing, Search, Filter, Sort)
app.get('/api/tracks', (req: Request, res: Response) => {
  const { q, genre, source, sort } = req.query;
  let result = [...db.tracks];

  if (typeof q === 'string' && q.trim()) {
    const query = q.toLowerCase();
    result = result.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        (t.album && t.album.toLowerCase().includes(query)) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (typeof genre === 'string' && genre && genre !== 'all') {
    result = result.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
  }

  if (typeof source === 'string' && source && source !== 'all') {
    result = result.filter(t => t.source === source);
  }

  if (sort === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'artist') {
    result.sort((a, b) => a.artist.localeCompare(b.artist));
  } else if (sort === 'duration') {
    result.sort((a, b) => b.duration - a.duration);
  } else if (sort === 'plays') {
    result.sort((a, b) => b.playCount - a.playCount);
  } else {
    // Default newest added
    result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  res.json(result);
});

// 3. Audio File Streaming with HTTP 206 Range Requests (Crucial for audio seeking!)
app.get('/api/audio/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(MUSIC_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Audio file not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Determine MIME type
  const ext = path.extname(filename).toLowerCase();
  let mimeType = 'audio/mpeg';
  if (ext === '.wav') mimeType = 'audio/wav';
  else if (ext === '.ogg') mimeType = 'audio/ogg';
  else if (ext === '.flac') mimeType = 'audio/flac';
  else if (ext === '.m4a' || ext === '.aac') mimeType = 'audio/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 4. Track Upload (Local Storage)
app.post('/api/tracks/upload', upload.single('audio'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }

  const { title, artist, genre, album, tags, license } = req.body;
  const baseName = path.parse(req.file.originalname).name;

  const newTrack: Track = {
    id: `track-${Date.now()}`,
    title: title?.trim() || baseName,
    artist: artist?.trim() || 'Local Artist',
    album: album?.trim() || 'Self-Hosted Library',
    duration: 180, // Approximate default if not extracted
    source: 'local',
    audioUrl: `/api/audio/${req.file.filename}`,
    genre: genre?.trim() || 'Ambient / Instrumental',
    tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : ['local', 'ambient'],
    fileSize: req.file.size,
    storagePath: req.file.path,
    isDownloaded: true,
    license: license || 'Personal / Self-Hosted Storage',
    playCount: 0,
    addedAt: new Date().toISOString(),
  };

  db.tracks.unshift(newTrack);
  db.stats.totalTracks = db.tracks.length;
  db.stats.storageUsedBytes += req.file.size;
  saveDatabase(db);

  res.status(201).json(newTrack);
});

// 5. Track Import (Direct URL or YouTube URL)
app.post('/api/tracks', (req: Request, res: Response) => {
  const { title, artist, album, genre, tags, source, audioUrl, youtubeUrl, license } = req.body;

  let finalSource = source || 'direct_url';
  let finalAudioUrl = audioUrl || '';
  let youtubeId: string | undefined = undefined;

  // Check for YouTube URL
  if (youtubeUrl || (audioUrl && (audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be')))) {
    const rawUrl = youtubeUrl || audioUrl;
    finalSource = 'youtube';
    const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      youtubeId = match[1];
      finalAudioUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else {
      res.status(400).json({ error: 'Invalid YouTube URL provided' });
      return;
    }
  }

  if (!finalAudioUrl && !youtubeId) {
    res.status(400).json({ error: 'Audio URL or YouTube URL is required' });
    return;
  }

  const newTrack: Track = {
    id: `track-${Date.now()}`,
    title: title?.trim() || (youtubeId ? `YouTube Broadcast [${youtubeId}]` : 'Ambient Stream'),
    artist: artist?.trim() || (youtubeId ? 'YouTube Creator' : 'Independent Artist'),
    album: album?.trim() || (youtubeId ? 'Online Stream' : 'Digital Ambient'),
    duration: 210,
    source: finalSource,
    audioUrl: finalAudioUrl,
    youtubeId,
    genre: genre?.trim() || 'Ambient / Lofi',
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : ['ambient'],
    fileSize: 0,
    isDownloaded: false,
    license: license || (youtubeId ? 'Standard YouTube License (Embedded Player)' : 'Authorized Stream'),
    playCount: 0,
    addedAt: new Date().toISOString(),
  };

  db.tracks.unshift(newTrack);
  db.stats.totalTracks = db.tracks.length;
  saveDatabase(db);

  res.status(201).json(newTrack);
});

// 6. Update Track Metadata
app.put('/api/tracks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.tracks.findIndex(t => t.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }

  const { title, artist, album, genre, tags, license } = req.body;
  db.tracks[index] = {
    ...db.tracks[index],
    title: title ?? db.tracks[index].title,
    artist: artist ?? db.tracks[index].artist,
    album: album ?? db.tracks[index].album,
    genre: genre ?? db.tracks[index].genre,
    tags: Array.isArray(tags) ? tags : db.tracks[index].tags,
    license: license ?? db.tracks[index].license,
  };

  saveDatabase(db);
  res.json(db.tracks[index]);
});

// 7. Delete Track (with optional file removal)
app.delete('/api/tracks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleteFile = req.query.deleteFile === 'true';

  const track = db.tracks.find(t => t.id === id);
  if (!track) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }

  if (deleteFile && track.storagePath && fs.existsSync(track.storagePath)) {
    try {
      const stats = fs.statSync(track.storagePath);
      fs.unlinkSync(track.storagePath);
      db.stats.storageUsedBytes = Math.max(0, db.stats.storageUsedBytes - stats.size);
    } catch (err) {
      console.error('Error deleting file from disk:', err);
    }
  }

  db.tracks = db.tracks.filter(t => t.id !== id);
  // Also remove from playlists
  db.playlists.forEach(pl => {
    pl.trackIds = pl.trackIds.filter(tId => tId !== id);
  });
  db.stats.totalTracks = db.tracks.length;
  saveDatabase(db);

  res.json({ success: true, deletedFile: deleteFile });
});

// 8. Playlists
app.get('/api/playlists', (_req: Request, res: Response) => {
  res.json(db.playlists);
});

app.post('/api/playlists', (req: Request, res: Response) => {
  const { name, description, trackIds, genre } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Playlist name is required' });
    return;
  }

  const newPlaylist: Playlist = {
    id: `pl-${Date.now()}`,
    name,
    description: description || '',
    trackIds: Array.isArray(trackIds) ? trackIds : [],
    createdAt: new Date().toISOString(),
    genre: genre || 'Various',
  };

  db.playlists.push(newPlaylist);
  saveDatabase(db);
  res.status(201).json(newPlaylist);
});

app.put('/api/playlists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.playlists.findIndex(p => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }

  const { name, description, trackIds, genre } = req.body;
  db.playlists[index] = {
    ...db.playlists[index],
    name: name ?? db.playlists[index].name,
    description: description ?? db.playlists[index].description,
    trackIds: Array.isArray(trackIds) ? trackIds : db.playlists[index].trackIds,
    genre: genre ?? db.playlists[index].genre,
  };

  saveDatabase(db);
  res.json(db.playlists[index]);
});

app.delete('/api/playlists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.playlists = db.playlists.filter(p => p.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 9. User Settings
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json(db.settings);
});

// 10. Record Track Play & Listening Statistics
app.post('/api/stats/listen', (req: Request, res: Response) => {
  const { trackId, durationSeconds } = req.body;
  const track = db.tracks.find(t => t.id === trackId);
  if (track) {
    track.playCount = (track.playCount || 0) + 1;
    track.lastPlayedAt = new Date().toISOString();

    const historyEntry: ListeningHistoryEntry = {
      id: `hist-${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      artist: track.artist,
      genre: track.genre,
      playedAt: new Date().toISOString(),
      durationSeconds: durationSeconds || track.duration || 60,
    };

    db.history.unshift(historyEntry);
    if (db.history.length > 100) db.history = db.history.slice(0, 100);

    db.stats.totalPlays += 1;
    db.stats.totalListeningMinutes += Math.round((durationSeconds || 60) / 60);

    // Update top tracks
    const playCounts = db.tracks
      .filter(t => t.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map(t => ({ title: t.title, artist: t.artist, playCount: t.playCount }));
    db.stats.topTracks = playCounts;

    saveDatabase(db);
  }
  res.json({ success: true });
});

app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    stats: db.stats,
    history: db.history.slice(0, 25),
  });
});

// 11. Rescan Local Media Folder
app.post('/api/library/rescan', (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(MUSIC_DIR);
    const audioExts = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;
    let addedCount = 0;

    for (const file of files) {
      if (audioExts.test(file)) {
        const filePath = path.join(MUSIC_DIR, file);
        const exists = db.tracks.some(t => t.storagePath === filePath || t.audioUrl === `/api/audio/${file}`);
        if (!exists) {
          const stat = fs.statSync(filePath);
          const baseName = path.parse(file).name;
          const newTrack: Track = {
            id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: baseName.replace(/[-_]/g, ' '),
            artist: 'Local Archive',
            album: 'Imported Media',
            duration: 180,
            source: 'local',
            audioUrl: `/api/audio/${file}`,
            genre: 'Ambient / Instrumental',
            tags: ['local', 'scanned'],
            fileSize: stat.size,
            storagePath: filePath,
            isDownloaded: true,
            license: 'Local Media Storage',
            playCount: 0,
            addedAt: new Date().toISOString(),
          };
          db.tracks.push(newTrack);
          db.stats.storageUsedBytes += stat.size;
          addedCount++;
        }
      }
    }

    db.stats.totalTracks = db.tracks.length;
    saveDatabase(db);
    res.json({ success: true, filesScanned: files.length, addedTracks: addedCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to rescan directory', details: err.message });
  }
});

// 12. Storage Status
app.get('/api/library/status', (_req: Request, res: Response) => {
  res.json({
    musicDirectory: MUSIC_DIR,
    totalTracks: db.tracks.length,
    localTracks: db.tracks.filter(t => t.source === 'local').length,
    streamTracks: db.tracks.filter(t => t.source !== 'local').length,
    storageUsedBytes: db.stats.storageUsedBytes,
    playlistsCount: db.playlists.length,
    stationsCount: db.stations.length,
  });
});

// --- Development Vite Server vs Production Static Files ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio Receiver server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
