import React, { useEffect, useRef, useState } from 'react';
import { useRadio } from '../context/RadioContext.tsx';
import { Activity, BarChart2, Radio as RadioIcon } from 'lucide-react';

interface AudioVisualizerProps {
  bandsCount?: number;
  height?: number;
  variant?: 'spectrum' | 'compact' | 'detailed';
  showLabels?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  bandsCount = 16,
  height = 72,
  variant = 'spectrum',
  showLabels = true,
}) => {
  const { playbackStatus, volume, isMuted, analyser } = useRadio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [displayMode, setDisplayMode] = useState<'bars' | 'wave' | 'peaks'>('bars');
  const peaksRef = useRef<number[]>(new Array(bandsCount).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(bandsCount).fill(0));

  // Audio frequency band labels for vintage spectrum analyzer
  const FREQ_LABELS = ['60', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const fftSize = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(fftSize);
    const waveArray = new Uint8Array(fftSize);

    // Simulated procedural oscillation phase for fallback if CORS prevents raw byte access
    let simPhase = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const isPlaying = playbackStatus === 'playing';
      const effVolume = isMuted ? 0 : volume / 100;

      let hasRealData = false;

      if (analyser && isPlaying && effVolume > 0) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(waveArray);

        // Check if dataArray has non-zero values
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > 0) {
            hasRealData = true;
            break;
          }
        }
      }

      // Group frequencies into bandsCount bins
      const bandValues: number[] = new Array(bandsCount).fill(0);

      if (hasRealData) {
        const binSize = Math.max(1, Math.floor(dataArray.length / bandsCount));
        for (let i = 0; i < bandsCount; i++) {
          let sum = 0;
          const start = i * binSize;
          const end = Math.min(dataArray.length, start + binSize);
          for (let j = start; j < end; j++) {
            sum += dataArray[j];
          }
          const avg = sum / (end - start || 1);
          // Scale from 0-255 to 0-1 with a slight dynamic curve
          bandValues[i] = Math.min(1, Math.pow(avg / 255, 0.9) * (effVolume * 1.1));
        }
      } else if (isPlaying && effVolume > 0) {
        // Fallback procedural acoustic spectrum driven by real volume and audio tempo
        simPhase += 0.08;
        for (let i = 0; i < bandsCount; i++) {
          const freqMultiplier = 1 - (i / bandsCount) * 0.45; // slightly lower highs
          const wave1 = Math.sin(simPhase * 1.5 + i * 0.4);
          const wave2 = Math.cos(simPhase * 2.2 - i * 0.7);
          const wave3 = Math.sin(simPhase * 0.8 + i * 1.1);
          const raw = 0.25 + 0.35 * Math.abs(wave1) + 0.25 * Math.abs(wave2) + 0.15 * Math.abs(wave3);
          bandValues[i] = Math.max(0.05, Math.min(0.95, raw * freqMultiplier * effVolume));
        }
      } else {
        // Paused or silent - gentle resting baseline
        for (let i = 0; i < bandsCount; i++) {
          bandValues[i] = 0.03;
        }
      }

      // Update peaks with smooth gravity falloff
      if (peaksRef.current.length !== bandsCount) {
        peaksRef.current = new Array(bandsCount).fill(0);
        peakDecayRef.current = new Array(bandsCount).fill(0);
      }

      for (let i = 0; i < bandsCount; i++) {
        const cur = bandValues[i];
        if (cur >= peaksRef.current[i]) {
          peaksRef.current[i] = cur;
          peakDecayRef.current[i] = 0;
        } else {
          peakDecayRef.current[i] += 0.003;
          peaksRef.current[i] = Math.max(0, peaksRef.current[i] - peakDecayRef.current[i]);
        }
      }

      // Render based on displayMode
      if (displayMode === 'wave' && isPlaying) {
        // Oscilloscope waveform mode
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#c52838';
        ctx.beginPath();

        const sliceWidth = width / (waveArray.length || 64);
        let x = 0;

        for (let i = 0; i < (waveArray.length || 64); i++) {
          let v = (waveArray[i] || 128) / 128.0;
          if (!hasRealData) {
            v = 1.0 + Math.sin(simPhase * 2 + i * 0.2) * 0.3 * effVolume;
          }
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();

        // Subtle glow line underneath
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#3e3831';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.stroke();
      } else {
        // Frequency Bars mode with peak hold
        const gap = 2;
        const totalGaps = (bandsCount - 1) * gap;
        const barWidth = Math.max(2, (width - totalGaps) / bandsCount);

        for (let i = 0; i < bandsCount; i++) {
          const val = bandValues[i];
          const barHeight = Math.max(2, val * (h - 8));
          const x = i * (barWidth + gap);
          const y = h - barHeight;

          // Vintage segmented retro look
          const segments = Math.floor(barHeight / 4);
          for (let s = 0; s < segments; s++) {
            const segY = h - (s + 1) * 4;
            // Higher segments get crimson red, lower get warm amber/red
            const isHigh = s > segments * 0.75;
            ctx.fillStyle = isHigh ? '#be1e2d' : '#c52838';
            ctx.fillRect(x, segY, barWidth, 3);
          }

          // Solid base line if bar is very small
          if (segments === 0) {
            ctx.fillStyle = isPlaying ? '#c52838' : '#746b60';
            ctx.fillRect(x, h - 2, barWidth, 2);
          }

          // Peak cap indicator (holds highest peak and drops smoothly)
          const peakVal = peaksRef.current[i];
          if (peakVal > 0.05) {
            const peakY = Math.max(1, h - peakVal * (h - 8) - 2);
            ctx.fillStyle = '#221d19'; // dark vintage cap
            ctx.fillRect(x, peakY, barWidth, 1.5);
          }
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, playbackStatus, volume, isMuted, bandsCount, displayMode]);

  return (
    <div className="border border-[#3e3831] bg-[#e4dfd1]/80 p-3 shadow-inner">
      {/* Visualizer header with mode switchers */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#746b60] border-b border-[#3e3831]/30 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-[#2d2722]">
          <Activity className="w-3.5 h-3.5 text-[#c52838]" />
          <span>Real-Time Spectrum Analyzer (Web Audio API)</span>
        </div>

        <div className="flex items-center gap-1 border border-[#3e3831] bg-[#ece6d8] p-0.5">
          <button
            onClick={() => setDisplayMode('bars')}
            className={`px-1.5 py-0.5 text-[10px] ${
              displayMode === 'bars'
                ? 'bg-[#c52838] text-white font-bold'
                : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            Bars
          </button>
          <button
            onClick={() => setDisplayMode('wave')}
            className={`px-1.5 py-0.5 text-[10px] ${
              displayMode === 'wave'
                ? 'bg-[#c52838] text-white font-bold'
                : 'text-[#2d2722] hover:bg-[#dcd6c7]'
            }`}
          >
            Wave
          </button>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="relative bg-[#dcd6c7]/60 border border-[#3e3831]/60 p-1.5">
        {/* Subtle background dB scale lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 opacity-20">
          <div className="border-b border-[#3e3831] w-full" />
          <div className="border-b border-[#3e3831] w-full" />
          <div className="border-b border-[#3e3831] w-full" />
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={height}
          className="w-full h-auto block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Frequency Labels */}
      {showLabels && displayMode === 'bars' && (
        <div className="flex justify-between text-[9px] font-mono text-[#746b60] mt-1.5 px-1 uppercase tracking-tighter">
          {FREQ_LABELS.map((freq) => (
            <span key={freq}>{freq}Hz</span>
          ))}
        </div>
      )}
    </div>
  );
};
