'use client';

import React, { useState } from 'react';
import { Voicing, PitchClass } from '@/types/harmonylab';
import {
  Keyboard as KeyboardIcon,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
} from 'lucide-react';

interface KeyboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPitchClass: PitchClass;
  selectedOctave: number;
  onSelectOctave: (oct: number) => void;
  activeVoicing: Voicing | null;
  onTriggerNote: (pitchClass: PitchClass, octave: number) => void;
  onAddToTimeline: (voicing: Voicing) => void;
  activeKeyId: string | null; // e.g. "C5"
}

interface KeyConfig {
  pitchClass: PitchClass;
  octaveOffset: number; // 0 or +1
  shortcutKey: string;
  isBlack: boolean;
  label: string;
  whiteIndexBefore?: number;
}

export const KEYBOARD_CONFIG: KeyConfig[] = [
  // Base octave
  { pitchClass: 'C', octaveOffset: 0, shortcutKey: 'A', isBlack: false, label: 'C' },
  { pitchClass: 'C#', octaveOffset: 0, shortcutKey: 'W', isBlack: true, label: 'C#', whiteIndexBefore: 0 },
  { pitchClass: 'D', octaveOffset: 0, shortcutKey: 'S', isBlack: false, label: 'D' },
  { pitchClass: 'Eb', octaveOffset: 0, shortcutKey: 'E', isBlack: true, label: 'D#', whiteIndexBefore: 1 },
  { pitchClass: 'E', octaveOffset: 0, shortcutKey: 'D', isBlack: false, label: 'E' },
  { pitchClass: 'F', octaveOffset: 0, shortcutKey: 'F', isBlack: false, label: 'F' },
  { pitchClass: 'F#', octaveOffset: 0, shortcutKey: 'T', isBlack: true, label: 'F#', whiteIndexBefore: 3 },
  { pitchClass: 'G', octaveOffset: 0, shortcutKey: 'G', isBlack: false, label: 'G' },
  { pitchClass: 'Ab', octaveOffset: 0, shortcutKey: 'Y', isBlack: true, label: 'G#', whiteIndexBefore: 4 },
  { pitchClass: 'A', octaveOffset: 0, shortcutKey: 'H', isBlack: false, label: 'A' },
  { pitchClass: 'Bb', octaveOffset: 0, shortcutKey: 'U', isBlack: true, label: 'A#', whiteIndexBefore: 5 },
  { pitchClass: 'B', octaveOffset: 0, shortcutKey: 'J', isBlack: false, label: 'B' },

  // Next octave extension
  { pitchClass: 'C', octaveOffset: 1, shortcutKey: 'K', isBlack: false, label: 'C' },
  { pitchClass: 'C#', octaveOffset: 1, shortcutKey: 'O', isBlack: true, label: 'C#', whiteIndexBefore: 7 },
  { pitchClass: 'D', octaveOffset: 1, shortcutKey: 'L', isBlack: false, label: 'D' },
  { pitchClass: 'Eb', octaveOffset: 1, shortcutKey: 'P', isBlack: true, label: 'D#', whiteIndexBefore: 8 },
];

