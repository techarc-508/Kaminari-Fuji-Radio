import React from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import { Play, Trash2, ArrowUp, ArrowDown, Shuffle, Music, Radio as RadioIcon } from 'lucide-react';

export const PlaybackQueue: React.FC = () => {
  const {
    queue,
    currentTrack,
    currentStation,
    playbackStatus,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    toggleShuffle,
    shuffle,
    tracks,
    addToQueue,
  } = useRadio();

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderQueue(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const fillQueueWithAllTracks = () => {
    tracks.forEach((t) => addToQueue(t, false));
  };

  return (
    <div className="bg-[#ece6d8] border border-[#3e3831] p-5 shadow-[2px_2px_0px_#3e3831]">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#3e3831] pb-3 mb-4 gap-2">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2d2722]">
            Playback Queue & Up Next
          </h2>
          <p className="text-xs font-mono text-[#746b60] mt-0.5">
            Active rotation of ambient and instrumental tracks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleShuffle}
            className={`px-2.5 py-1 text-xs font-mono border border-[#3e3831] flex items-center gap-1 transition-colors ${
              shuffle ? 'bg-[#c52838] text-white' : 'bg-[#e4dfd1] text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle Queue</span>
          </button>

          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="px-2.5 py-1 text-xs font-mono border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#fae2e4] text-[#c52838] flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Currently Playing Highlight Banner */}
      <div className="mb-4 p-3 border border-[#3e3831] bg-[#e4dfd1]/80">
        <div className="text-[10px] font-mono uppercase text-[#746b60] tracking-wider mb-1">
          Now Broadcasted
        </div>
        {currentTrack ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif font-bold text-base text-[#2d2722]">
                {currentTrack.title}
              </div>
              <div className="text-xs font-mono text-[#746b60]">
                {currentTrack.artist} · {currentTrack.genre}
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-[#c52838] font-semibold border border-[#c52838] px-2 py-0.5">
              {playbackStatus}
            </span>
          </div>
        ) : currentStation ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif font-bold text-base text-[#2d2722] flex items-center gap-2">
                <RadioIcon className="w-4 h-4 text-[#c52838]" />
                <span>{currentStation.name}</span>
              </div>
              <div className="text-xs font-mono text-[#746b60]">
                {currentStation.subtitle}
              </div>
            </div>
            <span className="text-xs font-mono uppercase text-[#c52838] font-semibold border border-[#c52838] px-2 py-0.5">
              Live Stream
            </span>
          </div>
        ) : (
          <p className="text-xs font-mono text-[#746b60]">No track or stream currently selected.</p>
        )}
      </div>

      {/* Queue Items */}
      {queue.length === 0 ? (
        <div className="border border-dashed border-[#3e3831] p-8 text-center bg-[#e4dfd1]/30">
          <Music className="w-6 h-6 text-[#746b60] mx-auto mb-2" />
          <p className="text-sm font-serif font-bold text-[#2d2722]">Queue is empty</p>
          <p className="text-xs font-mono text-[#746b60] mt-1 mb-3">
            Add tracks from your music library or load all available tracks into queue.
          </p>
          <button
            onClick={fillQueueWithAllTracks}
            className="px-3 py-1.5 bg-[#c52838] hover:bg-[#b02130] text-white border border-[#3e3831] text-xs font-mono transition-colors"
          >
            Load All Library Tracks Into Queue
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {queue.map((track, index) => {
            const isPlayingThis = currentTrack?.id === track.id;
            return (
              <div
                key={`${track.id}-${index}`}
                className={`flex items-center justify-between p-2.5 border border-[#3e3831] transition-colors ${
                  isPlayingThis
                    ? 'bg-[#e4dfd1] font-semibold'
                    : 'bg-[#ece6d8] hover:bg-[#e4dfd1]/60'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-mono text-[#746b60] w-6 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <div className="overflow-hidden">
                    <h4 className="text-xs md:text-sm font-serif font-bold text-[#2d2722] truncate">
                      {track.title}
                    </h4>
                    <p className="text-[11px] font-mono text-[#746b60] truncate">
                      {track.artist} · {track.genre}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => playTrack(track)}
                    className="p-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#c52838] hover:text-white text-[#2d2722] transition-colors"
                    title="Play Now"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>

                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === queue.length - 1}
                    className="p-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#dcd6c7] text-[#2d2722] disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => removeFromQueue(index)}
                    className="p-1.5 border border-[#3e3831] bg-[#e4dfd1] hover:bg-[#fae2e4] text-[#c52838]"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
