import React, { useState, useMemo } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import type { Track } from '../types/radio.ts';
import {
  Play,
  ListPlus,
  Trash2,
  Edit2,
  Search,
  HardDrive,
  RefreshCw,
  FolderSync,
  Clock,
  Sparkles,
  Music,
  Check,
  X,
  Youtube,
  Globe,
} from 'lucide-react';

interface MusicLibraryProps {
  onOpenImport?: () => void;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({ onOpenImport }) => {
  const {
    tracks,
    currentTrack,
    playbackStatus,
    playTrack,
    addToQueue,
    deleteTrack,
    updateTrack,
    playlists,
    addTrackToPlaylist,
    refreshLibrary,
  } = useRadio();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'duration' | 'plays'>('recent');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Recent Searches (persisted in localStorage, max 5)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('radio_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('radio_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((q) => q.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem('radio_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('radio_recent_searches');
    } catch {}
  };

  // Modal / action states
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [deleteConfirmTrack, setDeleteConfirmTrack] = useState<Track | null>(null);
  const [deleteFileOption, setDeleteFileOption] = useState(false);
  const [rescanStatus, setRescanStatus] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editLicense, setEditLicense] = useState('');

  // Unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.genre) set.add(t.genre);
    });
    return Array.from(set);
  }, [tracks]);

  // Filtered & sorted tracks
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((track) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
          track.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGenre = selectedGenre === 'all' || track.genre.toLowerCase() === selectedGenre.toLowerCase();
        const matchesSource = selectedSource === 'all' || track.source === selectedSource;

        return matchesSearch && matchesGenre && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
        if (sortBy === 'duration') return b.duration - a.duration;
        if (sortBy === 'plays') return (b.playCount || 0) - (a.playCount || 0);
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
  }, [tracks, searchQuery, selectedGenre, selectedSource, sortBy]);

  const formatDuration = (secs: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    setRescanStatus(null);
    try {
      const res = await fetch('/api/library/rescan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRescanStatus(`Scanned ${data.filesScanned} files. Added ${data.addedTracks} new tracks.`);
        await refreshLibrary();
      } else {
        setRescanStatus('Rescan completed with no changes.');
      }
    } catch {
      setRescanStatus('Error during folder rescan.');
    } finally {
      setIsRescanning(false);
      setTimeout(() => setRescanStatus(null), 5000);
    }
  };

  const openEditModal = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album || '');
    setEditGenre(track.genre);
    setEditLicense(track.license || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    await updateTrack(editingTrack.id, {
      title: editTitle.trim(),
      artist: editArtist.trim(),
      album: editAlbum.trim() || undefined,
      genre: editGenre.trim(),
      license: editLicense.trim() || undefined,
    });
    setEditingTrack(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTrack) return;
    await deleteTrack(deleteConfirmTrack.id, deleteFileOption);
    setDeleteConfirmTrack(null);
    setDeleteFileOption(false);
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
      {/* Top Header & Storage Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#3e3831] pb-4 mb-4 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2d2722]">
            Self-Hosted Library Dashboard
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono text-[#746b60] mt-1">
            <span>{tracks.length} tracks cataloged</span>
            <span>·</span>
            <span>{tracks.filter((t) => t.source === 'local').length} stored on local disk</span>
            <span>·</span>
            <span>{tracks.filter((t) => t.source !== 'local').length} streaming sources</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRescan}
            disabled={isRescanning}
            title="Scan /data/music/ directory for newly dropped files"
            className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
            <span>{isRescanning ? 'Scanning disk...' : 'Rescan /data/music'}</span>
          </button>

          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium transition-colors"
            >
              + Add / Import Track
            </button>
          )}
        </div>
      </div>

      {rescanStatus && (
        <div className="mb-4 p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center justify-between">
          <span>{rescanStatus}</span>
          <button onClick={() => setRescanStatus(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar with Recent Searches */}
      <div className="bg-[#e4dfd1]/70 border border-[#3e3831] p-3 mb-4 space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#746b60] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, artist, album, tags... (Press Enter to save)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveSearchQuery(searchQuery);
                }
              }}
              onBlur={() => {
                if (searchQuery.trim().length >= 2) {
                  saveSearchQuery(searchQuery);
                }
              }}
              className="w-full bg-[#ece6d8] border border-[#3e3831] pl-8 pr-8 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#746b60] hover:text-[#c52838] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Genre Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-mono text-[#746b60]">Genre:</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1 text-xs font-mono text-[#2d2722] focus:outline-none"
            >
              <option value="all">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-mono text-[#746b60]">Source:</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1 text-xs font-mono text-[#2d2722] focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="local">Local Storage</option>
              <option value="youtube">YouTube</option>
              <option value="direct_url">Direct Audio URL</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-mono text-[#746b60]">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1 text-xs font-mono text-[#2d2722] focus:outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="artist">Artist (A-Z)</option>
              <option value="duration">Longest</option>
              <option value="plays">Most Played</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-[#3e3831] bg-[#ece6d8] p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 text-[11px] font-mono ${
                viewMode === 'table' ? 'bg-[#c52838] text-white' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 text-[11px] font-mono ${
                viewMode === 'grid' ? 'bg-[#c52838] text-white' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Recent Searches Tags (Saved in localStorage, max 5) */}
        {recentSearches.length > 0 && (
          <div className="pt-2 border-t border-[#3e3831]/20 flex items-center flex-wrap gap-1.5 text-xs font-mono">
            <span className="text-[#746b60] flex items-center gap-1 text-[11px] font-medium mr-1 select-none">
              <Clock className="w-3 h-3 text-[#c52838]" />
              Recent Searches:
            </span>
            {recentSearches.map((term) => (
              <span
                key={term}
                className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] transition-colors ${
                  searchQuery.toLowerCase() === term.toLowerCase()
                    ? 'border-[#c52838] bg-[#c52838] text-white font-bold'
                    : 'border-[#3e3831] bg-[#ece6d8] text-[#2d2722] hover:border-[#c52838]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    saveSearchQuery(term);
                  }}
                  title={`Filter library by "${term}"`}
                  className="hover:underline focus:outline-none"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(term);
                  }}
                  title="Remove from recent searches"
                  className="opacity-60 hover:opacity-100 hover:text-[#c52838] ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllRecentSearches}
              className="text-[10px] font-mono text-[#746b60] hover:text-[#c52838] underline ml-2"
              title="Clear all recent search tags"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Tracks Container */}
      {filteredTracks.length === 0 ? (
        <div className="border border-dashed border-[#3e3831] p-10 text-center bg-[#e4dfd1]/30">
          <Music className="w-8 h-8 text-[#746b60] mx-auto mb-2" />
          <p className="text-sm font-serif font-semibold text-[#2d2722]">No tracks matched your criteria</p>
          <p className="text-xs font-mono text-[#746b60] mt-1">
            Try resetting your search query or import a new YouTube link or audio file.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border border-[#3e3831] bg-[#e4dfd1]/30 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#e4dfd1] border-b border-[#3e3831] text-[#746b60] uppercase text-[11px]">
              <tr>
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3">Title & Artist</th>
                <th className="py-2 px-3 hidden md:table-cell">Genre</th>
                <th className="py-2 px-3 hidden lg:table-cell">Source / License</th>
                <th className="py-2 px-3 text-right">Time</th>
                <th className="py-2 px-3 text-right hidden sm:table-cell">Plays</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3e3831]/20 text-[#2d2722]">
              {filteredTracks.map((track, idx) => {
                const isPlayingThis = currentTrack?.id === track.id && playbackStatus === 'playing';
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <tr
                    key={track.id}
                    className={`hover:bg-[#e4dfd1]/80 transition-colors group ${
                      isCurrent ? 'bg-[#e4dfd1] font-medium' : ''
                    }`}
                  >
                    {/* Index or Play indicator */}
                    <td className="py-2.5 px-3 text-center text-[#746b60]">
                      <button
                        onClick={() => playTrack(track)}
                        className="w-6 h-6 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#c52838] hover:text-white flex items-center justify-center transition-colors mx-auto"
                        title="Play Track"
                      >
                        {isPlayingThis ? (
                          <span className="w-2 h-2 bg-[#c52838] group-hover:bg-white animate-ping" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )}
                      </button>
                    </td>

                    {/* Title & Artist */}
                    <td className="py-2.5 px-3">
                      <div className="font-serif font-semibold text-sm text-[#2d2722] flex items-center gap-2">
                        <span>{track.title}</span>
                        {track.source === 'youtube' && (
                          <span className="text-[10px] font-mono text-[#c52838] flex items-center gap-0.5">
                            <Youtube className="w-3 h-3" />
                            YT
                          </span>
                        )}
                        {track.source === 'local' && (
                          <span className="text-[10px] font-mono text-[#4b6a3e] flex items-center gap-0.5">
                            <HardDrive className="w-3 h-3" />
                            DISK
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#746b60] truncate">
                        {track.artist}
                        {track.album ? ` · ${track.album}` : ''}
                      </div>
                    </td>

                    {/* Genre */}
                    <td className="py-2.5 px-3 hidden md:table-cell text-[#544d44]">
                      {track.genre}
                    </td>

                    {/* Source / License */}
                    <td className="py-2.5 px-3 hidden lg:table-cell text-[11px] text-[#746b60]">
                      <div>{track.license || 'Royalty-Free / CC'}</div>
                      {track.fileSize ? <div>{formatFileSize(track.fileSize)}</div> : null}
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#544d44]">
                      {formatDuration(track.duration)}
                    </td>

                    {/* Play count */}
                    <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell text-[#746b60]">
                      {track.playCount || 0}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => addToQueue(track, false)}
                          title="Add to Playback Queue"
                          className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPlaylistModalTrack(track)}
                          title="Add to Playlist"
                          className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]"
                        >
                          <Music className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(track)}
                          title="Edit Track Metadata"
                          className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTrack(track)}
                          title="Remove from Library"
                          className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#fae2e4] text-[#c52838]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="border border-[#3e3831] bg-[#e4dfd1]/50 p-3.5 hover:bg-[#e4dfd1] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#746b60] border border-[#3e3831]/40 px-1.5 py-0.5">
                    {track.genre}
                  </span>
                  <span className="text-xs font-mono text-[#746b60] tabular-nums">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-[#2d2722] truncate leading-tight">
                  {track.title}
                </h3>
                <p className="text-xs font-mono text-[#746b60] truncate mt-0.5">
                  {track.artist}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#3e3831]/30 pt-2.5 mt-3">
                <span className="text-[11px] font-mono text-[#746b60]">
                  {track.source === 'local' ? 'Local' : track.source === 'youtube' ? 'YouTube' : 'Stream'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => playTrack(track)}
                    className="px-2.5 py-1 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                  <button
                    onClick={() => addToQueue(track, false)}
                    className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[#2d2722]"
                    title="Add to queue"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <h3 className="text-lg font-serif font-bold text-[#2d2722]">Edit Metadata</h3>
              <button onClick={() => setEditingTrack(null)}>
                <X className="w-4 h-4 text-[#746b60]" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#544d44] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>
              <div>
                <label className="block text-[#544d44] mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>
              <div>
                <label className="block text-[#544d44] mb-1">Album</label>
                <input
                  type="text"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>
              <div>
                <label className="block text-[#544d44] mb-1">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>
              <div>
                <label className="block text-[#544d44] mb-1">License / Attribution</label>
                <input
                  type="text"
                  value={editLicense}
                  onChange={(e) => setEditLicense(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3e3831]">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-[#2d2722]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Playlist Modal */}
      {playlistModalTrack && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm shadow-lg">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <h3 className="text-base font-serif font-bold text-[#2d2722]">
                Add to Station / Playlist
              </h3>
              <button onClick={() => setPlaylistModalTrack(null)}>
                <X className="w-4 h-4 text-[#746b60]" />
              </button>
            </div>
            <p className="text-xs font-mono text-[#746b60] mb-3 truncate">
              {playlistModalTrack.title} — {playlistModalTrack.artist}
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs mb-4">
              {playlists.map((pl) => {
                const alreadyIn = pl.trackIds.includes(playlistModalTrack.id);
                return (
                  <button
                    key={pl.id}
                    onClick={async () => {
                      await addTrackToPlaylist(pl.id, playlistModalTrack.id);
                      setPlaylistModalTrack(null);
                    }}
                    disabled={alreadyIn}
                    className={`w-full text-left px-3 py-2 border border-[#3e3831] flex items-center justify-between ${
                      alreadyIn
                        ? 'bg-[#e4dfd1]/50 text-[#746b60] opacity-60'
                        : 'bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722]'
                    }`}
                  >
                    <span>{pl.name}</span>
                    {alreadyIn ? <span>In Playlist</span> : <span>+ Add</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPlaylistModalTrack(null)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-xs font-mono text-[#2d2722]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTrack && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm shadow-lg">
            <h3 className="text-base font-serif font-bold text-[#2d2722] mb-2">
              Remove Track from Library?
            </h3>
            <p className="text-xs font-mono text-[#544d44] mb-3">
              "{deleteConfirmTrack.title}" by {deleteConfirmTrack.artist}
            </p>

            {deleteConfirmTrack.source === 'local' && (
              <label className="flex items-center gap-2 text-xs font-mono text-[#c52838] mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteFileOption}
                  onChange={(e) => setDeleteFileOption(e.target.checked)}
                  className="rounded-none border-[#3e3831]"
                />
                <span>Also permanently delete file from server disk</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setDeleteConfirmTrack(null)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-[#2d2722]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831]"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
