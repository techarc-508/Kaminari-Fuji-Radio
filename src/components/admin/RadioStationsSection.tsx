import React, { useState } from 'react';
import { useRadio } from '../../context/RadioContext.tsx';
import type { RadioStation } from '../../types/radio.ts';
import { Radio, Plus, Trash2, Play, Check, AlertCircle } from 'lucide-react';

export const RadioStationsSection: React.FC = () => {
  const { stations, addStation, deleteStation, selectStation, currentStation } = useRadio();

  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [genre, setGenre] = useState('Lo-Fi Chillhop');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) return;

    const ok = await addStation({
      name: name.trim(),
      streamUrl: streamUrl.trim(),
      genre: genre.trim(),
      subtitle: subtitle.trim() || `${name.trim()} · live stream`,
      description: description.trim() || 'Curated ambient radio station preset',
    });

    if (ok) {
      setName('');
      setStreamUrl('');
      setSubtitle('');
      setDescription('');
      setStatusMsg(`Preset "${name.trim()}" added to Radio Receiver.`);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831] space-y-5">
      <div className="border-b border-[#3e3831] pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Radio Receiver Station Presets
          </h2>
          <p className="text-xs font-mono text-[#746b60]">
            Manage continuous audio streams and preset buttons displayed on the main radio receiver
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-2.5 bg-[#e0edd8] border border-[#557b42] text-xs font-mono text-[#2d4b1f] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Existing Stations List */}
      <div className="space-y-2">
        <h3 className="font-mono text-xs font-bold text-[#746b60] uppercase">
          Configured Radio Presets ({stations.length})
        </h3>
        <div className="space-y-2">
          {stations.map((station) => {
            const isActive = currentStation?.id === station.id;
            return (
              <div
                key={station.id}
                className={`p-3 border border-[#3e3831] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                  isActive ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1]/70 text-[#2d2722]'
                }`}
              >
                <div>
                  <div className="font-serif font-bold text-sm">{station.name}</div>
                  <div className={`text-[11px] truncate max-w-md ${isActive ? 'text-white/80' : 'text-[#746b60]'}`}>
                    {station.streamUrl} · {station.genre}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => selectStation(station)}
                    className={`px-2.5 py-1 border border-[#3e3831] text-[11px] flex items-center gap-1 ${
                      isActive ? 'bg-white text-[#c52838] font-bold' : 'bg-[#ece6d8] hover:bg-[#c52838] hover:text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isActive ? 'Active Preset' : 'Test Stream'}</span>
                  </button>

                  <button
                    onClick={() => deleteStation(station.id)}
                    className={`p-1 border border-[#3e3831] ${
                      isActive ? 'bg-white/20 hover:bg-white text-white hover:text-[#c52838]' : 'bg-[#ece6d8] hover:bg-[#fae2e4] text-[#c52838]'
                    }`}
                    title="Remove Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Station Preset Form */}
      <div className="border border-[#3e3831] bg-[#e4dfd1]/40 p-4 space-y-3 font-mono text-xs">
        <h3 className="font-bold text-[#2d2722] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#c52838]" />
          <span>Add Custom Radio Station Preset</span>
        </h3>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#544d44] mb-1">Preset Station Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kyoto Midnight Ambient"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
            <div>
              <label className="block text-[#544d44] mb-1">Direct Stream URL (.mp3 / icecast) *</label>
              <input
                type="url"
                required
                placeholder="https://icecast.example.com/stream.mp3"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#544d44] mb-1">Genre Category</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
            <div>
              <label className="block text-[#544d44] mb-1">Subtitle / Tagline</label>
              <input
                type="text"
                placeholder="e.g. 24/7 Lo-Fi Chillhop · live stream"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-[#ece6d8] border border-[#3e3831] p-1.5 text-[#2d2722]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#3e3831]">
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] font-bold"
            >
              Add Radio Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
