'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Voicing, ChordFamily, PitchClass } from '@/types/harmonylab';
import { PITCH_CLASSES, calculateIntervalName } from '@/lib/theory';
import { getVoicingsForTopNote } from '@/lib/voicingsDatabase';
import { audioEngine } from '@/lib/audio';
import { exportVoicingToMidi } from '@/lib/midiExport';
import {
  Sparkles,
  Volume2,
  Plus,
  Download,
  Filter,
  Check,
  Music,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  History,
  Play,
  LayoutList,
  LayoutGrid,
  Keyboard,
} from 'lucide-react';

interface TopNoteReharmonizerProps {
  selectedVoicing: Voicing | null;
  onSelectVoicing: (voicing: Voicing) => void;
  onAddToTimeline: (voicing: Voicing) => void;
  addBass: boolean;
  onToggleAddBass: () => void;
  octaveOffset: number;
  onSetOctaveOffset: (offset: number) => void;
  // Controlled props for sync with keyboard overlay & global shortcuts
  selectedPitchClass?: PitchClass;
  onSelectPitchClass?: (pc: PitchClass) => void;
  selectedOctave?: number;
  onSelectOctave?: (oct: number) => void;
  selectedFamily?: ChordFamily | 'All';
  onSelectFamily?: (family: ChordFamily | 'All') => void;
  isKeyboardOverlayOpen?: boolean;
  onToggleKeyboardOverlay?: () => void;
  onTriggerSurprise?: (pc?: PitchClass, oct?: number) => void;
  recentSurprises?: Voicing[];
  onClearRecentSurprises?: () => void;
}

const FAMILIES: (ChordFamily | 'All')[] = [
  'All',
  'Major',
  'Minor',
  'Dominant',
  'Altered',
  'Half-Diminished',
  'Diminished',
  'Suspended',
];

export const PITCH_CLASS_SHORTCUTS: Record<PitchClass, string> = {
  C: 'A',
  'C#': 'W',
  D: 'S',
  Eb: 'E',
  E: 'D',
  F: 'F',
  'F#': 'T',
  G: 'G',
  Ab: 'Y',
  A: 'H',
  Bb: 'U',
  B: 'J',
};

