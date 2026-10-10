import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.tsx';
import { useRadio } from '../../context/RadioContext.tsx';
import type { VideoInspectResult, VideoInspectEntry, AudioFormat, AudioQuality } from '../../types/admin.ts';
import {
  Download,
  ListPlus,
  Play,
  RotateCcw,
  XCircle,
  Terminal,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  FileAudio,
  Radio,
  Sliders,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';

export const ImportQueueSection: React.FC = () => {
  const {
    jobs,
    inspectUrl,
    startDownloadJob,
    cancelJob,
    retryJob,
  } = useAdmin();
  const { playlists, stations } = useRadio();

  // Form State
  const [urlInput, setUrlInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<AudioFormat>('mp3');
  const [quality, setQuality] = useState<AudioQuality>('320k');
  const [targetPlaylistId, setTargetPlaylistId] = useState('');
  const [autoAddToLibrary, setAutoAddToLibrary] = useState(true);

  // Metadata Overrides
  const [defaultGenre, setDefaultGenre] = useState('Lo-Fi Chillhop');
  const [defaultArtist, setDefaultArtist] = useState('');
  const [defaultAlbum, setDefaultAlbum] = useState('');
  const [defaultTags, setDefaultTags] = useState('ambient, lofi, instrumental');
  const [defaultLicense, setDefaultLicense] = useState('Creative Commons / Authorized Ingestion');

  // Inspection Preview State
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<VideoInspectResult | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Record<string, boolean>>({});
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Job Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Selected job logs modal
  const [activeLogJobId, setActiveLogJobId] = useState<string | null>(null);

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsInspecting(true);
    setInspectError(null);
    setInspectResult(null);

    try {
      const data = await inspectUrl(urlInput.trim());
      setInspectResult(data);

      // Pre-select all entries
      const initialSelection: Record<string, boolean> = {};
      data.entries.forEach((entry) => {
        initialSelection[entry.id] = true;
      });
      setSelectedEntries(initialSelection);

      // Default album name to playlist title if applicable
      if (data.isPlaylist && !defaultAlbum) {
        setDefaultAlbum(data.title);
      }
    } catch (err: any) {
      setInspectError(err.message || 'Inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  const toggleSelectAll = () => {
    if (!inspectResult) return;
    const allSelected = inspectResult.entries.every((e) => selectedEntries[e.id]);
    const updated: Record<string, boolean> = {};
    inspectResult.entries.forEach((e) => {
      updated[e.id] = !allSelected;
    });
    setSelectedEntries(updated);
  };

  const handleStartDownload = async () => {
    if (!inspectResult) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const chosenCount = inspectResult.entries.filter((e) => selectedEntries[e.id]).length;
    if (chosenCount === 0) {
      setSubmitError('Please select at least one entry to download.');
      setIsSubmitting(false);
      return;
    }

    try {
      await startDownloadJob({
        url: urlInput.trim(),
        sourceType: inspectResult.isPlaylist ? 'playlist' : 'video',
        playlistTitle: inspectResult.isPlaylist ? inspectResult.title : undefined,
        totalItems: chosenCount,
        outputFormat,
        quality,
        targetPlaylistId: targetPlaylistId || undefined,
        autoAddToLibrary,
        metadataOverrides: {
          genre: defaultGenre.trim(),
          artist: defaultArtist.trim() || undefined,
          album: defaultAlbum.trim() || undefined,
          tags: defaultTags.split(',').map((t) => t.trim()).filter(Boolean),
          license: defaultLicense.trim(),
        },
      });

      setSubmitSuccess(`Job created! yt-dlp worker started downloading ${chosenCount} audio items.`);
      setUrlInput('');
      setInspectResult(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Could not start download job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeJob = jobs.find((j) => j.id === activeLogJobId);

  return (
    <div className="space-y-6">
      {/* 1. Ingestion Form & Inspection */}
      <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
        <div className="border-b border-[#3e3831] pb-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2d2722]">
              yt-dlp Media Ingestion Engine
            </h2>
            <p className="text-xs font-mono text-[#746b60] mt-0.5">
              Submit single video or playlist URLs for automated background extraction, tagging, and indexing
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#746b60] border border-[#3e3831] px-2.5 py-1 bg-[#e4dfd1]">
            Engine: yt-dlp + FFmpeg (Node.js Worker)
          </div>
        </div>

        {submitSuccess && (
          <div className="mb-4 p-3 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 bg-[#fae2e4] border border-[#c52838] text-xs font-mono text-[#931523] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleInspect} className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-mono text-[#544d44] mb-1 font-semibold">
              YouTube Video or Playlist URL <span className="text-[#c52838]">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-[#e4dfd1] border border-[#3e3831] px-3 py-2 text-xs font-mono text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
              />
              <button
                type="submit"
                disabled={isInspecting || !urlInput.trim()}
                className="px-4 py-2 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isInspecting ? 'Inspecting metadata...' : 'Inspect URL'}</span>
              </button>
            </div>
          </div>

          {inspectError && (
            <div className="p-3 bg-[#fae2e4] border border-[#c52838] text-xs font-mono text-[#931523]">
              Inspection error: {inspectError}
            </div>
          )}

          {/* Inspection Preview Drawer */}
          {inspectResult && (
            <div className="border-2 border-[#3e3831] bg-[#e4dfd1]/80 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3e3831] pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-[#c52838] text-white px-1.5 py-0.5">
                    {inspectResult.isPlaylist ? 'Playlist' : 'Single Video'}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-[#2d2722] mt-1">
                    {inspectResult.title}
                  </h3>
                  <p className="text-xs font-mono text-[#746b60]">
                    Channel: {inspectResult.uploader} · {inspectResult.itemCount} items detected
                  </p>
                </div>

                {inspectResult.isPlaylist && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 border border-[#3e3831] bg-[#ece6d8] text-xs font-mono text-[#2d2722] flex items-center gap-1 hover:bg-[#dcd6c7]"
                  >
                    <span>Toggle Select All</span>
                  </button>
                )}
              </div>

              {/* Playlist Entries Selection List */}
              {inspectResult.isPlaylist && (
                <div className="max-h-56 overflow-y-auto border border-[#3e3831] bg-[#ece6d8] divide-y divide-[#3e3831]/20">
                  {inspectResult.entries.map((entry, idx) => (
                    <label
                      key={entry.id}
                      className="flex items-center justify-between p-2 hover:bg-[#e4dfd1] cursor-pointer text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={!!selectedEntries[entry.id]}
                          onChange={(e) =>
                            setSelectedEntries((prev) => ({
                              ...prev,
                              [entry.id]: e.target.checked,
                            }))
                          }
                          className="rounded-none border-[#3e3831]"
                        />
                        <span className="text-[#746b60] w-6 text-right shrink-0">{idx + 1}.</span>
                        <span className="font-semibold text-[#2d2722] truncate">{entry.title}</span>
                      </div>
                      <span className="text-[11px] text-[#746b60] shrink-0 ml-2">
                        {entry.uploader}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Conversion and Tagging Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-[#3e3831]/40">
                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Audio Format</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as any)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  >
                    <option value="mp3">MP3 (Universal compatibility)</option>
                    <option value="flac">FLAC (Lossless container)</option>
                    <option value="opus">Opus (High efficiency)</option>
                    <option value="ogg">OGG Vorbis</option>
                    <option value="original">Original Best Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Target Bitrate Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  >
                    <option value="320k">320 kbps (High Fidelity)</option>
                    <option value="256k">256 kbps (Standard High)</option>
                    <option value="192k">192 kbps (Balanced)</option>
                    <option value="128k">128 kbps (Compact)</option>
                    <option value="best">VBR Best</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Assign to Playlist</label>
                  <select
                    value={targetPlaylistId}
                    onChange={(e) => setTargetPlaylistId(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  >
                    <option value="">None (Library only)</option>
                    {playlists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#544d44] mb-1 font-semibold">Default Genre</label>
                  <input
                    type="text"
                    value={defaultGenre}
                    onChange={(e) => setDefaultGenre(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  />
                </div>
              </div>

              {/* Optional Metadata Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-[#544d44] mb-1">Artist Override (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Various Ambient Composers"
                    value={defaultArtist}
                    onChange={(e) => setDefaultArtist(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  />
                </div>
                <div>
                  <label className="block text-[#544d44] mb-1">Album Override (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Midnight Tape Vol 1"
                    value={defaultAlbum}
                    onChange={(e) => setDefaultAlbum(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  />
                </div>
                <div>
                  <label className="block text-[#544d44] mb-1">Attribution / License Note</label>
                  <input
                    type="text"
                    value={defaultLicense}
                    onChange={(e) => setDefaultLicense(e.target.value)}
                    className="w-full bg-[#ece6d8] border border-[#3e3831] px-2 py-1.5 text-[#2d2722]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3e3831]">
                <label className="flex items-center gap-2 text-xs font-mono text-[#2d2722] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAddToLibrary}
                    onChange={(e) => setAutoAddToLibrary(e.target.checked)}
                    className="rounded-none border-[#3e3831]"
                  />
                  <span>Automatically index in continuous radio player library</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectResult(null)}
                    className="px-3 py-1.5 border border-[#3e3831] bg-[#ece6d8] text-xs font-mono text-[#2d2722]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartDownload}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono font-bold shadow-xs flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Queueing Worker Job...'
                        : `Start Ingestion (${inspectResult.entries.filter((e) => selectedEntries[e.id]).length} items)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 2. Download Job Queue & Live Status Tracker */}
      <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
        <div className="flex items-center justify-between border-b border-[#3e3831] pb-3 mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#2d2722]">
              Background Download Jobs ({jobs.length})
            </h3>
            <p className="text-xs font-mono text-[#746b60]">
              Real-time worker telemetry synced via Server-Sent Events
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 border border-dashed border-[#3e3831] text-center bg-[#e4dfd1]/40">
            <Download className="w-6 h-6 text-[#746b60] mx-auto mb-2" />
            <p className="text-sm font-serif font-bold text-[#2d2722]">No download jobs queued</p>
            <p className="text-xs font-mono text-[#746b60] mt-1">
              Submit a YouTube URL above to begin downloading audio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const isRunning = job.status === 'downloading' || job.status === 'processing';
              const isFailed = job.status === 'failed';
              const isCompleted = job.status === 'completed';

              return (
                <div
                  key={job.id}
                  className={`border border-[#3e3831] p-4 bg-[#e4dfd1]/70 transition-all ${
                    isRunning ? 'border-l-4 border-l-[#c52838]' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 border border-[#3e3831] ${
                            isRunning
                              ? 'bg-[#c52838] text-white font-bold animate-pulse'
                              : isCompleted
                              ? 'bg-[#e0edd8] text-[#2d4b1f] border-[#557b42]'
                              : isFailed
                              ? 'bg-[#fae2e4] text-[#931523] border-[#c52838]'
                              : 'bg-[#ece6d8] text-[#544d44]'
                          }`}
                        >
                          {job.status}
                        </span>
                        <span className="text-xs font-mono text-[#746b60]">
                          {job.outputFormat.toUpperCase()} · {job.quality}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#2d2722] mt-1">
                        {job.playlistTitle || job.currentItemTitle || job.sourceUrl}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveLogJobId(job.id)}
                        className="px-2 py-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#dcd6c7] text-[11px] font-mono text-[#2d2722] flex items-center gap-1"
                        title="View subprocess terminal logs"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Logs</span>
                      </button>

                      {isRunning && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="px-2.5 py-1 border border-[#3e3831] bg-[#fae2e4] hover:bg-[#c52838] hover:text-white text-[#c52838] text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {isFailed && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="px-2.5 py-1 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#c52838] hover:text-white text-[#2d2722] text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#746b60]">
                      <span>
                        {job.status === 'processing'
                          ? 'FFmpeg converting & tagging...'
                          : job.currentItemTitle
                          ? `Downloading: ${job.currentItemTitle}`
                          : 'Processing stream...'}
                      </span>
                      <span>
                        {job.progressPercent.toFixed(1)}% {job.downloadSpeed ? `· ${job.downloadSpeed}` : ''} {job.eta ? `· ETA ${job.eta}` : ''}
                      </span>
                    </div>

                    <div className="h-2.5 bg-[#dcd6c7] border border-[#3e3831] relative overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isFailed ? 'bg-[#c52838]' : isCompleted ? 'bg-[#557b42]' : 'bg-[#c52838]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, job.progressPercent))}%` }}
                      />
                    </div>
                  </div>

                  {job.errorMessage && (
                    <p className="text-[11px] font-mono text-[#c52838] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{job.errorMessage}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Terminal Logs Modal */}
      {activeJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#221d19] border border-[#3e3831] p-5 w-full max-w-2xl text-[#ece6d8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#c52838]" />
                <h4 className="font-mono font-bold text-xs">
                  Process Output Log · {activeJob.id}
                </h4>
              </div>
              <button
                onClick={() => setActiveLogJobId(null)}
                className="text-[#ece6d8] hover:text-[#c52838]"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/70 p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-1 text-[#b5a999]">
              {activeJob.logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setActiveLogJobId(null)}
                className="px-3 py-1 bg-[#c52838] text-white text-xs font-mono"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
