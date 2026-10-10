import React, { useState, useMemo } from 'react';
import { useRadio } from '../../context/RadioContext.tsx';
import { useAdmin } from '../../context/AdminContext.tsx';
import type { Track } from '../../types/radio.ts';
import {
  Search,
  Play,
  ListPlus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  HardDrive,
  Youtube,
  Globe,
  Filter,
  Check,
  X,
  Music,
} from 'lucide-react';

interface MusicLibrarySectionProps {
  onEditTrack: (track: Track) => void;
}

export const MusicLibrarySection: React.FC<MusicLibrarySectionProps> = ({ onEditTrack }) => {
  const {
    tracks,
    playlists,
    playTrack,
    addToQueue,
    addTrackToPlaylist,
    refreshLibrary,
  } = useRadio();
  const { bulkUpdateTracks, bulkDeleteTracks } = useAdmin();

  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterMetadata, setFilterMetadata] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk operation modals
  const [showBulkPlaylistModal, setShowBulkPlaylistModal] = useState(false);
  const [bulkPlaylistTarget, setBulkPlaylistTarget] = useState('');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deletePhysicalOption, setDeletePhysicalOption] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filtered tracks
  const filtered = useMemo(() => {
    return tracks.filter((t) => {
      const matchSearch =
        search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist.toLowerCase().includes(search.toLowerCase()) ||
        (t.album && t.album.toLowerCase().includes(search.toLowerCase()));

      const matchGenre = filterGenre === 'all' || t.genre.toLowerCase() === filterGenre.toLowerCase();
      const matchSource = filterSource === 'all' || t.source === filterSource;

      let matchFormat = true;
      if (filterFormat !== 'all') {
        const ext = t.audioUrl ? t.audioUrl.split('.').pop()?.toLowerCase() : '';
        matchFormat = ext === filterFormat;
      }

      let matchMeta = true;
      if (filterMetadata === 'missing_album') matchMeta = !t.album || t.album.trim() === '';
      if (filterMetadata === 'missing_artist') matchMeta = !t.artist || t.artist === 'Unknown Artist';

      return matchSearch && matchGenre && matchSource && matchFormat && matchMeta;
    });
  }, [tracks, search, filterGenre, filterFormat, filterSource, filterMetadata]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAddToPlaylist = async () => {
    if (!bulkPlaylistTarget || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await addTrackToPlaylist(bulkPlaylistTarget, id);
    }
    setActionMessage(`Assigned ${selectedIds.length} track(s) to playlist.`);
    setShowBulkPlaylistModal(false);
    setSelectedIds([]);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await bulkDeleteTracks(selectedIds, deletePhysicalOption);
    await refreshLibrary();
    setActionMessage(`Deleted ${selectedIds.length} track(s) from catalog.`);
    setShowBulkDeleteConfirm(false);
    setSelectedIds([]);
    setDeletePhysicalOption(false);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const formatDuration = (secs?: number) => {
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

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-4">
      {/* Header and bulk toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-3 gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Catalog & Music Library Administration
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Manage stored audio binaries, inspect tags, organize playlists, and clean media files
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono">
            <span className="font-bold text-[#c52838]">{selectedIds.length} selected</span>
            <button
              onClick={() => setShowBulkPlaylistModal(true)}
              className="px-2 py-0.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7]"
            >
              Assign Playlist
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-2 py-0.5 border border-[#3e3831] bg-[#fae2e4] text-[#c52838] hover:bg-[#c52838] hover:text-white"
            >
              Bulk Delete
            </button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#e4dfd1]/70 border border-[#3e3831] p-3 flex flex-wrap items-center gap-2.5 text-xs font-mono">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#746b60] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by title, artist, album..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#ece6d8] border border-[#3e3831] pl-8 pr-3 py-1.5 text-[#2d2722] focus:outline-none"
          />
        </div>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
        >
          <option value="all">All Sources</option>
          <option value="local">Local Disk</option>
          <option value="youtube">YouTube</option>
          <option value="direct_url">Direct Stream</option>
        </select>

        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
        >
          <option value="all">All Formats</option>
          <option value="mp3">MP3</option>
          <option value="flac">FLAC</option>
          <option value="opus">Opus</option>
          <option value="ogg">OGG</option>
          <option value="wav">WAV</option>
        </select>

        <select
          value={filterMetadata}
          onChange={(e) => setFilterMetadata(e.target.value)}
          className="bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
        >
          <option value="all">Metadata Status</option>
          <option value="missing_album">Missing Album</option>
          <option value="missing_artist">Missing Artist</option>
        </select>
      </div>

      {/* Main Dense Table */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/30 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#e4dfd1] border-b border-[#3e3831] text-[#746b60] text-[11px] uppercase">
            <tr>
              <th className="p-2.5 w-8 text-center">
                <button onClick={toggleSelectAll} className="flex items-center justify-center">
                  {selectedIds.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#c52838]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3">Title & Artist</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Album</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Genre</th>
              <th className="py-2.5 px-3 text-right">Duration</th>
              <th className="py-2.5 px-3 text-right hidden sm:table-cell">Size</th>
              <th className="py-2.5 px-3 hidden sm:table-cell">Source</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3e3831]/20">
            {filtered.map((track) => {
              const isSelected = selectedIds.includes(track.id);
              const ext = track.audioUrl ? track.audioUrl.split('.').pop()?.toUpperCase() : 'AUDIO';

              return (
                <tr
                  key={track.id}
                  className={`hover:bg-[#e4dfd1]/80 transition-colors ${
                    isSelected ? 'bg-[#e4dfd1] font-medium' : ''
                  }`}
                >
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(track.id)}
                      className="rounded-none border-[#3e3831]"
                    />
                  </td>

                  {/* Title & Artist */}
                  <td className="py-2.5 px-3">
                    <div className="font-serif font-bold text-sm text-[#2d2722] truncate max-w-xs">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#746b60] truncate">
                      {track.artist}
                    </div>
                  </td>

                  {/* Album */}
                  <td className="py-2.5 px-3 hidden md:table-cell text-[#544d44] truncate max-w-[140px]">
                    {track.album || '-'}
                  </td>

                  {/* Genre */}
                  <td className="py-2.5 px-3 hidden lg:table-cell text-[#746b60]">
                    {track.genre}
                  </td>

                  {/* Duration */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#544d44]">
                    {formatDuration(track.duration)}
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell text-[#746b60]">
                    {formatFileSize(track.fileSize)}
                  </td>

                  {/* Source */}
                  <td className="py-2.5 px-3 hidden sm:table-cell">
                    <span className="text-[10px] uppercase border border-[#3e3831]/40 px-1 py-0.5 text-[#746b60]">
                      {track.source === 'local' ? 'DISK' : track.source === 'youtube' ? 'YT' : 'STREAM'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => playTrack(track)}
                        title="Play in radio receiver"
                        className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#c52838] hover:text-white transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={() => addToQueue(track, false)}
                        title="Add to queue"
                        className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7]"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditTrack(track)}
                        title="Edit metadata & cover"
                        className="p-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Assign to Playlist Modal */}
      {showBulkPlaylistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm shadow-xl font-mono text-xs">
            <h3 className="font-serif font-bold text-base text-[#2d2722] mb-2">
              Assign {selectedIds.length} Tracks to Playlist
            </h3>
            <select
              value={bulkPlaylistTarget}
              onChange={(e) => setBulkPlaylistTarget(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] p-2 mb-4"
            >
              <option value="">Select Target Playlist</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkPlaylistModal(false)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1]"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAddToPlaylist}
                disabled={!bulkPlaylistTarget}
                className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831] disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm shadow-xl font-mono text-xs">
            <h3 className="font-serif font-bold text-base text-[#2d2722] mb-2">
              Confirm Bulk Deletion
            </h3>
            <p className="text-[#544d44] mb-3">
              Are you sure you want to delete {selectedIds.length} track(s) from the music library?
            </p>
            <label className="flex items-center gap-2 text-[#c52838] mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={deletePhysicalOption}
                onChange={(e) => setDeletePhysicalOption(e.target.checked)}
                className="rounded-none border-[#3e3831]"
              />
              <span>Also permanently delete underlying files from host disk</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1]"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