export const TopNoteReharmonizer: React.FC<TopNoteReharmonizerProps> = ({
  selectedVoicing,
  onSelectVoicing,
  onAddToTimeline,
  addBass,
  onToggleAddBass,
  octaveOffset,
  onSetOctaveOffset,
  selectedPitchClass: propPitchClass,
  onSelectPitchClass,
  selectedOctave: propOctave,
  onSelectOctave,
  selectedFamily: propFamily,
  onSelectFamily,
  isKeyboardOverlayOpen,
  onToggleKeyboardOverlay,
  onTriggerSurprise,
  recentSurprises: propRecentSurprises,
  onClearRecentSurprises,
}) => {
  const [internalPitchClass, setInternalPitchClass] = useState<PitchClass>('E');
  const [internalOctave, setInternalOctave] = useState<number>(5);
  const [internalFamily, setInternalFamily] = useState<ChordFamily | 'All'>('All');
  const [internalRecentSurprises, setInternalRecentSurprises] = useState<Voicing[]>([]);

  const selectedPitchClass = propPitchClass ?? internalPitchClass;
  const setSelectedPitchClass = onSelectPitchClass ?? setInternalPitchClass;

  const selectedOctave = propOctave ?? internalOctave;
  const setSelectedOctave = onSelectOctave ?? setInternalOctave;

  const selectedFamily = propFamily ?? internalFamily;
  const setSelectedFamily = onSelectFamily ?? setInternalFamily;

  const recentSurprises = propRecentSurprises ?? internalRecentSurprises;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSurprising, setIsSurprising] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [viewMode, setViewMode] = useState<'column' | 'grid'>('column');

  // Load recent surprises from localStorage on mount if not controlled
  useEffect(() => {
    if (propRecentSurprises !== undefined) return;
    try {
      const saved = localStorage.getItem('harmonylab_recent_surprises');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setInternalRecentSurprises(parsed.slice(0, 6));
        }
      }
    } catch (e) {}
  }, [propRecentSurprises]);

  // Available matching voicings for current top note
  const matchingVoicings = useMemo(() => {
    const list = getVoicingsForTopNote(selectedPitchClass, selectedOctave, selectedFamily);

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (v) =>
        v.chordSymbol.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.root.toLowerCase().includes(q) ||
        v.family.toLowerCase().includes(q) ||
        v.styleTags.some((tag) => tag.toLowerCase().includes(q)) ||
        (v.description && v.description.toLowerCase().includes(q))
    );
  }, [selectedPitchClass, selectedOctave, selectedFamily, searchQuery]);

  // "Surprise Me" Action: pick random voicing for this top note & play it
  const handleSurpriseMe = (overridePitchClass?: PitchClass, overrideOctave?: number) => {
    if (onTriggerSurprise) {
      onTriggerSurprise(overridePitchClass, overrideOctave);
      setIsSurprising(true);
      setTimeout(() => setIsSurprising(false), 300);
      return;
    }

    const pc = overridePitchClass || selectedPitchClass;
    const oct = overrideOctave || selectedOctave;
    const list = getVoicingsForTopNote(pc, oct, selectedFamily);
    const voicingsToPick = list.length > 0 ? list : getVoicingsForTopNote(pc, oct, 'All');
    if (voicingsToPick.length === 0) return;

    setIsSurprising(true);
    const randomIndex = Math.floor(Math.random() * voicingsToPick.length);
    const surpriseChoice = voicingsToPick[randomIndex];

    onSelectVoicing(surpriseChoice);
    audioEngine.playVoicing(surpriseChoice, { addBass, octaveOffset });

    // Track the last 6 chords played by the surprise button
    setInternalRecentSurprises((prev) => {
      const filtered = prev.filter((v) => v.id !== surpriseChoice.id);
      const updated = [surpriseChoice, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('harmonylab_recent_surprises', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setTimeout(() => {
      setIsSurprising(false);
    }, 400);
  };

  const handleAddToProgression = () => {
    if (!selectedVoicing) return;
    onAddToTimeline(selectedVoicing);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handlePlayVoicing = (e: React.MouseEvent, voicing: Voicing) => {
    e.stopPropagation();
    onSelectVoicing(voicing);
    audioEngine.playVoicing(voicing, { addBass, octaveOffset });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Filter Controls Card */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-warm-200">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              FILTER & SEARCH
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Top Note: {selectedPitchClass}{selectedOctave}
            </h3>
          </div>

          {/* Action Buttons: Surprise Me, Add to Progression, Toggle Keyboard */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => handleSurpriseMe()}
              className={`
                inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all
                ${isSurprising ? 'scale-95 bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
              `}
              title="Surprise me with a random voicing under this melody note"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Surprise Me</span>
            </button>

            {/* Add Last Played Chord to Progression */}
            <button
              type="button"
              onClick={handleAddToProgression}
              disabled={!selectedVoicing}
              className={`
                inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all
                ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white disabled:opacity-40'
                }
              `}
              title="Add current chord to progression (Keyboard Shortcut: Space or Enter)"
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
                  <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 bg-black/20 rounded text-[9px] font-mono">
                    Space
                  </kbd>
                </>
              )}
            </button>

            {/* Toggle On-Screen Keyboard Overlay */}
            {onToggleKeyboardOverlay && (
              <button
                type="button"
                onClick={onToggleKeyboardOverlay}
                className={`
                  inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${
                    isKeyboardOverlayOpen
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs ring-1 ring-slate-700'
                      : 'bg-warm-100 hover:bg-warm-200 text-slate-700 border-warm-300'
                  }
                `}
                title="Toggle On-Screen Keyboard Overlay for mouse or touch (Shortcut: \\)"
              >
                <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Keys</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isKeyboardOverlayOpen ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Melody Pitch Class Selector Grid with Computer Keyboard Badges */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              01 • Melody Soprano Pitch:
            </label>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Keys: [A-J] play & surprise
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {PITCH_CLASSES.map((pc) => {
              const isSelected = selectedPitchClass === pc;
              const shortcutKey = PITCH_CLASS_SHORTCUTS[pc];
              return (
                <button
                  key={pc}
                  type="button"
                  onClick={() => setSelectedPitchClass(pc)}
                  className={`
                    py-1.5 px-1 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-300'
                        : 'bg-warm-100 hover:bg-warm-200 text-slate-800 border border-warm-200'
                    }
                  `}
                  title={`Select ${pc} (Press key [${shortcutKey}] on keyboard to surprise)`}
                >
                  <span>{pc}</span>
                  <span
                    className={`text-[9px] font-mono font-normal opacity-60 ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    [{shortcutKey}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Octave Selector & Search Row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Octave:</span>
            {[4, 5, 6].map((oct) => (
              <button
                key={oct}
                type="button"
                onClick={() => setSelectedOctave(oct)}
                className={`
                  px-2 py-1 rounded text-xs font-mono font-bold transition
                  ${
                    selectedOctave === oct
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-warm-100 text-slate-600 hover:bg-warm-200 border border-warm-200'
                  }
                `}
              >
                {oct}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-[170px]">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] pl-7 pr-2 py-1 rounded-lg border border-warm-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Chord Family Pills */}
        <div className="mt-3 pt-2.5 border-t border-warm-200/80">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
            02 • Chord Family:
          </label>
          <div className="flex flex-wrap items-center gap-1">
            {FAMILIES.map((family) => {
              const active = selectedFamily === family;
              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => setSelectedFamily(family)}
                  className={`
                    px-2 py-0.5 rounded text-[11px] font-medium transition-all
                    ${
                      active
                        ? 'bg-slate-800 text-white shadow-2xs font-bold'
                        : 'bg-warm-100 hover:bg-warm-200 text-slate-600'
                    }
                  `}
                >
                  {family}
                </button>
              );
            })}
          </div>
        </div>

        {/* Last 6 Surprise Chords History */}
        {recentSurprises.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-warm-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <History className="w-3 h-3 text-amber-500" />
                Recent Surprises:
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onClearRecentSurprises) {
                    onClearRecentSurprises();
                  } else {
                    setInternalRecentSurprises([]);
                    try {
                      localStorage.removeItem('harmonylab_recent_surprises');
                    } catch (e) {}
                  }
                }}
                className="text-[9px] text-slate-400 hover:text-rose-600 transition"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {recentSurprises.map((chord, idx) => {
                const isSelected = selectedVoicing?.id === chord.id;
                return (
                  <button
                    key={`surprise-${chord.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelectVoicing(chord);
                      audioEngine.playVoicing(chord, { addBass, octaveOffset });
                    }}
                    className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition border
                      ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'bg-warm-50 hover:bg-white text-slate-800 border-warm-300'
                      }
                    `}
                    title={`Audition ${chord.chordSymbol}`}
                  >
                    <span>{chord.chordSymbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Narrow Chords Column (The Red Box in Screenshot) */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-3.5 flex flex-col">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-warm-200 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Voicings ({matchingVoicings.length})
            </h4>
          </div>

          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-warm-200 bg-warm-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('column')}
              className={`p-1 rounded transition ${viewMode === 'column' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="Narrow Column View (Sick Chords Lab style)"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition ${viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="Expanded Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Narrow Scrollable Column Container */}
        {viewMode === 'column' ? (
          <div className="flex flex-col gap-1.5 max-h-[560px] overflow-y-auto pr-1 select-none">
            {matchingVoicings.map((v, idx) => {
              const isSelected = selectedVoicing?.id === v.id;
              const topInterval = calculateIntervalName(v.root, v.topNote);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    onSelectVoicing(v);
                    audioEngine.playVoicing(v, { addBass, octaveOffset });
                  }}
                  className={`
                    group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-200 shadow-2xs'
                        : 'bg-warm-50/60 hover:bg-white border-warm-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Play Button Icon */}
                    <button
                      type="button"
                      onClick={(e) => handlePlayVoicing(e, v)}
                      className={`
                        w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-warm-200/80 group-hover:bg-blue-600 text-slate-600 group-hover:text-white'
                        }
                      `}
                      title="Play Voicing"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>

                    {/* Voicing Index */}
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      #{String(idx + 1).padStart(3, '0')}
                    </span>

                    {/* Chord Symbol & Top Voice Info */}
                    <div className="min-w-0 flex flex-col">
                      <span className={`text-sm font-bold font-sans tracking-tight truncate leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900 group-hover:text-blue-600'}`}>
                        {v.chordSymbol}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                        TOP VOICE: {v.topNote} ({topInterval})
                      </span>
                    </div>
                  </div>

                  {/* Family Tag */}
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-warm-200/70 text-slate-600'}`}>
                    {v.family}
                  </span>
                </div>
              );
            })}

            {matchingVoicings.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                No matching voicings. Try selecting another melody note or family.
              </div>
            )}
          </div>
        ) : (
          /* Expanded Grid View Fallback */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {matchingVoicings.map((v, idx) => {
              const isSelected = selectedVoicing?.id === v.id;
              const topInterval = calculateIntervalName(v.root, v.topNote);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    onSelectVoicing(v);
                    audioEngine.playVoicing(v, { addBass, octaveOffset });
                  }}
                  className={`
                    p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between
                    ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                        : 'bg-warm-50 hover:bg-white border-warm-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block">
                        #{String(idx + 1).padStart(3, '0')}
                      </span>
                      <span className="text-sm font-bold font-sans text-slate-900">
                        {v.chordSymbol}
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-warm-200 text-slate-700">
                      {v.family}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    TOP: {v.topNote} ({topInterval})
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
