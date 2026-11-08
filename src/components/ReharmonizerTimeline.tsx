'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TimelineBlock, Voicing, NoteDuration, PitchClass } from '@/types/harmonylab';
import { PITCH_CLASSES, noteNameToMidi, midiToNoteName } from '@/lib/theory';
import { getVoicingsForTopNote, SEED_VOICINGS } from '@/lib/voicingsDatabase';
import { audioEngine } from '@/lib/audio';
import {
  exportTimelineToMidi,
  generateTimelineMidi,
  generateVoicingMidi,
  handleMidiDragStart,
  revealTimelineInFinder,
  copyTimelineMidiToClipboard,
  revealVoicingInFinder,
} from '@/lib/midiExport';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Plus,
  Trash2,
  Download,
  Volume2,
  Clock,
  Sparkles,
  ChevronDown,
  Printer,
  Sliders,
  ListMusic,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Copy,
  Check,
  Info,
} from 'lucide-react';

interface ReharmonizerTimelineProps {
  blocks: TimelineBlock[];
  onUpdateBlocks: (blocks: TimelineBlock[]) => void;
  onSelectVoicingForInspection: (voicing: Voicing, blockOctaveOffset?: number) => void;
  addBass: boolean;
  octaveOffset: number;
  onOpenPrintModal: () => void;
}

