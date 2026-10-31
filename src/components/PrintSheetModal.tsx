'use client';

import React from 'react';
import { TimelineBlock, Voicing } from '@/types/harmonylab';
import { midiToNoteName, isBlackKey } from '@/lib/theory';
import { Printer, X, Download, Music } from 'lucide-react';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TimelineBlock[];
  bpm: number;
  addBass: boolean;
  octaveOffset: number;
}

// Mini 2.5-octave piano range for diagram: C3 (48) to G5 (79)
const DIAGRAM_START = 48;
const DIAGRAM_END = 80;

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  blocks,
  bpm,
  addBass,
  octaveOffset,
}) => {
  if (!isOpen) return null;

  const validBlocks = blocks.filter((b) => b.voicing !== null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Top Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-warm-50 print:hidden">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Print & PDF Lead Sheet Preview
              </h2>
              <p className="text-xs text-slate-500">
                Click Print to print or use system destination &quot;Save as PDF&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-warm-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Lead Sheet Body */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {/* Editorial Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">
                  HarmonyLab
                </h1>
                <p className="text-sm font-serif italic text-slate-600 mt-0.5">
                  Top-Note Reharmonization & Voicing Lead Sheet
                </p>
              </div>
              <div className="text-right text-xs font-mono text-slate-600">
                <div>Tempo: {bpm} BPM</div>
                <div>Time: 4/4</div>
                <div>Chords: {validBlocks.length} Measures</div>
              </div>
            </div>
          </div>

          {/* Chords Progression Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-5">
            {validBlocks.map((block, index) => {
              const v = block.voicing!;
              const totalShift = octaveOffset + (block.octaveOffset || 0);
              const shiftedNotes = v.midiNotes.map((n) => n + totalShift);
              const topMidi = shiftedNotes[shiftedNotes.length - 1];

              let allNotes = [...shiftedNotes];
              if (addBass) {
                const rawBass = (v.bassNoteMidi ?? shiftedNotes[0] - 12) + totalShift;
                const bass = rawBass > 46 ? rawBass - 12 : rawBass;
                if (!allNotes.includes(bass)) allNotes.unshift(bass);
              }

              return (
                <div
                  key={block.id}
                  className="rounded-xl border border-slate-300 p-4 bg-white flex flex-col justify-between print:break-inside-avoid print:border-slate-400"
                >
                  {/* Measure Header */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-200 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                        Measure {index + 1}
                      </span>
                      <h2 className="text-2xl font-bold font-serif text-slate-900 leading-tight">
                        {v.chordSymbol}
                      </h2>
                      <p className="text-xs text-slate-500 font-sans">{v.name}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                        Top Note: {midiToNoteName(topMidi)}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                        {v.family}
                      </span>
                    </div>
                  </div>

                  {/* Mini Keyboard Diagram */}
                  <div className="my-2">
                    <MiniKeyboardDiagram
                      activeMidis={allNotes}
                      topMidi={topMidi}
                    />
                  </div>

                  {/* Chord Recipe & Pitches */}
                  <div className="mt-3 pt-2 border-t border-slate-200 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">Recipe:</span>
                      <span className="font-mono text-[11px] text-slate-800">
                        {v.recipe.join(' - ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">Voicing Pitches:</span>
                      <span className="font-mono text-[11px] text-slate-800">
                        {allNotes.map((m) => midiToNoteName(m)).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500 print:mt-6">
            Generated with HarmonyLab • Master Piano Voicings & Reharmonization System
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Clean Mini Piano Keyboard Diagram for Sheet Music
 */
const MiniKeyboardDiagram: React.FC<{ activeMidis: number[]; topMidi: number }> = ({
  activeMidis,
  topMidi,
}) => {
  // 2 Octaves: C3 (48) to B4 (71), or C4 to B5
  const startMidi = 48; // C3
  const endMidi = 72; // C5

  const whiteMidis: number[] = [];
  const blackMidis: { midi: number; whiteIdx: number }[] = [];

  let whiteCount = 0;
  for (let m = startMidi; m <= endMidi; m++) {
    if (isBlackKey(m)) {
      blackMidis.push({ midi: m, whiteIdx: whiteCount - 1 });
    } else {
      whiteMidis.push(m);
      whiteCount++;
    }
  }

  const activeSet = new Set(activeMidis);
  const totalWhites = whiteMidis.length;

  return (
    <div className="relative w-full h-16 bg-slate-100 rounded border border-slate-400 overflow-hidden">
      {/* White Keys */}
      <div className="flex w-full h-full">
        {whiteMidis.map((m) => {
          const isHeld = activeSet.has(m);
          const isTop = m === topMidi;

          return (
            <div
              key={m}
              className={`flex-1 h-full border-r border-slate-300 last:border-r-0 relative flex flex-col justify-end items-center pb-1 ${
                isTop ? 'bg-blue-600' : isHeld ? 'bg-slate-700' : 'bg-white'
              }`}
            >
              {isHeld && (
                <div
                  className={`w-2 h-2 rounded-full ${
                    isTop ? 'bg-white' : 'bg-white'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Black Keys */}
      <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none">
        {blackMidis.map(({ midi, whiteIdx }) => {
          const isHeld = activeSet.has(midi);
          const isTop = midi === topMidi;

          const whiteWidthPct = 100 / totalWhites;
          const leftPct = (whiteIdx + 1) * whiteWidthPct - whiteWidthPct * 0.35;
          const keyWidthPct = whiteWidthPct * 0.7;

          return (
            <div
              key={midi}
              style={{ left: `${leftPct}%`, width: `${keyWidthPct}%` }}
              className={`absolute top-0 h-full rounded-b-[2px] flex flex-col justify-end items-center pb-1 ${
                isTop ? 'bg-blue-600' : isHeld ? 'bg-slate-500' : 'bg-slate-900'
              }`}
            >
              {isHeld && (
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTop ? 'bg-white' : 'bg-white'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
