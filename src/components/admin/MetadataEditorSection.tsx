import React, { useState, useEffect } from 'react';
import { useRadio } from '../../context/RadioContext.tsx';
import type { Track } from '../../types/radio.ts';
import {
  Edit3,
  Image,
  Upload,
  Check,
  RotateCcw,
  Tag,
  Music,
  ArrowRight,
  AlertCircle,
  FileAudio,
} from 'lucide-react';

interface MetadataEditorSectionProps {
  initialTrack?: Track | null;
  onDone?: () => void;
}

export const MetadataEditorSection: React.FC<MetadataEditorSectionProps> = ({
  initialTrack,
  onDone,
}) => {
  const { tracks, updateTrack } = useRadio();

  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    initialTrack ? initialTrack.id : tracks[0]?.id || ''
  );

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [license, setLicense] = useState('');
  const [tags, setTags] = useState('');
  const [artworkUrl, setArtworkUrl] = useState('');

  // Diff Preview Modal state
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when activeTrack changes
  useEffect(() => {
    if (activeTrack) {
      setTitle(activeTrack.title || '');
      setArtist(activeTrack.artist || '');
      setAlbum(activeTrack.album || '');
      setGenre(activeTrack.genre || 'Ambient');
      setLicense(activeTrack.license || '');
      setTags(activeTrack.tags?.join(', ') || '');
      setArtworkUrl(activeTrack.coverUrl || '');
    }
  }, [activeTrack]);

  const handleSelectTrack = (t: Track) => {
    setSelectedTrackId(t.id);
  };

  const getChangedFields = () => {
    if (!activeTrack) return [];
    const changes: { field: string; oldVal: string; newVal: string }[] = [];

    if (title.trim() !== activeTrack.title) {
      changes.push({ field: 'Title', oldVal: activeTrack.title, newVal: title.trim() });
    }
    if (artist.trim() !== activeTrack.artist) {
      changes.push({ field: 'Artist', oldVal: activeTrack.artist, newVal: artist.trim() });
    }
    if (album.trim() !== (activeTrack.album || '')) {
      changes.push({ field: 'Album', oldVal: activeTrack.album || '(empty)', newVal: album.trim() });
    }
    if (genre.trim() !== activeTrack.genre) {
      changes.push({ field: 'Genre', oldVal: activeTrack.genre, newVal: genre.trim() });
    }
    if (license.trim() !== (activeTrack.license || '')) {
      changes.push({ field: 'License', oldVal: activeTrack.license || '(empty)', newVal: license.trim() });
    }
    return changes;
  };

  const handleConfirmSave = async () => {
    if (!activeTrack) return;
    await updateTrack(activeTrack.id, {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || undefined,
      genre: genre.trim(),
      license: license.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      coverUrl: artworkUrl.trim() || undefined,
    });
    setShowDiffModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onDone) onDone();
  };

  const diffs = getChangedFields();

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-5">
      <div className="border-b border-[#3e3831] pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Metadata & Artwork Editor
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Normalize track tags, assign genres, manage album covers, and review changes
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Track metadata successfully saved to database and audio headers!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Track selector list (Left) */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-xs font-mono text-[#746b60] uppercase tracking-wider mb-2">
            Select Track ({tracks.length})
          </div>
          <div className="max-h-96 overflow-y-auto border border-[#3e3831] bg-[#e4dfd1]/60 divide-y divide-[#3e3831]/20">
            {tracks.map((t) => {
              const isSelected = t.id === selectedTrackId;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTrack(t)}
                  className={`p-2.5 cursor-pointer text-xs font-mono transition-colors ${
                    isSelected ? 'bg-[#c52838] text-white' : 'hover:bg-[#e4dfd1] text-[#2d2722]'
                  }`}
                >
                  <div className="font-serif font-bold truncate">{t.title}</div>
                  <div className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-[#746b60]'}`}>
                    {t.artist} · {t.genre}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Form (Right) */}
        <div className="md:col-span-2 border border-[#3e3831] bg-[#e4dfd1]/50 p-4 space-y-4">
          {activeTrack ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowDiffModal(true);
              }}
              className="space-y-3.5 text-xs font-mono"
            >
              <div className="flex items-center gap-3 border-b border-[#3e3831] pb-3 mb-2">
                <div className="w-12 h-12 border border-[#3e3831] bg-[#ece6d8] flex items-center justify-center text-[#746b60] shrink-0 overflow-hidden">
                  {artworkUrl ? (
                    <img src={artworkUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-6 h-6 text-[#c52838]" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2d2722]">
                    {activeTrack.title}
                  </h3>
                  <p className="text-[11px] text-[#746b60]">
                    File: {activeTrack.storagePath ? activeTrack.storagePath.split('/').pop() : activeTrack.audioUrl}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Track Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                  />
                </div>
                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Artist / Composer *</label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#544d44] mb-1">Album Title</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                  />
                </div>
                <div>
                  <label className="block text-[#544d44] mb-1">Genre Category</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                  >
                    <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                    <option value="Ambient / Space">Ambient / Space</option>
                    <option value="Neo-Classical / Piano">Neo-Classical / Piano</option>
                    <option value="Vaporwave / Synthwave">Vaporwave / Synthwave</option>
                    <option value="Instrumental Jazz">Instrumental Jazz</option>
                    <option value="Sleep / Drone">Sleep / Drone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#544d44] mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div>
                <label className="block text-[#544d44] mb-1">License & Attribution Notes</label>
                <input
                  type="text"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div>
                <label className="block text-[#544d44] mb-1">Cover Artwork URL</label>
                <input
                  type="text"
                  placeholder="https://... or /data/artwork/cover.jpg"
                  value={artworkUrl}
                  onChange={(e) => setArtworkUrl(e.target.value)}
                  className="w-full bg-[#ece6d8] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3e3831]">
                <button
                  type="button"
                  onClick={() => {
                    setTitle(activeTrack.title);
                    setArtist(activeTrack.artist);
                    setAlbum(activeTrack.album || '');
                  }}
                  className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] hover:bg-[#dcd6c7]"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] font-bold"
                >
                  Review & Save Changes
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs font-mono text-[#746b60]">No track selected</p>
          )}
        </div>
      </div>

      {/* Difference / Diff Review Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-md shadow-2xl font-mono text-xs">
            <h3 className="font-serif font-bold text-base text-[#2d2722] mb-1">
              Review Proposed Tag Changes
            </h3>
            <p className="text-[11px] text-[#746b60] mb-3">
              Verify difference changes before committing to catalog
            </p>

            {diffs.length === 0 ? (
              <p className="py-4 text-center text-[#746b60]">No modifications detected.</p>
            ) : (
              <div className="space-y-2 border border-[#3e3831] bg-[#e4dfd1] p-3 mb-4 max-h-56 overflow-y-auto">
                {diffs.map((d, idx) => (
                  <div key={idx} className="border-b border-[#3e3831]/20 pb-1.5 last:border-none">
                    <span className="font-bold text-[#2d2722]">{d.field}:</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="text-[#c52838] line-through">{d.oldVal}</span>
                      <ArrowRight className="w-3 h-3 text-[#746b60]" />
                      <span className="text-[#2d4b1f] font-semibold">{d.newVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1]"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={diffs.length === 0}
                className="px-4 py-1.5 bg-[#c52838] text-white border border-[#3e3831] font-semibold disabled:opacity-50"
              >
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
