'use client';

import React, { useMemo, useState } from 'react';
import { Voicing } from '@/types/harmonylab';
import { midiToNoteName, isBlackKey, calculateIntervalName } from '@/lib/theory';
import { audioEngine } from '@/lib/audio';
import { Sparkles, Music, Volume2, ArrowUp, ArrowDown, Plus, Check } from 'lucide-react';

interface PianoVisualizerProps {
  activeVoicing: Voicing | null;
  addBass?: boolean;
  onToggleAddBass?: () => void;
  octaveOffset?: number;
  onSetOctaveOffset?: (offset: number) => void;
  interactive?: boolean;
  onAddToTimeline?: (voicing: Voicing) => void;
  voicingIndex?: number;
}

// 61-Key range: C2 (MIDI 36) to C7 (MIDI 96)
const START_MIDI = 36;
const END_MIDI = 96;

export const PianoVisualizer: React.FC<PianoVisualizerProps> = ({
  activeVoicing,
  addBass = true,
  onToggleAddBass,
  octaveOffset = 0,
  onSetOctaveOffset,
  interactive = true,
  onAddToTimeline,
  voicingIndex,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  // Determine all currently active MIDI notes
  const { activeNotesSet, topNoteMidi, bassNoteMidi, activeNotesList } = useMemo(() => {
    if (!activeVoicing) {
      return {
        activeNotesSet: new Set<number>(),
        topNoteMidi: null,
        bassNoteMidi: null,
        activeNotesList: [],
      };
    }

    const shiftedNotes = activeVoicing.midiNotes.map((n) => n + octaveOffset);
    const topMidi = shiftedNotes[shiftedNotes.length - 1];

    let bassMidi: number | null = null;
    let fullList = [...shiftedNotes];

    if (addBass) {
      const rawBass = (activeVoicing.bassNoteMidi ?? shiftedNotes[0] - 12) + octaveOffset;
      bassMidi = rawBass > 46 ? rawBass - 12 : rawBass;
      if (!fullList.includes(bassMidi)) {
        fullList.unshift(bassMidi);
      }
    }

    fullList.sort((a, b) => a - b);

    return {
      activeNotesSet: new Set(fullList),
      topNoteMidi: topMidi,
      bassNoteMidi: bassMidi,
      activeNotesList: fullList,
    };
  }, [activeVoicing, addBass, octaveOffset]);

  // Generate piano keys structure
  const { whiteKeys, blackKeys } = useMemo(() => {
    const whites: { midi: number; noteName: string; index: number }[] = [];
    const blacks: { midi: number; noteName: string; whiteIndexBefore: number }[] = [];

    let currentWhiteIndex = 0;
    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const name = midiToNoteName(midi);
      if (isBlackKey(midi)) {
        blacks.push({
          midi,
          noteName: name,
          whiteIndexBefore: currentWhiteIndex - 1,
        });
      } else {
        whites.push({
          midi,
          noteName: name,
          index: currentWhiteIndex,
        });
        currentWhiteIndex++;
      }
    }

    return { whiteKeys: whites, blackKeys: blacks };
  }, []);

  const totalWhites = whiteKeys.length;

  const handleKeyClick = (midi: number) => {
    if (!interactive) return;
    const isTop = midi === topNoteMidi;
    audioEngine.playNote(midi, 1.8, 0.85, isTop);
  };

  const handleAdd = () => {
    if (!activeVoicing || !onAddToTimeline) return;
    onAddToTimeline(activeVoicing);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-4 sm:p-5 transition-all">
      {/* Piano Stage Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-warm-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {voicingIndex !== undefined ? `VOICING #${String(voicingIndex + 1).padStart(3, '0')}` : 'VOICING LAB'}
            </span>
            {activeVoicing && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {activeVoicing.family}
              </span>
            )}
          </div>
          {activeVoicing ? (
            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight">
                {activeVoicing.chordSymbol}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                • Top Voice: <span className="font-mono font-bold text-blue-600">{midiToNoteName(topNoteMidi!)}</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({activeVoicing.name})
              </span>
            </div>
          ) : (
            <h2 className="text-sm font-semibold text-slate-700">Select a chord to inspect</h2>
          )}
        </div>

        {/* Top Badges */}
        {activeVoicing && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 text-white font-medium shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soprano: {midiToNoteName(topNoteMidi!)}</span>
            </div>
            {addBass && bassNoteMidi && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-amber-300 font-medium text-xs">
                <span>Bass: {midiToNoteName(bassNoteMidi)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Piano Keyboard Container */}
      <div className="relative w-full overflow-x-auto pb-2 select-none">
        <div className="relative min-w-[720px] h-48 bg-slate-950 rounded-xl p-1.5 shadow-inner border border-slate-300">
          {/* Classic Piano Fallboard & Red Felt Keybed Strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-xl z-40 border-b border-black">
            <div className="absolute bottom-0 left-1 right-1 h-[2.5px] bg-red-800/90 shadow-2xs" />
          </div>

          {/* White Keys */}
          <div className="flex w-full h-full pt-1.5">
            {whiteKeys.map((k) => {
              const isHeld = activeNotesSet.has(k.midi);
              const isTop = k.midi === topNoteMidi;
              const isBass = k.midi === bassNoteMidi;

              return (
                <button
                  key={k.midi}
                  type="button"
                  onClick={() => handleKeyClick(k.midi)}
                  title={`${k.noteName} (MIDI ${k.midi})`}
                  className={`
                    flex-1 h-full rounded-b-md transition-all duration-75 relative group flex flex-col justify-end items-center pb-2.5
                    border-r border-slate-200 last:border-r-0 shadow-2xs
                    ${
                      isTop
                        ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md ring-2 ring-blue-400 z-10'
                        : isBass
                        ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-400 z-10 font-bold'
                        : isHeld
                        ? 'bg-gradient-to-b from-amber-200 to-amber-300 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-amber-300 z-10 shadow-sm font-bold'
                        : 'bg-gradient-to-b from-white via-white to-slate-50 hover:bg-slate-50 active:bg-blue-50 text-slate-400'
                    }
                  `}
                >
                  {/* Key Label */}
                  {(isHeld || k.noteName.startsWith('C')) && (
                    <span
                      className={`text-[10px] font-mono leading-none tracking-tighter ${
                        isTop
                          ? 'font-bold text-white'
                          : isBass || isHeld
                          ? 'font-bold text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {k.noteName}
                    </span>
                  )}

                  {/* Top Note Accent Ring */}
                  {isTop && (
                    <div className="absolute top-2 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                  )}

                  {/* Bass Note Marker */}
                  {isBass && !isTop && (
                    <div className="absolute top-2 px-1 py-0.5 rounded text-[8px] font-bold bg-slate-900 text-amber-300 leading-none shadow">
                      B
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Black Keys Layer (Proper 64% Piano Height) */}
          <div className="absolute top-2 left-1.5 right-1.5 pointer-events-none h-[64%]">
            {blackKeys.map((bk) => {
              const isHeld = activeNotesSet.has(bk.midi);
              const isTop = bk.midi === topNoteMidi;
              const isBass = bk.midi === bassNoteMidi;

              const whiteWidthPct = 100 / totalWhites;
              const keyWidthPct = whiteWidthPct * 0.62;
              const leftPct = (bk.whiteIndexBefore + 1) * whiteWidthPct - keyWidthPct / 2;

              return (
                <button
                  key={bk.midi}
                  type="button"
                  onClick={() => handleKeyClick(bk.midi)}
                  title={`${bk.noteName} (MIDI ${bk.midi})`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${keyWidthPct}%`,
                  }}
                  className={`
                    absolute top-0 h-full rounded-b-[4px] pointer-events-auto transition-all duration-75 flex flex-col justify-end items-center pb-2.5 shadow-md border-x border-b
                    ${
                      isTop
                        ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white ring-2 ring-blue-300 z-30 border-blue-800'
                        : isBass
                        ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-slate-950 ring-2 ring-amber-300 z-30 border-amber-800 font-bold'
                        : isHeld
                        ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 ring-2 ring-amber-300 z-20 shadow-md font-bold border-amber-600'
                        : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black hover:from-slate-700 hover:to-slate-950 active:bg-blue-900 z-20 text-slate-500 border-black/80'
                    }
                  `}
                >
                  {isHeld && (
                    <span className="text-[9px] font-mono leading-none tracking-tighter text-slate-900 font-bold">
                      {bk.noteName}
                    </span>
                  )}

                  {isTop && (
                    <div className="absolute top-2 w-3 h-3 rounded-full bg-white flex items-center justify-center shadow">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                  )}
                  {isBass && !isTop && (
                    <div className="absolute top-2 px-1 py-0.5 rounded text-[7px] font-bold bg-slate-950 text-amber-300 leading-none shadow">
                      B
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Note Names & Recipe Chips Rows */}
      {activeVoicing ? (
        <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-warm-200">
          {/* Note Names Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 w-24 shrink-0">
              Note Names:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeNotesList.map((midiNote) => {
                const noteName = midiToNoteName(midiNote);
                const isTop = midiNote === topNoteMidi;
                const isBass = midiNote === bassNoteMidi;

                return (
                  <button
                    key={midiNote}
                    type="button"
                    onClick={() => handleKeyClick(midiNote)}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all shadow-2xs
                      ${
                        isTop
                          ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                          : isBass
                          ? 'bg-slate-800 text-amber-300'
                          : 'bg-warm-100 hover:bg-warm-200 text-slate-800 border border-warm-300'
                      }
                    `}
                  >
                    {noteName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chord Recipe Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 w-24 shrink-0">
              Chord Recipe:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeNotesList.map((midiNote) => {
                const noteName = midiToNoteName(midiNote);
                const interval = calculateIntervalName(activeVoicing.root, noteName);
                const isTop = midiNote === topNoteMidi;

                return (
                  <span
                    key={`recipe-${midiNote}`}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-mono font-bold border
                      ${
                        isTop
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-700 border-warm-300'
                      }
                    `}
                  >
                    {interval}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Playback & Voicing Controls Bar */}
          <div className="mt-2 pt-3 border-t border-warm-200 flex flex-wrap items-center justify-between gap-3">
            {/* Play, Arp Up, Arp Down Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => audioEngine.playVoicing(activeVoicing, { addBass, octaveOffset })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow transition-all active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Play Chord</span>
              </button>

              <button
                type="button"
                onClick={() => audioEngine.playArpeggio(activeVoicing, 'up', { addBass, octaveOffset })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-warm-100 hover:bg-warm-200 text-slate-700 border border-warm-300 transition active:scale-95"
                title="Play Arpeggio Upward"
              >
                <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Arp Up</span>
              </button>

              <button
                type="button"
                onClick={() => audioEngine.playArpeggio(activeVoicing, 'down', { addBass, octaveOffset })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-warm-100 hover:bg-warm-200 text-slate-700 border border-warm-300 transition active:scale-95"
                title="Play Arpeggio Downward"
              >
                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Arp Down</span>
              </button>
            </div>

            {/* Bass & Octave Toggles */}
            <div className="flex items-center gap-2">
              {onToggleAddBass && (
                <button
                  type="button"
                  onClick={onToggleAddBass}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs font-medium transition border
                    ${addBass ? 'bg-slate-800 text-white border-slate-800 shadow-2xs' : 'bg-warm-100 text-slate-600 border-warm-300'}
                  `}
                  title="Toggle Deep Bass Root"
                >
                  <span className={addBass ? 'text-amber-300 font-bold' : ''}>+ Bass Note</span>
                </button>
              )}

              {onSetOctaveOffset && (
                <div className="inline-flex items-center rounded-lg border border-warm-300 bg-warm-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onSetOctaveOffset(octaveOffset - 12)}
                    disabled={octaveOffset <= -12}
                    className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30"
                    title="Lower 1 Octave"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-semibold text-slate-700">
                    {octaveOffset === 0 ? '8va' : octaveOffset > 0 ? `+${octaveOffset / 12}` : `${octaveOffset / 12}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSetOctaveOffset(octaveOffset + 12)}
                    disabled={octaveOffset >= 12}
                    className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30"
                    title="Raise 1 Octave"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prominent "+ Add Chord to Progression" Action Bar */}
          {onAddToTimeline && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleAdd}
                className={`
                  w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2
                  ${
                    justAdded
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow'
                  }
                `}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Added {activeVoicing.chordSymbol} to Progression!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>ADD CHORD TO PROGRESSION ({activeVoicing.chordSymbol})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 text-center py-4 text-xs text-slate-400 italic">
          Select or surprise a chord voicing to view notes, intervals, and keyboard layout
        </div>
      )}
    </div>
  );
};
