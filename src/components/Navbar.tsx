'use client';

import React, { useState } from 'react';
import { audioEngine } from '@/lib/audio';
import { Volume2, VolumeX, Sparkles, BookOpen, Layers, Disc3 } from 'lucide-react';
import { TimelineBlock, PitchClass } from '@/types/harmonylab';
import { SEED_VOICINGS } from '@/lib/voicingsDatabase';

interface NavbarProps {
  onLoadPreset: (blocks: TimelineBlock[]) => void;
  onOpenPrintModal: () => void;
}

export const PRESET_PROGRESSIONS = [
  {
    name: 'Neo-Soul 2-5-1-6 Turnaround',
    description: 'Dm9 → G13(b9) → Cmaj9(#11) → A7(#9#5)',
    chordIds: ['m9-butter-e5', 'dom13b9-soul-d5', 'maj9-lydian-e5', 'alt7-sharp9-sharp5-g5'],
  },
  {
    name: 'Stevie Wonder Golden Era',
    description: 'Amaj9 → B7(b9,b13) → Em11 → A7(#11)',
    chordIds: ['maj9-stevie-wonder-csharp5', 'alt7-b9b13-fsharp5', 'm11-sowhat-d5', 'dom7-sharp11-monk-eb5'],
  },
  {
    name: 'Robert Glasper Modern Soul',
    description: 'Bbmaj9 → Gm11 → Fm9 → Dbmaj7(#11)',
    chordIds: ['maj9-robertglasper-f5', 'm11-glasper-cluster-a5', 'm9-rootless-b-c5', 'maj7sharp11-upperstructure-c5'],
  },
  {
    name: 'Maiden Voyage Floating Quartal',
    description: 'D13sus4 → G7sus4(9) → Bb9sus4 → Esus4(b9)',
    chordIds: ['sus-13sus4-a4', 'sus-quartal-d5', 'sus-neo-soul-smooth-e5', 'sus-phrygian-c5'],
  },
];

export const Navbar: React.FC<NavbarProps> = ({ onLoadPreset, onOpenPrintModal }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
  };

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const preset = PRESET_PROGRESSIONS.find((p) => p.name === presetName);
    if (!preset) return;

    const newBlocks: TimelineBlock[] = preset.chordIds.map((id, idx) => {
      const v = SEED_VOICINGS.find((item) => item.id === id) || SEED_VOICINGS[0];
      return {
        id: `preset-${Date.now()}-${idx}`,
        measure: idx + 1,
        beat: 1,
        duration: '1m',
        topNote: v.topNote,
        voicing: v,
      };
    });

    onLoadPreset(newBlocks);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-warm-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
            <Disc3 className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-black tracking-tight text-slate-900">
                HarmonyLab
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                Sick Chords
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
              Top-Note Piano Voicings & Reharmonizer
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Preset Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-warm-100/80 px-2.5 py-1.5 rounded-lg border border-warm-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-600 font-medium shrink-0">Preset:</span>
            <select
              onChange={handleSelectPreset}
              defaultValue={PRESET_PROGRESSIONS[0].name}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-2"
            >
              {PRESET_PROGRESSIONS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={`
              p-2 rounded-lg border transition-all
              ${
                isMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-warm-50 hover:bg-warm-100 border-warm-300 text-slate-700'
              }
            `}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
