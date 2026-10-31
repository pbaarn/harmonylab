'use client';

import React, { useState, useMemo } from 'react';
import { Voicing, ChordFamily, PitchClass } from '@/types/harmonylab';
import { PITCH_CLASSES, normalizePitchClass } from '@/lib/theory';
import { getVoicingsForTopNote, SEED_VOICINGS } from '@/lib/voicingsDatabase';
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
} from 'lucide-react';

interface TopNoteReharmonizerProps {
  selectedVoicing: Voicing | null;
  onSelectVoicing: (voicing: Voicing) => void;
  onAddToTimeline: (voicing: Voicing) => void;
  addBass: boolean;
  onToggleAddBass: () => void;
  octaveOffset: number;
  onSetOctaveOffset: (offset: number) => void;
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

export const TopNoteReharmonizer: React.FC<TopNoteReharmonizerProps> = ({
  selectedVoicing,
  onSelectVoicing,
  onAddToTimeline,
  addBass,
  onToggleAddBass,
  octaveOffset,
  onSetOctaveOffset,
}) => {
  const [selectedPitchClass, setSelectedPitchClass] = useState<PitchClass>('E');
  const [selectedOctave, setSelectedOctave] = useState<number>(5);
  const [selectedFamily, setSelectedFamily] = useState<ChordFamily | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSurprising, setIsSurprising] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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
  const handleSurpriseMe = () => {
    if (matchingVoicings.length === 0) return;
    setIsSurprising(true);

    const randomIndex = Math.floor(Math.random() * matchingVoicings.length);
    const surpriseChoice = matchingVoicings[randomIndex];

    onSelectVoicing(surpriseChoice);
    audioEngine.playVoicing(surpriseChoice, { addBass, octaveOffset });

    setTimeout(() => {
      setIsSurprising(false);
    }, 400);
  };

  const handlePlayVoicing = (e: React.MouseEvent, voicing: Voicing) => {
    e.stopPropagation();
    onSelectVoicing(voicing);
    audioEngine.playVoicing(voicing, { addBass, octaveOffset });
  };

  const handleExportMidi = (e: React.MouseEvent, voicing: Voicing) => {
    e.stopPropagation();
    exportVoicingToMidi(voicing, { addBass, octaveOffset });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Filter Bar: Melody Soprano Picker & Controls */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-warm-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                Top-Note Reharmonizer
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your target melody soprano note to discover all matching jazz & soul substitutions.
            </p>
          </div>

          {/* Quick Utility Toggles: Add Bass, Octave Shift, Surprise Me */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Bass Toggle */}
            <button
              type="button"
              onClick={onToggleAddBass}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                ${
                  addBass
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-warm-50 hover:bg-warm-100 text-slate-700 border-warm-300'
                }
              `}
              title="Adds a deep octave root note below the voicing for a full-band feel"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  addBass ? 'bg-amber-400' : 'bg-slate-300'
                }`}
              />
              <span>Add Bass Note</span>
            </button>

            {/* Octave Transpose (-12 / 0 / +12) */}
            <div className="inline-flex items-center rounded-lg border border-warm-300 bg-warm-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onSetOctaveOffset(octaveOffset - 12)}
                disabled={octaveOffset <= -12}
                className={`p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-40 transition`}
                title="Transpose down 1 octave (-12 semitones)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold text-slate-800">
                {octaveOffset === 0 ? '8va Normal' : octaveOffset > 0 ? `+${octaveOffset} st` : `${octaveOffset} st`}
              </span>
              <button
                type="button"
                onClick={() => onSetOctaveOffset(octaveOffset + 12)}
                disabled={octaveOffset >= 12}
                className={`p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-40 transition`}
                title="Transpose up 1 octave (+12 semitones)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Surprise Me Button */}
            <button
              type="button"
              onClick={handleSurpriseMe}
              className={`
                inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all
                ${
                  isSurprising
                    ? 'scale-95 bg-blue-700'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow'
                }
              `}
              title="Pick a random matching chord voicing with this top note and audition it"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Surprise Me!</span>
            </button>

