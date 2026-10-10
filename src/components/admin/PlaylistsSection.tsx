import React, { useState } from 'react';
import { useRadio } from '../../context/RadioContext.tsx';
import type { Playlist, Track } from '../../types/radio.ts';
import {
  ListMusic,
  Plus,
  Radio,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Play,
  Check,
  Sparkles,
} from 'lucide-react';

export const PlaylistsSection: React.FC = () => {
  const {
    playlists,
    tracks,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addStation,
    playTrack,
  } = useRadio();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('Lo-Fi Chillhop');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const playlistTracks = activePlaylist
    ? activePlaylist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined)
    : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const pl = await createPlaylist(newTitle.trim(), 'Admin created station playlist', newGenre);
    if (pl) {
      setSelectedPlaylistId(pl.id);
      setShowCreateModal(false);
      setNewTitle('');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const ids = [...activePlaylist.trackIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;

    const temp = ids[index];
    ids[index] = ids[targetIdx];
    ids[targetIdx] = temp;

    await updatePlaylist(activePlaylist.id, { trackIds: ids });
  };

  const handleShuffleOrder = async () => {
    if (!activePlaylist) return;
    const shuffled = [...activePlaylist.trackIds].sort(() => Math.random() - 0.5);
    await updatePlaylist(activePlaylist.id, { trackIds: shuffled });
    setSuccessMsg('Playlist order randomized.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSortByName = async () => {
    if (!activePlaylist) return;
    const sorted = [...playlistTracks]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((t) => t.id);
    await updatePlaylist(activePlaylist.id, { trackIds: sorted });
  };

  const handleConvertToRadioStation = async () => {
    if (!activePlaylist || playlistTracks.length === 0) return;
    const streamUrl = playlistTracks[0].audioUrl;
    await addStation({
      name: activePlaylist.name,
      streamUrl,
      genre: activePlaylist.genre || 'Ambient Radio',
      subtitle: `${activePlaylist.name} · curated station preset`,
      description: `Radio station created from playlist with ${playlistTracks.length} tracks.`,
    });
    setSuccessMsg(`Created radio preset station "${activePlaylist.name}"! It is now active on the Radio Receiver.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-3 gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Playlists & Station Reconstruction
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Organize imported playlists, reorder track queues, and convert into radio station presets
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Playlists Selection Column */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-xs font-mono text-[#746b60] uppercase mb-1">
            Available Playlists ({playlists.length})
          </div>
          <div className="space-y-1.5">
            {playlists.map((pl) => {
              const isSelected = pl.id === selectedPlaylistId;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className={`p-3 border border-[#3e3831] cursor-pointer text-xs font-mono transition-colors ${
                    isSelected ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722]'
                  }`}
                >
                  <div className="flex justify-between font-serif font-bold text-sm">
                    <span>{pl.name}</span>
                    <span className="text-[11px] font-mono">{pl.trackIds.length} tracks</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-[#746b60]'}`}>
                    {pl.description || pl.genre}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Playlist Tracks & Management (Right) */}
        <div className="md:col-span-2 border border-[#3e3831] bg-[#e4dfd1]/50 p-4 space-y-3">
          {activePlaylist ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-3 mb-3 gap-2">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2d2722]">
                    {activePlaylist.name}
                  </h3>
                  <p className="text-xs font-mono text-[#746b60]">
                    {playlistTracks.length} tracks in active rotation
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleShuffleOrder}
                    className="px-2 py-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-xs font-mono flex items-center gap-1"
                    title="Randomize track sequence"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={handleSortByName}
                    className="px-2 py-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-xs font-mono"
                    title="Sort alphabetically by title"
                  >
                    Sort (A-Z)
                  </button>

                  <button
                    onClick={handleConvertToRadioStation}
                    disabled={playlistTracks.length === 0}
                    className="px-3 py-1 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Radio className="w-3 h-3" />
                    <span>Make Radio Preset</span>
                  </button>
                </div>
              </div>

              {/* Playlist Tracks List */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {playlistTracks.map((tr, idx) => (
                  <div
                    key={`${tr.id}-${idx}`}
                    className="p-2 border border-[#3e3831] bg-[#ece6d8] flex items-center justify-between text-xs font-mono hover:bg-[#e4dfd1] transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[#746b60] w-5 text-right shrink-0">{idx + 1}.</span>
                      <div className="overflow-hidden">
                        <div className="font-serif font-bold text-[#2d2722] truncate">{tr.title}</div>
                        <div className="text-[11px] text-[#746b60] truncate">{tr.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => playTrack(tr)}
                        className="p-1 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#c52838] hover:text-white"
                        title="Play Track"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 border border-[#3e3831] bg-[#e4dfd1] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === playlistTracks.length - 1}
                        className="p-1 border border-[#3e3831] bg-[#e4dfd1] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-[#746b60]">No playlist selected</p>
          )}
        </div>
      </div>

      {/* New Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm font-mono text-xs shadow-xl">
            <h3 className="font-serif font-bold text-base text-[#2d2722] mb-3">
              Create New Playlist
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[#544d44] mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Rainy Beats"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] p-1.5 text-[#2d2722]"
                />
              </div>
              <div>
                <label className="block text-[#544d44] mb-1">Genre Category</label>
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] p-1.5 text-[#2d2722]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#3e3831]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1 border border-[#3e3831] bg-[#e4dfd1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#c52838] text-white border border-[#3e3831]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
