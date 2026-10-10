import React, { useState } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import { Radio as RadioIcon, X, Check } from 'lucide-react';

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({ isOpen, onClose }) => {
  const { addStation } = useRadio();

  const [name, setName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [genre, setGenre] = useState('Ambient / Downtempo');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !streamUrl.trim()) return;

    setIsSubmitting(true);
    const success = await addStation({
      name: name.trim(),
      streamUrl: streamUrl.trim(),
      genre: genre.trim(),
      subtitle: `${name.trim()} · live stream`,
      description: description.trim() || 'Custom live ambient audio stream',
    });
    setIsSubmitting(false);

    if (success) {
      setName('');
      setStreamUrl('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-[#ece6d8] border border-[#3e3831] p-5 w-full max-w-md shadow-[4px_4px_0px_#3e3831]">
        <div className="flex items-center justify-between border-b border-[#3e3831] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <RadioIcon className="w-4 h-4 text-[#c52838]" />
            <h3 className="text-base font-serif font-bold text-[#2d2722]">
              Add New Radio Stream Preset
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#746b60] hover:text-[#2d2722] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
          <div>
            <label className="block text-[#544d44] mb-1">Station Name <span className="text-[#c52838]">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Kyoto Lofi Station"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
          </div>

          <div>
            <label className="block text-[#544d44] mb-1">Direct Stream URL (.mp3 / icecast / shoutcast) <span className="text-[#c52838]">*</span></label>
            <input
              type="url"
              required
              placeholder="https://icecast.example.com/stream"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722] focus:outline-none focus:ring-1 focus:ring-[#c52838]"
            />
          </div>

          <div>
            <label className="block text-[#544d44] mb-1">Genre Category</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722] focus:outline-none"
            >
              <option value="Lo-Fi Chillhop">Lo-Fi Chillhop</option>
              <option value="Ambient / Space">Ambient / Space</option>
              <option value="Vaporwave / Synthwave">Vaporwave / Synthwave</option>
              <option value="Neo-Classical / Piano">Neo-Classical / Piano</option>
              <option value="Instrumental Jazz">Instrumental Jazz</option>
              <option value="Deep Drone">Deep Drone</option>
            </select>
          </div>

          <div>
            <label className="block text-[#544d44] mb-1">Station Description</label>
            <textarea
              rows={2}
              placeholder="Short description of stream contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#e4dfd1] border border-[#3e3831] px-2.5 py-1.5 text-[#2d2722] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3e3831]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#3e3831] bg-[#e4dfd1] text-[#2d2722]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] font-medium transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Save Preset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