            {/* Add Selected Chord to Progression Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedVoicing) {
                  onAddToTimeline(selectedVoicing);
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 1500);
                }
              }}
              disabled={!selectedVoicing}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border
                ${
                  justAdded
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : selectedVoicing
                    ? 'bg-slate-900 hover:bg-black text-white border-slate-900 shadow-sm active:scale-95'
                    : 'bg-warm-100 text-slate-400 border-warm-200 cursor-not-allowed'
                }
              `}
              title={
                selectedVoicing
                  ? `Add ${selectedVoicing.chordSymbol} to the timeline progression`
                  : 'Select or surprise a chord first'
              }
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Added {selectedVoicing?.chordSymbol}!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Add to Progression
                    {selectedVoicing ? ` (${selectedVoicing.chordSymbol})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pitch Class & Octave Selector */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
              1. Select Melody / Top Note Pitch:
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {PITCH_CLASSES.map((pc) => {
                const isSelected = selectedPitchClass === pc;
                return (
                  <button
                    key={pc}
                    type="button"
                    onClick={() => {
                      setSelectedPitchClass(pc);
                    }}
                    className={`
                      py-2 px-1 text-center rounded-lg text-xs font-bold transition-all
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                          : 'bg-warm-100 hover:bg-warm-200 text-slate-800 border border-warm-200'
                      }
                    `}
                  >
                    {pc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Octave Range Selector */}
          <div className="shrink-0">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
              2. Melody Octave:
            </label>
            <div className="inline-flex rounded-lg border border-warm-300 p-1 bg-warm-100 gap-1">
              {[4, 5, 6].map((oct) => (
                <button
                  key={oct}
                  type="button"
                  onClick={() => setSelectedOctave(oct)}
                  className={`
                    px-3 py-1 rounded text-xs font-bold transition-all
                    ${
                      selectedOctave === oct
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  Octave {oct} ({selectedPitchClass}
                  {oct})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chord Family Pills & Search Filter */}
        <div className="mt-4 pt-3 border-t border-warm-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {FAMILIES.map((family) => {
              const active = selectedFamily === family;
              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => setSelectedFamily(family)}
                  className={`
                    px-2.5 py-1 rounded-md text-xs font-medium transition-all
                    ${
                      active
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-warm-100 hover:bg-warm-200 text-slate-600'
                    }
                  `}
                >
                  {family}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-warm-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Voicings Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-600 font-medium">
          Showing <span className="font-bold text-slate-900">{matchingVoicings.length}</span> voicings with top note{' '}
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {selectedPitchClass}
            {selectedOctave}
          </span>
        </p>
        <span className="text-xs text-slate-400">Click any card to inspect & audition</span>
      </div>

      {/* Voicings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matchingVoicings.map((v) => {
          const isSelected = selectedVoicing?.id === v.id;

          return (
            <div
              key={v.id}
              onClick={() => {
                onSelectVoicing(v);
                audioEngine.playVoicing(v, { addBass, octaveOffset });
              }}
              className={`
                group relative bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between
                ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20 shadow'
                    : 'border-warm-200 hover:border-blue-300'
                }
              `}
            >
              {/* Header: Chord Symbol & Family Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans group-hover:text-blue-600 transition-colors">
                      {v.chordSymbol}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">{v.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {v.family}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Top: {v.topNote}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {v.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 my-2 leading-relaxed">
                    {v.description}
                  </p>
                )}

                {/* Interval Recipe Chips */}
                <div className="flex flex-wrap items-center gap-1 my-2.5">
                  {v.recipe.map((step, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-100 text-slate-700 border border-warm-200"
                    >
                      {step}
                    </span>
                  ))}
                </div>

                {/* Style Tags */}
                <div className="flex flex-wrap items-center gap-1 mb-3">
                  {v.styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-warm-100 flex items-center justify-between gap-2 mt-auto">
                <button
                  type="button"
                  onClick={(e) => handlePlayVoicing(e, v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition"
                  title="Audition Voicing Sound"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Play</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleExportMidi(e, v)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                    title="Export single chord to .mid"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToTimeline(v);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 transition"
                    title="Add this chord to the timeline sequencer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>To Timeline</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {matchingVoicings.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-warm-300 p-12 text-center">
          <Music className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No matching voicings found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try switching family to &quot;All&quot; or selecting a different melody note.
          </p>
        </div>
      )}
    </div>
  );
};
