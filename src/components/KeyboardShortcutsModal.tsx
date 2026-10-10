import React from 'react';
import { Keyboard, X, Volume2, SkipForward, SkipBack, Play, Shuffle, Repeat, Activity, Radio } from 'lucide-react';

export interface ShortcutGroup {
  category: string;
  shortcuts: {
    keys: string[];
    description: string;
    actionLabel?: string;
  }[];
}

export const PLAYBACK_SHORTCUTS: ShortcutGroup[] = [
  {
    category: 'Playback Controls',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause playback', actionLabel: 'Toggle Play' },
      { keys: ['Alt', '→'], description: 'Skip to next track in queue or playlist', actionLabel: 'Next' },
      { keys: ['Alt', '←'], description: 'Return to previous track', actionLabel: 'Previous' },
      { keys: ['J'], description: 'Jump back 10 seconds', actionLabel: '-10s' },
      { keys: ['L'], description: 'Jump forward 10 seconds', actionLabel: '+10s' },
    ],
  },
  {
    category: 'Volume & Audio',
    shortcuts: [
      { keys: ['M'], description: 'Mute or unmute master audio', actionLabel: 'Toggle Mute' },
      { keys: ['Alt', '↑'], description: 'Increase volume by 5%', actionLabel: 'Vol +' },
      { keys: ['Alt', '↓'], description: 'Decrease volume by 5%', actionLabel: 'Vol -' },
      { keys: ['V'], description: 'Toggle frequency spectrum visualizer', actionLabel: 'Visualizer' },
    ],
  },
  {
    category: 'Queue & Modes',
    shortcuts: [
      { keys: ['S'], description: 'Toggle shuffle mode', actionLabel: 'Shuffle' },
      { keys: ['R'], description: 'Cycle repeat mode (Off → All → One)', actionLabel: 'Repeat' },
      { keys: ['1' , '–', '9'], description: 'Quick-tune preset radio stations 1 through 9', actionLabel: 'Tune Station' },
    ],
  },
  {
    category: 'General & Navigation',
    shortcuts: [
      { keys: ['?'], description: 'Open this keyboard shortcuts cheat-sheet', actionLabel: 'Shortcuts' },
      { keys: ['Esc'], description: 'Close any active modal or dialog', actionLabel: 'Dismiss' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 bg-[#2d2722]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#ece6d8] border-2 border-[#3e3831] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#3e3831]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#c52838] text-white flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-[#2d2722]">
                Keyboard Shortcuts & Power Controls
              </h2>
              <p className="text-xs font-mono text-[#746b60]">
                Quick playback navigation for power listeners and radio operators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 hover:bg-[#ded8c9] border border-[#3e3831] text-[#2d2722] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLAYBACK_SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#c52838] border-b border-[#ded8c9] pb-1 flex items-center gap-1.5">
                {group.category}
              </h3>
              <ul className="space-y-2 text-xs font-mono">
                {group.shortcuts.map((shortcut, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 p-1.5 bg-[#f5f1e8] border border-[#d8d1c2] hover:border-[#3e3831] transition-colors"
                  >
                    <span className="text-[#3e3831] leading-tight flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {shortcut.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#ece6d8] border border-[#3e3831] shadow-xs text-[#2d2722] min-w-[22px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Note / Hint */}
        <div className="mt-6 pt-3 border-t border-[#ded8c9] flex items-center justify-between text-[11px] font-mono text-[#746b60]">
          <span>Tip: Shortcuts are paused while typing in search or text boxes.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#3e3831] text-[#ece6d8] hover:bg-[#2d2722] transition-colors font-bold"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

interface ShortcutsFooterBarProps {
  onOpenModal: () => void;
}

export function ShortcutsFooterBar({ onOpenModal }: ShortcutsFooterBarProps) {
  return (
    <aside
      aria-label="Playback Keyboard Shortcuts"
      className="border-t border-[#3e3831] bg-[#e4dfd1] px-4 py-2 text-[11px] font-mono text-[#4a4237] flex flex-wrap items-center justify-between gap-y-2 gap-x-4 select-none"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-bold text-[#c52838] uppercase tracking-wider flex items-center gap-1">
          <Keyboard className="w-3 h-3" /> Shortcuts:
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">Space</kbd>
          <span className="text-[#746b60]">Play/Pause</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">M</kbd>
          <span className="text-[#746b60]">Mute</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">←/→</kbd>
          <span className="text-[#746b60]">Prev/Next</span>
        </span>
        <span className="hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">↑/↓</kbd>
          <span className="text-[#746b60]">Volume</span>
        </span>
        <span className="hidden md:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">J/L</kbd>
          <span className="text-[#746b60]">Seek 10s</span>
        </span>
        <span className="hidden md:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 border border-[#3e3831] bg-[#ece6d8] text-[#2d2722] font-bold shadow-xs">V</kbd>
          <span className="text-[#746b60]">Visualizer</span>
        </span>
      </div>

      <button
        onClick={onOpenModal}
        className="ml-auto px-2 py-0.5 border border-[#3e3831] bg-[#ece6d8] hover:bg-[#ded8c9] hover:text-[#c52838] transition-colors flex items-center gap-1 text-[11px] font-bold"
        title="View all keyboard shortcuts (?)"
      >
        <span>All Shortcuts</span>
        <kbd className="px-1 border border-[#3e3831] bg-[#f5f1e8] text-[10px]">?</kbd>
      </button>
    </aside>
  );
}
