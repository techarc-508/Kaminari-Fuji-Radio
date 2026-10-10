import React, { useState } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import type { Playlist } from '../types/radio.ts';
import { Play, Plus, Trash2, Music, Radio as RadioIcon, ArrowRight, X } from 'lucide-react';

interface PlaylistsManagerProps {
  onOpenAddStream?: () => void;
}

export const PlaylistsManager: React.FC<PlaylistsManagerProps> = ({ onOpenAddStream }) => {
  const {
    playlists,
    stations,
    tracks,
    playTrack,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    selectStation,
    currentStation,
  } = useRadio();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');
  const [newPlGenre, setNewPlGenre] = useState('Lo-Fi Chillhop');

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  // Resolve tracks for the active playlist
  const playlistTracks = activePlaylist
    ? activePlaylist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is typeof tracks[0] => t !== undefined)
    : [];

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;

    const created = await createPlaylist(newPlName.trim(), newPlDesc.trim(), newPlGenre.trim());
    if (created) {
      setSelectedPlaylistId(created.id);
      setShowCreateModal(false);
      setNewPlName('');
      setNewPlDesc('');
    }
  };

  const playEntirePlaylist = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0]);
    }
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#3e3831] pb-3 mb-4 gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Stations & Ambient Playlists
          </h2>
          <p className="text-xs font-mono text-[#746b60] mt-0.5">
            Curated personal radio channels and continuous playback programs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddStream && (
            <button
              onClick={onOpenAddStream}
              className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <RadioIcon className="w-3.5 h-3.5 text-[#c52838]" />
              <span>+ Add Live Stream</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Station Playlist</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Playlist List (Left) + Selected Playlist Content (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Playlists column */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-xs font-mono text-[#746b60] uppercase tracking-wider mb-2">
            Configured Playlists ({playlists.length})
          </div>

          <div className="space-y-1.5">
            {playlists.map((pl) => {
              const isSelected = pl.id === selectedPlaylistId;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className={`p-3 border border-[#3e3831] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#c52838] text-white'
                      : 'bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm truncate">
                      {pl.name}
                    </h3>
                    <span
                      className={`text-[11px] font-mono ${
                        isSelected ? 'text-white/80' : 'text-[#746b60]'
                      }`}
                    >
                      {pl.trackIds.length} tracks
                    </span>
                  </div>
                  <p
                    className={`text-xs font-mono truncate mt-0.5 ${
                      isSelected ? 'text-white/90' : 'text-[#746b60]'
                    }`}
                  >
                    {pl.description || pl.genre || 'Custom Ambient Station'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick preset live streams shortcut */}
          <div className="pt-4 border-t border-[#3e3831]/30">
            <div className="text-xs font-mono text-[#746b60] uppercase tracking-wider mb-2">
              Live Broadcast Presets
            </div>
            <div className="space-y-1">
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => selectStation(st)}
                  className={`w-full text-left px-2.5 py-1.5 border border-[#3e3831] text-xs font-mono flex items-center justify-between transition-colors ${
                    currentStation?.id === st.id
                      ? 'bg-[#c52838] text-white font-medium'
                      : 'bg-[#e4dfd1]/60 hover:bg-[#e4dfd1] text-[#2d2722]'
                  }`}
                >
                  <span className="truncate">{st.name}</span>
                  <span className="text-[10px] opacity-75">{st.genre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Playlist Detail (Right) */}
        <div className="md:col-span-2 border border-[#3e3831] bg-[#e4dfd1]/50 p-4">
          {activePlaylist ? (
            <div>
              <div className="flex items-start justify-between border-b border-[#3e3831] pb-3 mb-3">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#2d2722]">
                    {activePlaylist.name}
                  </h3>
                  <p className="text-xs font-mono text-[#746b60] mt-0.5">
                    {activePlaylist.description || 'Ambient continuous playlist'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={playEntirePlaylist}
                    disabled={playlistTracks.length === 0}
                    className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Station</span>
                  </button>

                  <button
                    onClick={() => deletePlaylist(activePlaylist.id)}
                    title="Delete playlist"
                    className="p-1.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#fae2e4] text-[#c52838] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tracks in Playlist */}
              {playlistTracks.length === 0 ? (
                <div className="p-8 border border-dashed border-[#3e3831] text-center bg-[#ece6d8]">
                  <Music className="w-6 h-6 text-[#746b60] mx-auto mb-1.5" />
                  <p className="text-xs font-mono text-[#2d2722] font-semibold">
                    No tracks in this playlist yet
                  </p>
                  <p className="text-[11px] font-mono text-[#746b60] mt-0.5">
                    Go to the Music Library tab and click the "+" icon on any track to add it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {playlistTracks.map((tr, index) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between p-2 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-mono text-[#746b60] w-5 text-right">
                          {index + 1}.
                        </span>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-serif font-bold text-[#2d2722] truncate">
                            {tr.title}
                          </h4>
                          <p className="text-[11px] font-mono text-[#746b60] truncate">
                            {tr.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => playTrack(tr)}
                          className="px-2 py-1 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-[11px] font-mono flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => removeTrackFromPlaylist(activePlaylist.id, tr.id)}
                          title="Remove from playlist"
                          className="p-1 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#fae2e4] text-[#c52838]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-[#746b60]">Select or create a playlist</p>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-sm shadow-lg">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <h3 className="text-base font-serif font-bold text-[#2d2722]">
                Create Station Playlist
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4 text-[#746b60]" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#544d44] mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rainy Day Beats"
                  value={newPlName}
                  onChange={(e) => setNewPlName(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div>
                <label className="block text-[#544d44] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Soft acoustic lo-fi for reading"
                  value={newPlDesc}
                  onChange={(e) => setNewPlDesc(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div>
                <label className="block text-[#544d44] mb-1">Genre Category</label>
                <select
                  value={newPlGenre}
                  onChange={(e) => setNewPlGenre(e.target.value)}
                  className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                >
                  <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                  <option value="Ambient & Drone">Ambient & Drone</option>
                  <option value="Night Drive / Synthwave">Night Drive / Synthwave</option>
                  <option value="Instrumental Jazz">Instrumental Jazz</option>
                  <option value="Calm Piano">Calm Piano</option>
                  <option value="Space & Sci-Fi">Space & Sci-Fi</option>
                  <option value="Deep Focus">Deep Focus</option>
                  <option value="Sleep Sounds">Sleep Sounds</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3e3831]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-[#2d2722]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831]"
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