export const KeyboardOverlay: React.FC<KeyboardOverlayProps> = ({
  isOpen,
  onClose,
  selectedPitchClass,
  selectedOctave,
  onSelectOctave,
  activeVoicing,
  onTriggerNote,
  onAddToTimeline,
  activeKeyId,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const whiteKeys = KEYBOARD_CONFIG.filter((k) => !k.isBlack);
  const blackKeys = KEYBOARD_CONFIG.filter((k) => k.isBlack);
  const totalWhites = whiteKeys.length;

  const handleKeyTrigger = (k: KeyConfig) => {
    const targetOctave = selectedOctave + k.octaveOffset;
    onTriggerNote(k.pitchClass, targetOctave);
  };

  const handleAddClick = () => {
    if (!activeVoicing) return;
    onAddToTimeline(activeVoicing);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl transition-all duration-200 select-none print:hidden"
      style={{ touchAction: 'manipulation' }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 sm:p-4 overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0">
              <KeyboardIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                Audition Keyboard
                <span className="text-[10px] font-mono font-normal text-slate-400 hidden sm:inline">
                  (Press key to surprise top note)
                </span>
              </span>
            </div>
          </div>

          {/* Octave Controls */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Oct:</span>
            <button
              type="button"
              onClick={() => onSelectOctave(Math.max(3, selectedOctave - 1))}
              disabled={selectedOctave <= 3}
              className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-mono font-bold"
              title="Octave Down (Shortcut: Z)"
            >
              -
            </button>
            <span className="px-1.5 font-mono font-bold text-amber-300 text-xs">
              {selectedOctave}
            </span>
            <button
              type="button"
              onClick={() => onSelectOctave(Math.min(6, selectedOctave + 1))}
              disabled={selectedOctave >= 6}
              className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-mono font-bold"
              title="Octave Up (Shortcut: X)"
            >
              +
            </button>
            <span className="text-[9px] text-slate-400 font-mono ml-1 hidden sm:inline">
              [Z / X]
            </span>
          </div>

          {/* Last Played Chord & Add Button */}
          <div className="flex items-center gap-2">
            {activeVoicing && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Last:</span>
                <span className="text-xs font-bold text-amber-300">
                  {activeVoicing.chordSymbol}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({activeVoicing.topNote})
                </span>
              </div>
            )}

            {/* Add to Progression Button */}
            <button
              type="button"
              onClick={handleAddClick}
              disabled={!activeVoicing}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                ${
                  justAdded
                    ? 'bg-emerald-600 text-white scale-95'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white disabled:opacity-40'
                }
              `}
              title="Add current chord to progression (Shortcut: +)"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chord</span>
                  <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-black/30 rounded text-[9px] font-mono">
                    +
                  </kbd>
                </>
              )}
            </button>

            {/* Minimize / Close */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title={isMinimized ? 'Expand Keyboard' : 'Minimize Keyboard'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
              title="Close Overlay (Shortcut: \\ or Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Piano Keys Section */}
        {!isMinimized && (
          <div className="mt-2.5">
            <div className="relative w-full h-32 sm:h-36 bg-slate-950 rounded-xl p-1 shadow-inner border border-slate-800">
              {/* Fallboard red felt cushion strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-xl z-30 border-b border-black">
                <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-red-800" />
              </div>

              {/* White Keys */}
              <div className="flex w-full h-full pt-1">
                {whiteKeys.map((k) => {
                  const keyId = `${k.pitchClass}${selectedOctave + k.octaveOffset}`;
                  const isActive = activeKeyId === keyId;
                  const isCurrentTop =
                    selectedPitchClass === k.pitchClass &&
                    selectedOctave + k.octaveOffset === selectedOctave;

                  return (
                    <button
                      key={keyId}
                      type="button"
                      onMouseDown={() => handleKeyTrigger(k)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleKeyTrigger(k);
                      }}
                      className={`
                        flex-1 h-full rounded-b-md transition-all duration-75 relative flex flex-col justify-end items-center pb-2
                        border-r border-slate-300 last:border-r-0 cursor-pointer
                        ${
                          isActive
                            ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 z-10 translate-y-0.5'
                            : isCurrentTop
                            ? 'bg-blue-50 text-slate-900 ring-2 ring-blue-400 z-10'
                            : 'bg-gradient-to-b from-white via-white to-slate-100 hover:bg-slate-50 active:bg-blue-100 text-slate-800'
                        }
                      `}
                      title={`${k.label}${selectedOctave + k.octaveOffset} (Computer Key: ${k.shortcutKey})`}
                    >
                      <span className="text-[11px] font-bold font-sans leading-none">
                        {k.label}
                      </span>
                      <span className="mt-1 px-1 py-0.5 rounded bg-slate-200/90 text-slate-700 text-[9px] font-mono font-bold leading-none shadow-2xs">
                        {k.shortcutKey}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Black Keys Layer */}
              <div className="absolute top-1.5 left-1 right-1 pointer-events-none h-[62%]">
                {blackKeys.map((bk) => {
                  const keyId = `${bk.pitchClass}${selectedOctave + bk.octaveOffset}`;
                  const isActive = activeKeyId === keyId;
                  const whiteWidthPct = 100 / totalWhites;
                  const keyWidthPct = whiteWidthPct * 0.64;
                  const leftPct =
                    ((bk.whiteIndexBefore ?? 0) + 1) * whiteWidthPct - keyWidthPct / 2;

                  return (
                    <button
                      key={keyId}
                      type="button"
                      onMouseDown={() => handleKeyTrigger(bk)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleKeyTrigger(bk);
                      }}
                      style={{
                        left: `${leftPct}%`,
                        width: `${keyWidthPct}%`,
                      }}
                      className={`
                        absolute top-0 h-full rounded-b-[4px] pointer-events-auto transition-all duration-75 flex flex-col justify-end items-center pb-2 shadow-lg border-x border-b cursor-pointer
                        ${
                          isActive
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300 z-30 translate-y-0.5 border-blue-400'
                            : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black hover:from-slate-700 hover:to-slate-900 active:bg-blue-800 z-20 text-slate-200 border-black'
                        }
                      `}
                      title={`${bk.label}${selectedOctave + bk.octaveOffset} (Computer Key: ${bk.shortcutKey})`}
                    >
                      <span className="text-[10px] font-bold font-sans leading-none">
                        {bk.label}
                      </span>
                      <span className="mt-1 px-1 py-0.5 rounded bg-slate-800/90 text-amber-300 text-[8px] font-mono font-bold leading-none border border-slate-700 shadow-2xs">
                        {bk.shortcutKey}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Keyboard Shortcuts Footer Tip */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">Shortcuts:</span>
                <span>[A-K] Surprise Voicing for Note</span>
                <span>•</span>
                <span>[+] Add Chord</span>
                <span>•</span>
                <span>[Space] Play/Stop</span>
                <span>•</span>
                <span>[Z / X] Octave Down/Up</span>
              </div>
              <div className="hidden sm:block text-slate-500">
                Touch or Click any key to audition instantly
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
