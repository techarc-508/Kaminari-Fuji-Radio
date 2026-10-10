import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  Track,
  RadioStation,
  Playlist,
  PlaybackStatus,
  RepeatMode,
  UserSettings,
  ListeningHistoryEntry,
  ServerStats,
} from '../types/radio.ts';

interface RadioContextType {
  currentTrack: Track | null;
  currentStation: RadioStation | null;
  playbackStatus: PlaybackStatus;
  errorMessage: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  crossfade: number;
  sleepTimerRemaining: number | null;
  queue: Track[];
  tracks: Track[];
  stations: RadioStation[];
  playlists: Playlist[];
  stats: ServerStats | null;
  isLoading: boolean;
  isLiveStream: boolean;
  audioLevels: number[];
  analyser: AnalyserNode | null;
  showSpectrum: boolean;
  toggleSpectrum: () => void;
  
  // Controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playTrack: (track: Track) => void;
  selectStation: (station: RadioStation) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  setCrossfade: (seconds: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  
  // Queue operations
  addToQueue: (track: Track, playNext?: boolean) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  
  // Library operations
  refreshLibrary: () => Promise<void>;
  uploadTrack: (formData: FormData) => Promise<boolean>;
  importTrack: (data: any) => Promise<boolean>;
  updateTrack: (id: string, data: Partial<Track>) => Promise<boolean>;
  deleteTrack: (id: string, deleteFile: boolean) => Promise<boolean>;
  
  // Playlist operations
  createPlaylist: (name: string, description: string, genre: string) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: Partial<Playlist>) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<boolean>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;

  // Station operations
  addStation: (data: { name: string; streamUrl: string; genre: string; subtitle?: string; description?: string }) => Promise<boolean>;
  deleteStation: (id: string) => Promise<boolean>;
}

