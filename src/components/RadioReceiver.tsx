import React, { useState } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import { AudioVisualizer } from './AudioVisualizer.tsx';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Plus,
  Clock,
  Radio as RadioIcon,
  AlertCircle,
  Activity,
} from 'lucide-react';

interface RadioReceiverProps {
  onOpenAddStream?: () => void;
}

export const RadioReceiver: React.FC<RadioReceiverProps> = ({ onOpenAddStream }) => {
  const {
    currentTrack,
    currentStation,
    playbackStatus,
    errorMessage,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    shuffle,
    isLiveStream,
    audioLevels,
    stations,
    sleepTimerRemaining,
    showSpectrum,
    toggleSpectrum,
    play,
    pause,
    togglePlay,
    selectStation,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    cycleRepeatMode,
    toggleShuffle,
    setSleepTimer,
  } = useRadio();

  const [showSleepDropdown, setShowSleepDropdown] = useState(false);

  // Active display title and artist
  const displayTitle = currentTrack?.title || currentStation?.name || 'Ambient Radio Receiver';
  const displaySubtitle = currentTrack
    ? `${currentTrack.artist}${currentTrack.album ? ` · ${currentTrack.album}` : ''}`
    : currentStation?.nowPlaying?.artist || currentStation?.genre || 'iLoveRadio';

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStatusLabel = () => {
    if (errorMessage) return 'Error';
    switch (playbackStatus) {
      case 'playing':
        return 'Playing';
      case 'buffering':
        return 'Buffering';
      case 'paused':
        return 'Paused';
      default:
        return 'Standby';
    }
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 md:p-6 shadow-[2px_2px_0px_#3e3831] relative">
      {/* Top Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2d2722] tracking-tight">
            Radio receiver
          </h1>
          <p className="text-xs font-mono text-[#746b60] mt-0.5">
            {currentStation?.subtitle || (currentTrack ? `${currentTrack.genre} · track` : 'Lofi Chillhop · live stream')}
          </p>
        </div>

        {/* Top-Right Status & Visualizer Badges */}
        <div className="flex items-center gap-2">
          {/* Visualizer Toggle Button */}
          <button
            onClick={toggleSpectrum}
            title="Toggle Web Audio Spectrum Visualizer"
            className={`border border-[#3e3831] px-2 py-1 text-xs font-mono flex items-center gap-1 transition-colors ${
              showSpectrum
                ? 'bg-[#c52838] text-white font-medium'
                : 'bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Visualizer</span>
          </button>

          {sleepTimerRemaining !== null && (
            <div className="border border-[#3e3831] bg-[#e4dfd1] px-2 py-0.5 text-xs font-mono text-[#c52838] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
            </div>
          )}
          <div
            className={`border border-[#3e3831] px-2.5 py-1 text-xs font-mono uppercase tracking-wider ${
              playbackStatus === 'playing'
                ? 'bg-[#e4dfd1] text-[#2d2722] font-semibold'
                : playbackStatus === 'error'
                ? 'bg-[#c52838] text-white'
                : 'bg-[#e4dfd1]/80 text-[#544d44]'
            }`}
          >
            {getStatusLabel()}
          </div>
        </div>
      </div>

      {/* Main Display Inset Box */}
      <div className="border border-[#3e3831] bg-[#e3ded0]/60 p-4 mb-4 relative flex items-center justify-between">
        <div className="pr-4 overflow-hidden">
          <h2 className="text-lg md:text-xl font-serif font-semibold text-[#2d2722] truncate">
            {displayTitle}
          </h2>
          <p className="text-xs font-mono text-[#746b60] truncate mt-0.5">
            {displaySubtitle}
          </p>
        </div>

        {/* Vintage Equalizer Bars in Red (Clickable to toggle full spectrum) */}
        <div
          onClick={toggleSpectrum}
          className="flex items-end gap-1 shrink-0 h-6 pl-2 cursor-pointer hover:opacity-85 transition-opacity"
          title="Click to toggle full Web Audio spectrum visualizer"
        >
          {audioLevels.map((lvl, index) => (
            <div
              key={index}
              className={`w-1 rounded-none transition-all duration-150 ${
                playbackStatus === 'playing' ? 'bg-[#c52838]' : 'bg-[#c52838]/30'
              }`}
              style={{
                height: playbackStatus === 'playing' ? `${Math.max(4, Math.min(24, Math.round((lvl / 100) * 24)))}px` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Full Web Audio API Real-Time Spectrum Visualizer */}
      {showSpectrum && (
        <div className="mb-4">
          <AudioVisualizer bandsCount={16} height={64} />
        </div>
      )}

      {/* Progress / Seek bar for tracks with known duration */}
      {!isLiveStream && duration > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#746b60] mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="h-2 bg-[#d7d0c1] border border-[#3e3831] relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * duration);
            }}
          >
            <div
              className="h-full bg-[#c52838] relative transition-[width] duration-75"
              style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-3.5 bg-[#241e1a] border border-[#3e3831] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}

      {/* Main Controls Row: Previous | Play/Pause | Next | Volume Slider */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Previous Button */}
        <button
          onClick={prevTrack}
          title="Previous Track or Station (Alt+Left)"
          className="w-9 h-9 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] active:translate-y-0.5 flex items-center justify-center text-[#2d2722] transition-colors"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Play / Pause Red Button */}
        <button
          onClick={togglePlay}
          title={playbackStatus === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
          className="w-10 h-9 bg-[#c52838] hover:bg-[#b02130] active:translate-y-0.5 flex items-center justify-center text-white border border-[#3e3831] transition-colors shadow-sm"
        >
          {playbackStatus === 'playing' ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={nextTrack}
          title="Next Track or Station (Alt+Right)"
          className="w-9 h-9 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] active:translate-y-0.5 flex items-center justify-center text-[#2d2722] transition-colors"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Volume Slider with Red Completed Fill and Dark Square Thumb */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[180px] max-w-[340px]">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="text-[#544d44] hover:text-[#2d2722] transition-colors shrink-0"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="relative flex-1 flex items-center">
            {/* Background rail */}
            <div className="w-full h-[2px] bg-[#beb7a9] absolute top-1/2 -translate-y-1/2" />
            {/* Active red fill */}
            <div
              className="h-[2px] bg-[#c52838] absolute top-1/2 -translate-y-1/2"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
            {/* Custom input slider with black square thumb */}
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="retro-slider w-full relative z-10"
              aria-label="Volume"
            />
          </div>

          <span className="font-mono text-xs font-bold text-[#2d2722] tabular-nums shrink-0 w-8 text-right">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        {/* Secondary controls: Repeat, Shuffle, Sleep Timer */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={cycleRepeatMode}
            title={`Repeat mode: ${repeatMode}`}
            className={`w-7 h-7 border border-[#3e3831] flex items-center justify-center transition-colors text-xs ${
              repeatMode !== 'off' ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1] text-[#544d44] hover:bg-[#dcd6c7]'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleShuffle}
            title={`Shuffle: ${shuffle ? 'On' : 'Off'}`}
            className={`w-7 h-7 border border-[#3e3831] flex items-center justify-center transition-colors text-xs ${
              shuffle ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1] text-[#544d44] hover:bg-[#dcd6c7]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSleepDropdown(!showSleepDropdown)}
              title="Sleep timer"
              className={`w-7 h-7 border border-[#3e3831] flex items-center justify-center transition-colors text-xs ${
                sleepTimerRemaining !== null ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1] text-[#544d44] hover:bg-[#dcd6c7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>

            {showSleepDropdown && (
              <div className="absolute right-0 top-8 z-30 bg-[#ece6d8] border border-[#3e3831] shadow-md p-1.5 min-w-[120px] font-mono text-xs">
                <div className="px-2 py-1 text-[#746b60] border-b border-[#3e3831]/30 mb-1">
                  Sleep Timer
                </div>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setSleepTimer(mins);
                      setShowSleepDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-[#e4dfd1] text-[#2d2722]"
                  >
                    {mins} minutes
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSleepTimer(null);
                    setShowSleepDropdown(false);
                  }}
                  className="w-full text-left px-2 py-1 text-[#c52838] hover:bg-[#e4dfd1] border-t border-[#3e3831]/30 mt-1"
                >
                  Turn off
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preset Stations Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {stations.map((station) => {
          const isActive = currentStation?.id === station.id;
          return (
            <button
              key={station.id}
              onClick={() => selectStation(station)}
              className={`px-3 py-1 text-xs font-mono border border-[#3e3831] transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#c52838] text-white border-[#c52838] font-medium shadow-xs'
                  : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
              }`}
            >
              {station.name}
            </button>
          );
        })}

        {/* "+ stream" button matching Screenshot 1 */}
        {onOpenAddStream && (
          <button
            onClick={onOpenAddStream}
            className="px-2.5 py-1 text-xs font-mono border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] flex items-center gap-1"
          >
            <span>+ stream</span>
          </button>
        )}
      </div>

      {/* Metadata Note at bottom matching screenshot */}
      <div className="text-[11px] font-mono text-[#746b60]">
        {errorMessage ? (
          <span className="text-[#c52838] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errorMessage}
          </span>
        ) : currentStation ? (
          <span>this station publishes no track metadata</span>
        ) : currentTrack ? (
          <span>
            {currentTrack.source === 'local' ? 'local storage · lossless/mp3' : currentTrack.source === 'youtube' ? 'official youtube audio player' : 'authorized direct audio source'}
            {' · '}
            {currentTrack.license || 'royalty-free catalog'}
          </span>
        ) : (
          <span>standby · select a station preset or track from library</span>
        )}
      </div>
    </div>
  );
};
