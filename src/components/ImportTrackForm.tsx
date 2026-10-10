import React, { useState } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import { Upload, Youtube, Globe, Check, AlertCircle, HardDrive, Info } from 'lucide-react';

interface ImportTrackFormProps {
  onSuccess?: () => void;
}

export const ImportTrackForm: React.FC<ImportTrackFormProps> = ({ onSuccess }) => {
  const { uploadTrack, importTrack } = useRadio();

  const [activeTab, setActiveTab] = useState<'youtube' | 'direct' | 'upload'>('youtube');

  // YouTube form state
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytArtist, setYtArtist] = useState('');
  const [ytGenre, setYtGenre] = useState('Lo-Fi Chillhop');
  const [ytTags, setYtTags] = useState('lofi, chill, instrumental');

  // Direct URL form state
  const [directUrl, setDirectUrl] = useState('');
  const [directTitle, setDirectTitle] = useState('');
  const [directArtist, setDirectArtist] = useState('');
  const [directGenre, setDirectGenre] = useState('Ambient / Space');
  const [directLicense, setDirectLicense] = useState('Creative Commons CC-BY');

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadGenre, setUploadGenre] = useState('Ambient / Instrumental');
  const [uploadLicense, setUploadLicense] = useState('Personal / Self-Hosted Storage');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleYouTubeImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const success = await importTrack({
      youtubeUrl: ytUrl.trim(),
      title: ytTitle.trim() || undefined,
      artist: ytArtist.trim() || undefined,
      genre: ytGenre.trim(),
      tags: ytTags.split(',').map((t) => t.trim()),
    });

    setIsSubmitting(false);
    if (success) {
      setStatusMessage({ type: 'success', text: 'YouTube stream imported successfully to library!' });
      setYtUrl('');
      setYtTitle('');
      setYtArtist('');
      if (onSuccess) onSuccess();
    } else {
      setStatusMessage({ type: 'error', text: 'Could not parse or import the YouTube URL. Please verify the URL format.' });
    }
  };

  const handleDirectUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const success = await importTrack({
      audioUrl: directUrl.trim(),
      title: directTitle.trim() || undefined,
      artist: directArtist.trim() || undefined,
      genre: directGenre.trim(),
      license: directLicense.trim(),
      source: 'direct_url',
    });

    setIsSubmitting(false);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Direct audio stream added to library!' });
      setDirectUrl('');
      setDirectTitle('');
      setDirectArtist('');
      if (onSuccess) onSuccess();
    } else {
      setStatusMessage({ type: 'error', text: 'Failed to add audio stream URL.' });
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('artist', uploadArtist.trim() || 'Local Artist');
    formData.append('genre', uploadGenre.trim());
    formData.append('license', uploadLicense.trim());

    const success = await uploadTrack(formData);
    setIsSubmitting(false);

    if (success) {
      setStatusMessage({ type: 'success', text: `Uploaded "${file.name}" to server persistent storage (/data/music/)!` });
      setFile(null);
      setUploadTitle('');
      setUploadArtist('');
      if (onSuccess) onSuccess();
    } else {
      setStatusMessage({ type: 'error', text: 'File upload failed. Ensure the file is an audio format (MP3, WAV, FLAC, OGG, M4A).' });
    }
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
      <div className="flex items-center justify-between border-b border-[#3e3831] pb-3 mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Import & Storage Station
          </h2>
          <p className="text-xs font-mono text-[#746b60] mt-0.5">
            Add authorized audio via YouTube URL, Direct Stream, or Local Disk Upload
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 border border-[#3e3831] p-0.5 bg-[#e4dfd1]">
          <button
            onClick={() => { setActiveTab('youtube'); setStatusMessage(null); }}
            className={`px-2.5 py-1 text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === 'youtube' ? 'bg-[#c52838] text-white font-medium' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube URL</span>
          </button>
          <button
            onClick={() => { setActiveTab('direct'); setStatusMessage(null); }}
            className={`px-2.5 py-1 text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === 'direct' ? 'bg-[#c52838] text-white font-medium' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Audio URL</span>
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setStatusMessage(null); }}
            className={`px-2.5 py-1 text-xs font-mono transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-[#c52838] text-white font-medium' : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 border text-xs font-mono flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-[#e0edd8] border-[#557b42] text-[#2d4b1f]'
              : 'bg-[#fae2e4] border-[#c52838] text-[#931523]'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* YouTube Import Form */}
      {activeTab === 'youtube' && (
        <form onSubmit={handleYouTubeImport} className="space-y-3.5">
          <div className="bg-[#e4dfd1]/60 border border-[#3e3831] p-3 text-xs font-mono text-[#544d44] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#c52838] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#2d2722]">Compliance Note: </span>
              In accordance with platform terms and rights, YouTube media plays via the authorized embedded audio player. No DRM circumvention or unauthorized binary ripping is performed.
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#544d44] mb-1">
              YouTube Video URL <span className="text-[#c52838]">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=5qap5aO4i9A or https://youtu.be/..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Custom Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Midnight Rain & Rhodes"
                value={ytTitle}
                onChange={(e) => setYtTitle(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Artist / Composer (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Lofi Dreamer"
                value={ytArtist}
                onChange={(e) => setYtArtist(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Genre</label>
              <select
                value={ytGenre}
                onChange={(e) => setYtGenre(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              >
                <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                <option value="Ambient / Space">Ambient / Space</option>
                <option value="Neo-Classical / Piano">Neo-Classical / Piano</option>
                <option value="Vaporwave / Synthwave">Vaporwave / Synthwave</option>
                <option value="Instrumental Jazz">Instrumental Jazz</option>
                <option value="Sleep / Drone">Sleep / Drone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={ytTags}
                onChange={(e) => setYtTags(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <span>{isSubmitting ? 'Importing stream...' : 'Import to Radio Library'}</span>
          </button>
        </form>
      )}

      {/* Direct URL Form */}
      {activeTab === 'direct' && (
        <form onSubmit={handleDirectUrlImport} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-[#544d44] mb-1">
              Direct Audio Stream URL (.mp3, .ogg, .wav, .aac) <span className="text-[#c52838]">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.org/audio/ambient_track.mp3"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Track Title</label>
              <input
                type="text"
                placeholder="e.g. Lunar Dust Ambient"
                value={directTitle}
                onChange={(e) => setDirectTitle(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Artist</label>
              <input
                type="text"
                placeholder="e.g. Deep Voyager"
                value={directArtist}
                onChange={(e) => setDirectArtist(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Genre</label>
              <select
                value={directGenre}
                onChange={(e) => setDirectGenre(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              >
                <option value="Ambient / Space">Ambient / Space</option>
                <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                <option value="Neo-Classical / Piano">Neo-Classical / Piano</option>
                <option value="Vaporwave / Synthwave">Vaporwave / Synthwave</option>
                <option value="Sleep / Drone">Sleep / Drone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">License / Attribution</label>
              <input
                type="text"
                value={directLicense}
                onChange={(e) => setDirectLicense(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Direct Audio Stream'}
          </button>
        </form>
      )}

      {/* Local File Upload Form */}
      {activeTab === 'upload' && (
        <form onSubmit={handleFileUpload} className="space-y-3.5">
          <div className="border-2 border-dashed border-[#3e3831] p-5 text-center bg-[#e4dfd1]/40 hover:bg-[#e4dfd1]/80 transition-colors">
            <input
              type="file"
              id="audio-upload"
              accept=".mp3,.wav,.ogg,.flac,.m4a,.aac"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  if (!uploadTitle) {
                    setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
              className="hidden"
            />
            <label htmlFor="audio-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-[#746b60] mx-auto mb-2" />
              <p className="text-xs font-mono text-[#2d2722] font-semibold">
                {file ? file.name : 'Click to select audio file or drag and drop'}
              </p>
              <p className="text-[11px] font-mono text-[#746b60] mt-1">
                Supported formats: MP3, FLAC, WAV, OGG, M4A (Max 100MB)
              </p>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Track Title</label>
              <input
                type="text"
                placeholder="e.g. Autumn Rain Tape"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Artist</label>
              <input
                type="text"
                placeholder="e.g. Cozy Tape Co."
                value={uploadArtist}
                onChange={(e) => setUploadArtist(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">Genre</label>
              <select
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              >
                <option value="Ambient / Instrumental">Ambient / Instrumental</option>
                <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
                <option value="Neo-Classical / Piano">Neo-Classical / Piano</option>
                <option value="Vaporwave / Synthwave">Vaporwave / Synthwave</option>
                <option value="Ambient / Drone">Ambient / Drone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#544d44] mb-1">License / Rights</label>
              <input
                type="text"
                value={uploadLicense}
                onChange={(e) => setUploadLicense(e.target.value)}
                className="w-full bg-[#e4dfd1] border border-[#3e3831] px-3 py-1.5 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || isSubmitting}
            className="px-4 py-2 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Storing to disk...' : 'Save File to Self-Hosted Music Volume'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
