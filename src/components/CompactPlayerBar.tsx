import React from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Radio,
} from 'lucide-react';

interface CompactPlayerBarProps {
  onExpand?: () => void;
  isCollapsed?: boolean;
}

export const CompactPlayerBar: React.FC<CompactPlayerBarProps> = ({
  onExpand,
  isCollapsed = true,
}) => {
  const {
    currentTrack,
    currentStation,
    playbackStatus,
    audioLevels,
    togglePlay,
    nextTrack,
    prevTrack,
    isMuted,
    toggleMute,
  } = useRadio();

  // Name resolution
  const title = currentTrack?.title || currentStation?.name || 'RPLab Radio';
  const artist = currentTrack?.artist || (currentStation?.nowPlaying?.artist) || '';
  const album = currentTrack?.album || '';
  const bitrate = currentTrack?.bitrate ? `${currentTrack.bitrate} kbps` : '320 kbps';
  const format = currentTrack?.format ? currentTrack.format.toUpperCase() : 'MP3';

  // Build subtitle string matching screenshot image.png style
  const isPlaying = playbackStatus === 'playing';
  const isBuffering = playbackStatus === 'buffering';

  return (
    <div
      role="region"
      aria-label="Compact Audio Player"
      className="bg-[#ece6d8] border border-[#3e3831] px-3.5 py-2.5 md:px-4 md:py-3 flex items-center justify-between shadow-[2px_2px_0px_#3e3831] transition-all"
    >
      {/* Left: Music Note Icon & Track / Station Details */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-2">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-[#c52838]" strokeWidth={2.2} />
        </div>

        <div className="overflow-hidden min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-serif font-bold text-[#2d2722] truncate leading-tight">
              {title}
            </h3>
            {currentStation && !currentTrack && (
              <span className="hidden sm:inline px-1.5 py-0.2 text-[10px] font-mono uppercase bg-[#c52838]/10 text-[#c52838] border border-[#c52838]/30">
                Live Broadcast
              </span>
            )}
          </div>

          <div className="text-xs font-mono text-[#746b60] truncate flex items-center gap-1.5 mt-0.5">
            {/* Status */}
            <span>
              {isPlaying
                ? 'radio playing'
                : isBuffering
                ? 'buffering audio stream...'
                : 'radio paused · press play'}
            </span>

            {/* Separator */}
            <span>·</span>

            {/* Bitrate & Format */}
            <span className="text-[#3e3831] font-medium">
              {bitrate} {format}
            </span>

            {/* Artist */}
            {artist && (
              <>
                <span>·</span>
                <span className="truncate">
                  artist: <strong className="font-normal text-[#2d2722]">{artist}</strong>
                </span>
              </>
            )}

            {/* Album */}
            {album && (
              <>
                <span>·</span>
                <span className="hidden md:inline truncate">
                  album: <strong className="font-normal text-[#2d2722]">{album}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Equalizer dots and Player Controls matching screenshot image.png */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Equalizer indicator: 5 subtle red dots/bars like in image.png */}
        <div
          className="flex items-center gap-0.5 px-1.5 py-1"
          title={isPlaying ? 'Audio signal active' : 'Audio paused'}
        >
          {audioLevels.slice(0, 5).map((lvl, index) => (
            <span
              key={index}
              className={`w-1 rounded-none transition-all duration-150 ${
                isPlaying ? 'bg-[#c52838]' : 'bg-[#c52838]/30'
              }`}
              style={{
                height: isPlaying
                  ? `${Math.max(3, Math.min(14, Math.round((lvl / 100) * 14)))}px`
                  : '3px',
              }}
            />
          ))}
        </div>

        {/* Player Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Previous Track */}
          <button
            onClick={prevTrack}
            title="Previous Track (Alt+Left)"
            className="w-7 h-7 hidden sm:flex items-center justify-center border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Red Square Play/Pause Button as in image.png */}
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-8 h-8 bg-[#c52838] hover:bg-[#b02130] active:translate-y-0.5 flex items-center justify-center text-white border border-[#3e3831] transition-colors shadow-xs"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            title="Next Track (Alt+Right)"
            className="w-7 h-7 hidden sm:flex items-center justify-center border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            className={`w-7 h-7 hidden md:flex items-center justify-center border border-[#3e3831] transition-colors ${
              isMuted
                ? 'bg-[#c52838] text-white'
                : 'bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Expand Full Player Button */}
          {onExpand && (
            <button
              onClick={onExpand}
              title="Expand full Kaminari Radio panel"
              className="px-2 py-1 h-8 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] text-xs font-mono hidden sm:flex items-center gap-1 transition-colors"
            >
              <Maximize2 className="w-3 h-3 text-[#c52838]" />
              <span className="text-[11px] font-bold">Expand</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