const RadioContext = createContext<RadioContextType | null>(null);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('radio_volume');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read volume from localStorage:', e);
    }
    return 80;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('radio_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [crossfade, setCrossfadeState] = useState<number>(2);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const [audioLevels, setAudioLevels] = useState<number[]>([15, 30, 60, 40, 20]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showSpectrum, setShowSpectrum] = useState<boolean>(true);

  // Audio & Web Audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytReadyRef = useRef<boolean>(false);

  const toggleSpectrum = () => {
    setShowSpectrum(prev => !prev);
  };

  // Web Audio API setup
  const setupWebAudio = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const node = ctx.createAnalyser();
          node.fftSize = 128;
          node.smoothingTimeConstant = 0.75;

          if (audioRef.current && !sourceNodeRef.current) {
            try {
              audioRef.current.crossOrigin = 'anonymous';
              const src = ctx.createMediaElementSource(audioRef.current);
              src.connect(node);
              node.connect(ctx.destination);
              sourceNodeRef.current = src;
            } catch (e) {
              console.warn('Web Audio source connection exception:', e);
            }
          }

          audioContextRef.current = ctx;
          analyserRef.current = node;
          setAnalyser(node);
        }
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (err) {
      console.warn('Web Audio API initialization failed:', err);
    }
  };

  // Real-time frequency data sampling using Web Audio API
  useEffect(() => {
    let animId: number;
    const dataArray = new Uint8Array(64);

    const updateLevels = () => {
      animId = requestAnimationFrame(updateLevels);

      if (playbackStatus !== 'playing') {
        setAudioLevels([15, 10, 25, 15, 8]);
        return;
      }

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let hasData = false;
        for (let i = 0; i < 40; i++) {
          if (dataArray[i] > 0) {
            hasData = true;
            break;
          }
        }

        if (hasData) {
          const getAvg = (start: number, end: number) => {
            let sum = 0;
            for (let i = start; i <= end; i++) sum += dataArray[i];
            return Math.min(100, Math.round(((sum / (end - start + 1)) / 255) * 100));
          };

          const volFactor = isMuted ? 0 : volume / 100;
          setAudioLevels([
            Math.max(8, Math.round(getAvg(1, 3) * volFactor)),
            Math.max(12, Math.round(getAvg(4, 8) * volFactor)),
            Math.max(16, Math.round(getAvg(9, 16) * volFactor)),
            Math.max(12, Math.round(getAvg(17, 26) * volFactor)),
            Math.max(8, Math.round(getAvg(27, 40) * volFactor)),
          ]);
          return;
        }
      }

      // Procedural acoustic frequency fallback when streaming without CORS headers
      const time = Date.now() / 200;
      const volFactor = isMuted ? 0 : volume / 100;
      setAudioLevels([
        Math.max(8, Math.round((25 + Math.sin(time * 1.2) * 20 + Math.random() * 25) * volFactor)),
        Math.max(12, Math.round((35 + Math.cos(time * 1.5) * 25 + Math.random() * 25) * volFactor)),
        Math.max(16, Math.round((45 + Math.sin(time * 0.9) * 30 + Math.random() * 20) * volFactor)),
        Math.max(12, Math.round((30 + Math.cos(time * 1.8) * 25 + Math.random() * 25) * volFactor)),
        Math.max(8, Math.round((20 + Math.sin(time * 2.1) * 20 + Math.random() * 30) * volFactor)),
      ]);
    };

    animId = requestAnimationFrame(updateLevels);
    return () => cancelAnimationFrame(animId);
  }, [playbackStatus, volume, isMuted]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;
    const timer = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        ytReadyRef.current = true;
      };
    } else {
      ytReadyRef.current = true;
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tracksRes, stationsRes, playlistsRes, settingsRes, statsRes] = await Promise.all([
        fetch('/api/tracks'),
        fetch('/api/stations'),
        fetch('/api/playlists'),
        fetch('/api/settings'),
        fetch('/api/stats'),
      ]);

      const fetchedTracks = await tracksRes.json();
      const fetchedStations = await stationsRes.json();
      const fetchedPlaylists = await playlistsRes.json();
      const fetchedSettings: UserSettings = await settingsRes.json();
      const fetchedStatsData = await statsRes.json();

      setTracks(fetchedTracks);
      setStations(fetchedStations);
      setPlaylists(fetchedPlaylists);
      setStats(fetchedStatsData.stats || null);

      if (fetchedSettings) {
        let currentVol = volume;
        try {
          const stored = localStorage.getItem('radio_volume');
          if (stored !== null) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
              currentVol = parsed;
              setVolumeState(parsed);
            }
          } else if (typeof fetchedSettings.volume === 'number') {
            currentVol = fetchedSettings.volume;
            setVolumeState(fetchedSettings.volume);
            localStorage.setItem('radio_volume', fetchedSettings.volume.toString());
          }
        } catch {
          if (typeof fetchedSettings.volume === 'number') {
            setVolumeState(fetchedSettings.volume);
          }
        }

        try {
          const storedMuted = localStorage.getItem('radio_muted');
          if (storedMuted !== null) {
            setIsMuted(storedMuted === 'true');
          } else if (typeof fetchedSettings.isMuted === 'boolean') {
            setIsMuted(fetchedSettings.isMuted);
          }
        } catch {
          setIsMuted(fetchedSettings.isMuted ?? false);
        }

        setRepeatMode(fetchedSettings.repeatMode ?? 'all');
        setShuffle(fetchedSettings.shuffle ?? false);
        setCrossfadeState(fetchedSettings.crossfade ?? 2);
      }

      // Default station or queue setup
      if (fetchedStations.length > 0) {
        const initialStation = fetchedStations.find((s: RadioStation) => s.id === fetchedSettings?.activeStationId) || fetchedStations[0];
        setCurrentStation(initialStation);
      }
      if (fetchedTracks.length > 0) {
        setQueue(fetchedTracks);
      }
    } catch (err) {
      console.error('Error fetching initial radio data:', err);
      setErrorMessage('Could not connect to radio backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create HTML5 audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setPlaybackStatus('playing');
      setErrorMessage(null);
    };

    const onWaiting = () => {
      setPlaybackStatus('buffering');
    };

    const onPlaying = () => {
      setPlaybackStatus('playing');
      setErrorMessage(null);
    };

    const onPause = () => {
      if (playbackStatus !== 'error') {
        setPlaybackStatus('paused');
      }
    };

    const onEnded = () => {
      handleTrackEnd();
    };

    const onError = () => {
      console.warn('Audio playback encountered an error or network interruption.');
      setPlaybackStatus('error');
      setErrorMessage('Stream or audio file unreachable. Click Next or select another preset.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Sync volume with audio element and YT player
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Update Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const title = currentTrack?.title || currentStation?.name || 'Kaminari Radio';
      const artist = currentTrack?.artist || currentStation?.genre || 'Ambient Stream';
      const album = currentTrack?.album || currentStation?.subtitle || 'Retro Web Radio';

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: currentTrack?.coverUrl || '/icon-192.png', sizes: '192x192', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seekTo(details.seekTime);
        }
      });
    }
  }, [currentTrack, currentStation, playbackStatus]);

  // Handle Track Completion
  const handleTrackEnd = () => {
    // Record listen statistics on backend
    if (currentTrack) {
      fetch('/api/stats/listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: currentTrack.id, durationSeconds: Math.round(currentTime) }),
      }).catch(err => console.error(err));
    }

    if (repeatMode === 'one' && currentTrack) {
      seekTo(0);
      play();
      return;
    }

    nextTrack();
  };

  // Playback functions
  const play = () => {
    setupWebAudio();
    setErrorMessage(null);
    if (currentTrack?.source === 'youtube' && currentTrack.youtubeId) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
        setPlaybackStatus('playing');
      }
      return;
    }

    if (audioRef.current) {
      const src = currentTrack?.audioUrl || currentStation?.streamUrl;
      if (src && audioRef.current.src !== src) {
        audioRef.current.src = src;
      }
      audioRef.current
        .play()
        .then(() => {
          setPlaybackStatus('playing');
        })
        .catch(err => {
          console.warn('Autoplay prevented or failed:', err);
          setPlaybackStatus('paused');
        });
    }
  };

  const pause = () => {
    if (currentTrack?.source === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaybackStatus('paused');
  };

  const togglePlay = () => {
    if (playbackStatus === 'playing') {
      pause();
    } else {
      play();
    }
  };

  const playTrack = (track: Track) => {
    setupWebAudio();
    setCurrentStation(null);
    setCurrentTrack(track);
    setErrorMessage(null);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    // Stop current audio sources
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      ytPlayerRef.current.stopVideo();
    }

    if (track.source === 'youtube' && track.youtubeId) {
      playYouTubeTrack(track.youtubeId);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current
          .play()
          .then(() => setPlaybackStatus('playing'))
          .catch(err => {
            console.warn('Playback error:', err);
            setPlaybackStatus('paused');
          });
      }
    }
  };

  const playYouTubeTrack = (videoId: string) => {
    setPlaybackStatus('buffering');
    if (!window.YT || !window.YT.Player) {
      // Retry in 500ms
      setTimeout(() => playYouTubeTrack(videoId), 500);
      return;
    }

    if (!ytPlayerRef.current) {
      const container = document.getElementById('youtube-hidden-player');
      if (container) {
        ytPlayerRef.current = new window.YT.Player('youtube-hidden-player', {
          height: '1',
          width: '1',
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(isMuted ? 0 : volume);
              event.target.playVideo();
              setPlaybackStatus('playing');
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
              if (event.data === 1) setPlaybackStatus('playing');
              else if (event.data === 2) setPlaybackStatus('paused');
              else if (event.data === 3) setPlaybackStatus('buffering');
              else if (event.data === 0) handleTrackEnd();
            },
            onError: () => {
              setPlaybackStatus('error');
              setErrorMessage('YouTube audio playback unavailable for this video.');
            },
          },
        });
      }
    } else {
      ytPlayerRef.current.loadVideoById(videoId);
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
      ytPlayerRef.current.playVideo();
    }
  };

  const selectStation = (station: RadioStation) => {
    setupWebAudio();
    setCurrentTrack(null);
    setCurrentStation(station);
    setErrorMessage(null);
    setCurrentTime(0);
    setDuration(0);

    // Stop YouTube if running
    if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
      ytPlayerRef.current.stopVideo();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = station.streamUrl;
      audioRef.current
        .play()
        .then(() => setPlaybackStatus('playing'))
        .catch(err => {
          console.warn('Playback error on live station:', err);
          setPlaybackStatus('paused');
        });
    }

    // Persist active station preference
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeStationId: station.id }),
    }).catch(console.error);
  };

  const nextTrack = () => {
    if (currentStation) {
      // Find next station preset
      const currentIndex = stations.findIndex(s => s.id === currentStation.id);
      if (currentIndex !== -1 && stations.length > 1) {
        const nextIndex = (currentIndex + 1) % stations.length;
        selectStation(stations[nextIndex]);
        return;
      }
    }

    if (queue.length === 0) return;

    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      playTrack(queue[randomIndex]);
      return;
    }

    const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playTrack(queue[0]);
    } else {
      pause();
    }
  };

  const prevTrack = () => {
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (currentStation) {
      const currentIndex = stations.findIndex(s => s.id === currentStation.id);
      if (currentIndex !== -1 && stations.length > 1) {
        const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
        selectStation(stations[prevIndex]);
        return;
      }
    }

    if (queue.length === 0) return;

    const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (queue.length > 0) {
      playTrack(queue[queue.length - 1]);
    }
  };

  const seekTo = (seconds: number) => {
    if (currentTrack?.source === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    } else if (audioRef.current && isFinite(seconds)) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setVolumeState(clamped);

    try {
      localStorage.setItem('radio_volume', clamped.toString());
    } catch (e) {
      console.warn('Could not persist volume to localStorage:', e);
    }

    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem('radio_muted', 'false');
      } catch {}
    }

    // Update server settings debounced or direct
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: clamped }),
    }).catch(console.error);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('radio_muted', next.toString());
      } catch (e) {
        console.warn('Could not persist muted state to localStorage:', e);
      }
      return next;
    });
  };

  const cycleRepeatMode = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setShuffle(prev => !prev);
  };

  const setCrossfade = (seconds: number) => {
    setCrossfadeState(seconds);
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crossfade: seconds }),
    }).catch(console.error);
  };

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  // Queue manipulation
  const addToQueue = (track: Track, playNext = false) => {
    setQueue(prev => {
      if (playNext && currentTrack) {
        const curIdx = prev.findIndex(t => t.id === currentTrack.id);
        if (curIdx !== -1) {
          const newQueue = [...prev];
          newQueue.splice(curIdx + 1, 0, track);
          return newQueue;
        }
      }
      return [...prev, track];
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, idx) => idx !== index));
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // Library operations
  const refreshLibrary = async () => {
    await fetchData();
  };

  const uploadTrack = async (formData: FormData): Promise<boolean> => {
    try {
      const res = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const newTrack = await res.json();
        setTracks(prev => [newTrack, ...prev]);
        setQueue(prev => [...prev, newTrack]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Track upload error:', err);
      return false;
    }
  };

  const importTrack = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newTrack = await res.json();
        setTracks(prev => [newTrack, ...prev]);
        setQueue(prev => [...prev, newTrack]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Track import error:', err);
      return false;
    }
  };

  const updateTrack = async (id: string, data: Partial<Track>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tracks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setTracks(prev => prev.map(t => (t.id === id ? updated : t)));
        setQueue(prev => prev.map(t => (t.id === id ? updated : t)));
        if (currentTrack?.id === id) {
          setCurrentTrack(updated);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update track error:', err);
      return false;
    }
  };

  const deleteTrack = async (id: string, deleteFile: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tracks/${id}?deleteFile=${deleteFile}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== id));
        setQueue(prev => prev.filter(t => t.id !== id));
        if (currentTrack?.id === id) {
          nextTrack();
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete track error:', err);
      return false;
    }
  };

  // Playlists
  const createPlaylist = async (name: string, description: string, genre: string): Promise<Playlist | null> => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, genre }),
      });
      if (res.ok) {
        const newPl = await res.json();
        setPlaylists(prev => [...prev, newPl]);
        return newPl;
      }
      return null;
    } catch (err) {
      console.error('Create playlist error:', err);
      return null;
    }
  };

  const updatePlaylist = async (id: string, data: Partial<Playlist>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlaylists(prev => prev.map(p => (p.id === id ? updated : p)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update playlist error:', err);
      return false;
    }
  };

  const deletePlaylist = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete playlist error:', err);
      return false;
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;
    if (pl.trackIds.includes(trackId)) return true;
    const newTrackIds = [...pl.trackIds, trackId];
    return updatePlaylist(playlistId, { trackIds: newTrackIds });
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;
    const newTrackIds = pl.trackIds.filter(id => id !== trackId);
    return updatePlaylist(playlistId, { trackIds: newTrackIds });
  };

  // Stations
  const addStation = async (data: { name: string; streamUrl: string; genre: string; subtitle?: string; description?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newStation = await res.json();
        setStations(prev => [...prev, newStation]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Add station error:', err);
      return false;
    }
  };

  const deleteStation = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStations(prev => prev.filter(s => s.id !== id));
        if (currentStation?.id === id) {
          setCurrentStation(stations[0] || null);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete station error:', err);
      return false;
    }
  };

  const isLiveStream = currentStation !== null || (currentTrack?.duration === 0);

  return (
    <RadioContext.Provider
      value={{
        currentTrack,
        currentStation,
        playbackStatus,
        errorMessage,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        shuffle,
        crossfade,
        sleepTimerRemaining,
        queue,
        tracks,
        stations,
        playlists,
        stats,
        isLoading,
        isLiveStream,
        audioLevels,
        analyser,
        showSpectrum,
        toggleSpectrum,
        play,
        pause,
        togglePlay,
        playTrack,
        selectStation,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        setRepeatMode,
        cycleRepeatMode,
        toggleShuffle,
        setCrossfade,
        setSleepTimer,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        refreshLibrary,
        uploadTrack,
        importTrack,
        updateTrack,
        deleteTrack,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        addStation,
        deleteStation,
      }}
    >
      {/* Hidden container for YouTube IFrame player audio playback */}
      <div id="youtube-hidden-player" style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }} />
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
