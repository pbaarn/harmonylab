'use client';

import React, { useMemo } from 'react';
import { Voicing } from '@/types/harmonylab';
import { midiToNoteName, isBlackKey, calculateIntervalName } from '@/lib/theory';
import { audioEngine } from '@/lib/audio';
import { Sparkles, Music, Volume2 } from 'lucide-react';

interface PianoVisualizerProps {
  activeVoicing: Voicing | null;
  addBass?: boolean;
  octaveOffset?: number;
  interactive?: boolean;
}

// 61-Key range: C2 (MIDI 36) to C7 (MIDI 96)
const START_MIDI = 36;
const END_MIDI = 96;

export const PianoVisualizer: React.FC<PianoVisualizerProps> = ({
  activeVoicing,
  addBass = true,
  octaveOffset = 0,
  interactive = true,
}) => {
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

  return (
    <div className="w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-4 sm:p-6 transition-all">
      {/* Piano Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-warm-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              61-Key Interactive Visualizer
              {activeVoicing && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {activeVoicing.chordSymbol}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Click keys to play • Top soprano voice highlighted with royal blue badge
            </p>
          </div>
        </div>

        {activeVoicing && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 text-white font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top Melody: {midiToNoteName(topNoteMidi!)}</span>
            </div>
            {addBass && bassNoteMidi && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-100 font-medium">
                <span>Bass: {midiToNoteName(bassNoteMidi)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Piano Keyboard Container */}
      <div className="relative w-full overflow-x-auto pb-2 select-none">
        <div className="relative min-w-[720px] h-44 bg-slate-900 rounded-xl p-1.5 shadow-inner border border-slate-300">
          {/* White Keys */}
          <div className="flex w-full h-full">
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
                    flex-1 h-full rounded-b-md transition-all duration-75 relative group flex flex-col justify-end items-center pb-2
                    border-r border-slate-200 last:border-r-0
                    ${
                      isTop
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 z-10'
                        : isBass
                        ? 'bg-slate-700 text-amber-300 ring-2 ring-slate-800 z-10'
                        : isHeld
                        ? 'bg-blue-100 text-blue-900 border-blue-300 z-10 shadow-sm'
                        : 'bg-white hover:bg-slate-50 active:bg-blue-50 text-slate-400'
                    }
                  `}
                >
                  {/* Key Label */}
                  {(isHeld || k.noteName.startsWith('C')) && (
                    <span
                      className={`text-[10px] font-mono leading-none tracking-tighter ${
                        isTop
                          ? 'font-bold text-white'
                          : isBass
                          ? 'font-bold text-amber-200'
                          : isHeld
                          ? 'font-semibold text-blue-800'
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
                    <div className="absolute top-2 px-1 py-0.5 rounded text-[8px] font-bold bg-amber-400 text-slate-900 leading-none shadow">
                      B
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Black Keys Layer */}
          <div className="absolute top-1.5 left-1.5 right-1.5 pointer-events-none h-28">
            {blackKeys.map((bk) => {
              const isHeld = activeNotesSet.has(bk.midi);
              const isTop = bk.midi === topNoteMidi;
              const isBass = bk.midi === bassNoteMidi;

              // Calculate horizontal position
              // Each white key occupies (100% / totalWhites)
              const whiteWidthPct = 100 / totalWhites;
              const leftPct = (bk.whiteIndexBefore + 1) * whiteWidthPct - whiteWidthPct * 0.32;
              const keyWidthPct = whiteWidthPct * 0.64;

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
                    absolute top-0 h-full rounded-b-[4px] pointer-events-auto transition-all duration-75 flex flex-col justify-end items-center pb-2 shadow-md
                    ${
                      isTop
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 z-30'
                        : isBass
                        ? 'bg-slate-800 text-amber-300 ring-2 ring-amber-400 z-30'
                        : isHeld
                        ? 'bg-blue-500 text-white ring-1 ring-blue-300 z-20 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 active:bg-blue-900 z-20 text-slate-500 border border-slate-950'
                    }
                  `}
                >
                  {isHeld && (
                    <span className="text-[9px] font-mono leading-none text-white tracking-tighter">
                      {bk.noteName}
                    </span>
                  )}

                  {/* Top note star marker */}
                  {isTop && (
                    <div className="absolute top-2 w-3 h-3 rounded-full bg-white flex items-center justify-center shadow">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                  )}
                  {isBass && !isTop && (
                    <div className="absolute top-2 px-1 py-0.5 rounded text-[7px] font-bold bg-amber-400 text-slate-900 leading-none shadow">
                      B
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interval Recipe Chips & Notes Bar */}
      {activeVoicing ? (
        <div className="mt-4 pt-3 border-t border-warm-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 mr-1 uppercase tracking-wider">
              Chord Recipe:
            </span>
            {activeNotesList.map((midiNote) => {
              const noteName = midiToNoteName(midiNote);
              const interval = calculateIntervalName(activeVoicing.root, noteName);
              const isTop = midiNote === topNoteMidi;
              const isBass = midiNote === bassNoteMidi;

              return (
                <div
                  key={midiNote}
                  onClick={() => handleKeyClick(midiNote)}
                  className={`
                    cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-sm
                    ${
                      isTop
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isBass
                        ? 'bg-slate-800 text-amber-300 border border-slate-700'
                        : 'bg-warm-100 hover:bg-warm-200 text-slate-800 border border-warm-300'
                    }
                  `}
                >
                  <span className="font-mono font-bold">{noteName}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded ${isTop ? 'bg-blue-700 text-blue-100' : 'bg-warm-200 text-slate-600'}`}>
                    {interval}
                  </span>
                  {isTop && <span className="text-[9px] uppercase font-bold tracking-tight text-blue-100">Melody</span>}
                  {isBass && !isTop && <span className="text-[9px] uppercase font-bold text-amber-300">Bass</span>}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => audioEngine.playVoicing(activeVoicing, { addBass, octaveOffset })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 active:bg-black text-white shadow transition-all shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Audition Voicing</span>
          </button>
        </div>
      ) : (
        <div className="mt-3 text-center py-2 text-xs text-slate-400 italic">
          Select or surprise a chord voicing to view notes, intervals, and keyboard layout
        </div>
      )}
    </div>
  );
};