export const ReharmonizerTimeline: React.FC<ReharmonizerTimelineProps> = ({
  blocks,
  onUpdateBlocks,
  onSelectVoicingForInspection,
  addBass,
  octaveOffset,
  onOpenPrintModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(82);
  const [isLooping, setIsLooping] = useState(true);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [finderStatus, setFinderStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Modal / popover for assigning voicing to a block
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentBlockIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Keep ref synchronized
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load BPM and Loop preferences from localStorage
  useEffect(() => {
    try {
      const savedBpm = localStorage.getItem('harmonylab_bpm');
      if (savedBpm) setBpm(Number(savedBpm));
      const savedLoop = localStorage.getItem('harmonylab_loop');
      if (savedLoop !== null) setIsLooping(savedLoop === 'true');
    } catch (e) {}
  }, []);

  // Save BPM and Loop preferences
  useEffect(() => {
    try {
      localStorage.setItem('harmonylab_bpm', bpm.toString());
      localStorage.setItem('harmonylab_loop', isLooping.toString());
    } catch (e) {}
  }, [bpm, isLooping]);

  // Convert block duration to duration in milliseconds based on BPM
  const getBlockDurationMs = (duration: NoteDuration, currentBpm: number) => {
    const beatMs = 60000 / currentBpm;
    switch (duration) {
      case '1m': return beatMs * 4;
      case '2n': return beatMs * 2;
      case '4n': return beatMs * 1;
      default: return beatMs * 4;
    }
  };

  // Play single block and schedule next
  const playStep = (index: number) => {
    if (!isPlayingRef.current || blocks.length === 0) return;

    if (index >= blocks.length) {
      if (isLooping) {
        index = 0;
      } else {
        stopPlayback();
        return;
      }
    }

    currentBlockIdxRef.current = index;
    setActivePlayIndex(index);

    const currentBlock = blocks[index];
    if (currentBlock && currentBlock.voicing) {
      const blockShift = currentBlock.octaveOffset || 0;
      onSelectVoicingForInspection(currentBlock.voicing, blockShift);
      const durSec = getBlockDurationMs(currentBlock.duration, bpm) / 1000;
      audioEngine.playVoicing(currentBlock.voicing, {
        durationSeconds: durSec * 1.2,
        addBass,
        octaveOffset: octaveOffset + blockShift,
      });
    }

    const durationMs = currentBlock ? getBlockDurationMs(currentBlock.duration, bpm) : 2000;

    playbackTimerRef.current = setTimeout(() => {
      playStep(index + 1);
    }, durationMs);
  };

  const startPlayback = () => {
    if (blocks.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    const startIndex = activePlayIndex !== null && activePlayIndex < blocks.length ? activePlayIndex : 0;
    playStep(startIndex);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setActivePlayIndex(null);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Spacebar global keyboard shortcut to start and stop timeline playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent browser scrolling
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, blocks, bpm, isLooping, activePlayIndex, addBass, octaveOffset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, []);

  // Block management
  const handleAddBlock = () => {
    const lastBlock = blocks[blocks.length - 1];
    const newTopNote = lastBlock ? lastBlock.topNote : 'E5';
    const pc = newTopNote.replace(/[0-9]/g, '') as PitchClass;
    const oct = parseInt(newTopNote.replace(/[^0-9]/g, '')) || 5;

    const matching = getVoicingsForTopNote(pc, oct);
    const voicing = matching[0] || null;

    const newBlock: TimelineBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      measure: blocks.length + 1,
      beat: 1,
      duration: '1m',
      topNote: newTopNote,
      voicing,
      octaveOffset: 0,
    };

    onUpdateBlocks([...blocks, newBlock]);
  };

  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateBlocks(blocks.filter((b) => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const handleChangeDuration = (id: string, duration: NoteDuration, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateBlocks(
      blocks.map((b) => (b.id === id ? { ...b, duration } : b))
    );
  };

  // Shift single block octave by delta semitones (-12 / +12)
  const handleShiftBlockOctave = (blockId: string, deltaSemitones: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const currentShift = b.octaveOffset || 0;
      const nextShift = Math.max(-24, Math.min(24, currentShift + deltaSemitones));
      return { ...b, octaveOffset: nextShift };
    });
    onUpdateBlocks(updated);

    const changedBlock = updated.find((b) => b.id === blockId);
    if (changedBlock && changedBlock.voicing) {
      const blockShift = changedBlock.octaveOffset || 0;
      onSelectVoicingForInspection(changedBlock.voicing, blockShift);
      audioEngine.playVoicing(changedBlock.voicing, {
        addBass,
        octaveOffset: octaveOffset + blockShift,
      });
    }
  };

  const handleAssignVoicing = (blockId: string, voicing: Voicing) => {
    onUpdateBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, voicing, topNote: voicing.topNote } : b
      )
    );
    setEditingBlockId(null);
    const targetBlock = blocks.find((b) => b.id === blockId);
    const blockShift = targetBlock?.octaveOffset || 0;
    onSelectVoicingForInspection(voicing, blockShift);
    audioEngine.playVoicing(voicing, { addBass, octaveOffset: octaveOffset + blockShift });
  };

  const handleExportMidi = () => {
    exportTimelineToMidi(blocks, bpm, { addBass, octaveOffset });
  };

  // 1-Click Reveal in Finder for Logic Pro
  const handleRevealInFinder = async () => {
    setFinderStatus('Revealing...');
    const res = await revealTimelineInFinder(blocks, bpm, { addBass, octaveOffset });
    setFinderStatus(res.success ? 'Finder Opened!' : 'Failed');
    setTimeout(() => setFinderStatus(null), 3500);
  };

  // 1-Click Copy real file reference to clipboard
  const handleCopyFile = async () => {
    setCopyStatus('Copying...');
    const res = await copyTimelineMidiToClipboard(blocks, bpm, { addBass, octaveOffset });
    setCopyStatus(res.success ? 'Copied File!' : 'Failed');
    setTimeout(() => setCopyStatus(null), 3000);
  };

  const activeEditingBlock = blocks.find((b) => b.id === editingBlockId);

  return (
    <div className="w-full bg-white rounded-2xl border border-warm-200 shadow-sm p-4 sm:p-6 flex flex-col gap-5">
      {/* Sequencer Transport & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-warm-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Reharmonizer Timeline & Sequencer (4/4)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Construct full progressions. Use <span className="font-semibold text-slate-700">-8va / +8va</span> to shift chord octaves, or reveal in Finder to drag right into Logic Pro.
          </p>
        </div>

        {/* Transport Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* BPM Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-warm-300 bg-warm-50 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-bold text-slate-800">{bpm}</span>
            <span className="text-slate-500">BPM</span>
            <input
              type="range"
              min={50}
              max={160}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-20 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`
              p-2 rounded-lg border transition-all text-xs font-medium
              ${
                isLooping
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-warm-50 border-warm-300 text-slate-500 hover:text-slate-800'
              }
            `}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Stop / Reset */}
          <button
            type="button"
            onClick={stopPlayback}
            className="p-2 rounded-lg border border-warm-300 bg-warm-50 hover:bg-warm-100 text-slate-700 transition"
            title="Reset playhead to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Clear Progression Button */}
          <button
            type="button"
            onClick={() => {
              if (blocks.length === 0) return;
              if (window.confirm('Clear all chords from the progression?')) {
                stopPlayback();
                onUpdateBlocks([]);
              }
            }}
            disabled={blocks.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-warm-300 bg-warm-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-600 disabled:opacity-40 transition text-xs font-medium"
            title="Clear all measures from the progression"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all
              ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
            `}
            title="Toggle Timeline Playback (Shortcut: Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Timeline</span>
              </>
            )}
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 bg-black/25 rounded text-[10px] font-mono leading-none">
              Space
            </kbd>
          </button>

          {/* Logic Pro & Export Suite */}
          <div className="flex items-center gap-2 pl-2 border-l border-warm-200">
            {/* Reveal in Finder for Logic Pro (Solves Logic's POSIX file requirement) */}
            <button
              type="button"
              onClick={handleRevealInFinder}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all
                ${
                  finderStatus === 'Finder Opened!'
                    ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
              title="Creates a real MIDI file on disk and pops open Finder with it highlighted. You can then immediately drag it straight into Logic Pro!"
            >
              {finderStatus === 'Finder Opened!' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Finder Opened! Drag to Logic</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-3.5 h-3.5 text-blue-200" />
                  <span>Reveal in Finder for Logic</span>
                </>
              )}
            </button>

            {/* Copy File to Clipboard */}
            <button
              type="button"
              onClick={handleCopyFile}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-warm-100 hover:bg-warm-200 text-slate-700 border border-warm-300 transition"
              title="Copy the real MIDI file to macOS system clipboard (press ⌘V in Finder / DAW)"
            >
              {copyStatus === 'Copied File!' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy File (⌘C)</span>
                </>
              )}
            </button>

            {/* Direct Drag to Desktop / Finder handle */}
            <div
              draggable={blocks.some((b) => b.voicing !== null)}
              onDragStart={(e) => {
                const midiData = generateTimelineMidi(blocks, bpm, { addBass, octaveOffset });
                if (midiData) {
                  handleMidiDragStart(e, midiData);
                }
              }}
              className="cursor-grab active:cursor-grabbing inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-black text-white shadow-sm transition select-none"
              title="Drag onto your Desktop or Finder folder first, then drop into Logic Pro"
            >
              <GripVertical className="w-3 h-3 text-slate-400" />
              <span>Drag to Desktop</span>
            </div>

            <button
              type="button"
              onClick={handleExportMidi}
              className="p-2 rounded-lg text-xs font-medium bg-warm-100 hover:bg-warm-200 text-slate-700 border border-warm-300 transition"
              title="Download standard .mid file to Downloads folder"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenPrintModal}
              className="p-2 rounded-lg text-xs font-medium bg-warm-100 hover:bg-warm-200 text-slate-700 border border-warm-300 transition"
              title="Print Lead Sheet / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logic Pro Native Drag Tip Banner */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Logic Pro Tip:</span> Apple Logic Pro strictly requires a real local <code className="bg-blue-100 px-1 py-0.2 rounded text-[11px] font-mono text-blue-800">file://</code> on disk and rejects virtual in-browser drags. Click <span className="font-bold">“Reveal in Finder for Logic”</span>: Finder will instantly pop up with your <code className="bg-blue-100 px-1 py-0.2 rounded text-[11px] font-mono text-blue-800">.mid</code> file pre-selected, ready to drag right onto any track in Logic Pro!
        </div>
      </div>

      {/* Measures Blocks Strip */}
      <div className="relative w-full overflow-x-auto pb-4 pt-1">
        <div className="flex items-stretch gap-3 min-w-max">
          {blocks.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-dashed border-warm-300 bg-warm-50/50 w-full min-w-[500px]">
              <div>
                <p className="text-sm font-semibold text-slate-700">Progression is empty</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a chord above and click &quot;Add to Progression&quot;, or click &quot;Add Measure&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBlock}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Measure</span>
              </button>
            </div>
          ) : (
            blocks.map((block, idx) => {
            const isPlayingThis = activePlayIndex === idx;
            const isEditingThis = editingBlockId === block.id;
            const blockShift = block.octaveOffset || 0;

            // Calculate transposed top note for display
            const rawTopMidi = noteNameToMidi(block.topNote);
            const currentTopMidi = rawTopMidi + blockShift;
            const displayedTopNote = midiToNoteName(currentTopMidi);

            return (
              <div
                key={block.id}
                onClick={() => {
                  if (block.voicing) {
                    onSelectVoicingForInspection(block.voicing, blockShift);
                    audioEngine.playVoicing(block.voicing, {
                      addBass,
                      octaveOffset: octaveOffset + blockShift,
                    });
                  }
                  setEditingBlockId(block.id);
                }}
                className={`
                  relative w-56 rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between select-none
                  ${
                    isPlayingThis
                      ? 'border-blue-600 ring-4 ring-blue-100 bg-blue-50/60 shadow-md scale-102'
                      : isEditingThis
                      ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/20 shadow-sm'
                      : 'border-warm-200 bg-warm-50/50 hover:bg-white hover:border-slate-300 shadow-sm'
                  }
                `}
              >
                {/* Top Bar: Measure number & duration selector */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      M{idx + 1}
                    </span>
                    {isPlayingThis && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>

                  {/* Duration switcher */}
                  <div className="inline-flex rounded-md border border-warm-300 bg-white p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={(e) => handleChangeDuration(block.id, '1m', e)}
                      className={`px-1.5 py-0.5 rounded ${block.duration === '1m' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Whole note (4 beats)"
                    >
                      1m
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChangeDuration(block.id, '2n', e)}
                      className={`px-1.5 py-0.5 rounded ${block.duration === '2n' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Half note (2 beats)"
                    >
                      2n
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChangeDuration(block.id, '4n', e)}
                      className={`px-1.5 py-0.5 rounded ${block.duration === '4n' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Quarter note (1 beat)"
                    >
                      4n
                    </button>
                  </div>
                </div>

                {/* Main Content: Chord Symbol & Melody Top Note */}
                <div className="my-1">
                  {block.voicing ? (
                    <div>
                      <div className="flex items-baseline justify-between gap-1">
                        <div className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                          {block.voicing.chordSymbol}
                        </div>
                        {blockShift !== 0 && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            {blockShift > 0 ? `+${blockShift / 12} 8va` : `${blockShift / 12} 8vb`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {block.voicing.name}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400 italic">
                      Click to assign voicing
                    </div>
                  )}

                  {/* Top Note Tag & Family */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Soprano: {displayedTopNote}
                    </span>
                    {block.voicing && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-200 text-slate-700">
                        {block.voicing.family}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chord Octave Transpose Controls (+ / -) */}
                <div className="mt-3 pt-2 border-t border-warm-200/80 flex items-center justify-between gap-1">
                  <div className="inline-flex items-center rounded-md border border-warm-300 bg-white p-0.5 text-[10px] font-mono shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => handleShiftBlockOctave(block.id, -12, e)}
                      className="px-1.5 py-0.5 rounded hover:bg-warm-100 active:bg-blue-50 text-slate-700 disabled:opacity-30 font-bold transition"
                      title="Lower this chord by 1 octave (-8va)"
                      disabled={blockShift <= -24}
                    >
                      -8va
                    </button>
                    <span
                      className={`px-1.5 text-[9px] font-semibold ${
                        blockShift !== 0 ? 'text-blue-700 font-bold bg-blue-50 rounded' : 'text-slate-500'
                      }`}
                    >
                      {blockShift === 0 ? '0' : blockShift > 0 ? `+${blockShift / 12}` : `${blockShift / 12}`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleShiftBlockOctave(block.id, 12, e)}
                      className="px-1.5 py-0.5 rounded hover:bg-warm-100 active:bg-blue-50 text-slate-700 disabled:opacity-30 font-bold transition"
                      title="Raise this chord by 1 octave (+8va)"
                      disabled={blockShift >= 24}
                    >
                      +8va
                    </button>
                  </div>

                  {/* Single-chord Finder reveal & Drag */}
                  {block.voicing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await revealVoicingInFinder(block.voicing!, {
                            addBass,
                            octaveOffset: octaveOffset + blockShift,
                            duration: block.duration,
                            filename: `${block.voicing!.chordSymbol}_M${idx + 1}.mid`,
                          });
                        }}
                        className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                        title="Reveal this single chord in Finder for Logic Pro"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>

                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          const midi = generateVoicingMidi(block.voicing!, {
                            addBass,
                            octaveOffset: octaveOffset + blockShift,
                            duration: block.duration,
                            filename: `${block.voicing!.chordSymbol}_M${idx + 1}.mid`,
                          });
                          handleMidiDragStart(e, midi);
                        }}
                        className="cursor-grab active:cursor-grabbing inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-1 py-0.5 rounded border border-warm-200 hover:border-blue-300 transition"
                        title="Drag to Desktop/Finder"
                      >
                        <GripVertical className="w-3 h-3 text-slate-400" />
                        <span>MIDI</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteBlock(block.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove this measure"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }))}

          {/* Add Measure Button */}
          <button
            type="button"
            onClick={handleAddBlock}
            className="w-36 min-h-[160px] rounded-xl border border-dashed border-warm-300 hover:border-blue-400 bg-warm-50/50 hover:bg-blue-50/30 text-slate-500 hover:text-blue-600 transition flex flex-col items-center justify-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-warm-300 flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Add Measure</span>
          </button>
        </div>
      </div>

      {/* Editing / Reharmonizing Popover Inspector */}
      {activeEditingBlock && (
        <div className="mt-2 p-4 rounded-xl border border-blue-200 bg-blue-50/40 animate-fadeIn">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Reharmonizing Measure:
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                Top Note: {activeEditingBlock.topNote}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingBlockId(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Done
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-2">
            Select an alternative chord voicing underneath soprano melody{' '}
            <span className="font-mono font-bold text-blue-700">{activeEditingBlock.topNote}</span>:
          </p>

          {/* Quick choices list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {getVoicingsForTopNote(
              activeEditingBlock.topNote.replace(/[0-9]/g, '') as PitchClass,
              parseInt(activeEditingBlock.topNote.replace(/[^0-9]/g, '')) || 5
            ).slice(0, 12).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleAssignVoicing(activeEditingBlock.id, v)}
                className={`
                  p-2 text-left rounded-lg border text-xs transition-all flex flex-col justify-between
                  ${
                    activeEditingBlock.voicing?.id === v.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow'
                      : 'bg-white hover:bg-blue-50 text-slate-800 border-warm-200 hover:border-blue-300'
                  }
                `}
              >
                <span className="font-bold font-sans">{v.chordSymbol}</span>
                <span className={`text-[9px] truncate mt-1 ${activeEditingBlock.voicing?.id === v.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {v.family}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
