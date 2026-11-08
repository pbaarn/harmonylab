'use client';

import React, { useState, useEffect } from 'react';
import { Voicing, TimelineBlock, PitchClass, ChordFamily } from '@/types/harmonylab';
import { SEED_VOICINGS, getVoicingsForTopNote } from '@/lib/voicingsDatabase';
import { Navbar, PRESET_PROGRESSIONS } from '@/components/Navbar';
import { PianoVisualizer } from '@/components/PianoVisualizer';
import { TopNoteReharmonizer } from '@/components/TopNoteReharmonizer';
import { ReharmonizerTimeline } from '@/components/ReharmonizerTimeline';
import { PrintSheetModal } from '@/components/PrintSheetModal';
import { KeyboardOverlay } from '@/components/KeyboardOverlay';
import { audioEngine } from '@/lib/audio';
import { Sparkles, Music, Info, HelpCircle } from 'lucide-react';

export default function Home() {
  // Voicing & Pitch Selection State
  const [activeVoicing, setActiveVoicing] = useState<Voicing | null>(SEED_VOICINGS[0]);
  const [activeVoicingOctave, setActiveVoicingOctave] = useState<number>(0);
  const [selectedPitchClass, setSelectedPitchClass] = useState<PitchClass>('E');
  const [selectedOctave, setSelectedOctave] = useState<number>(5);
  const [selectedFamily, setSelectedFamily] = useState<ChordFamily | 'All'>('All');

  // Audio & Playback Options
  const [addBass, setAddBass] = useState<boolean>(true);
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Keyboard Overlay & Quick Audition State
  const [isKeyboardOverlayOpen, setIsKeyboardOverlayOpen] = useState<boolean>(false);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [recentSurprises, setRecentSurprises] = useState<Voicing[]>([]);

  // Initialize timeline with a rich Neo-Soul 2-5-1-6 progression
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>(() => {
    const initialPreset = PRESET_PROGRESSIONS[0];
    return initialPreset.chordIds.map((id, idx) => {
      const v = SEED_VOICINGS.find((item) => item.id === id) || SEED_VOICINGS[idx % SEED_VOICINGS.length];
      return {
        id: `block-init-${idx}`,
        measure: idx + 1,
        beat: 1,
        duration: '1m',
        topNote: v.topNote,
        voicing: v,
        octaveOffset: 0,
      };
    });
  });

  // Load persisted state and recent surprises from localStorage on client mount
  useEffect(() => {
    setIsHydrated(true);
    try {
      const saved = localStorage.getItem('harmonylab_persisted_state_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.timelineBlocks)) {
          setTimelineBlocks(data.timelineBlocks);
        }
        if (data.activeVoicing) {
          setActiveVoicing(data.activeVoicing);
        }
        if (typeof data.activeVoicingOctave === 'number') {
          setActiveVoicingOctave(data.activeVoicingOctave);
        }
        if (typeof data.addBass === 'boolean') {
          setAddBass(data.addBass);
        }
        if (typeof data.octaveOffset === 'number') {
          setOctaveOffset(data.octaveOffset);
        }
        if (data.selectedPitchClass) {
          setSelectedPitchClass(data.selectedPitchClass);
        }
        if (typeof data.selectedOctave === 'number') {
          setSelectedOctave(data.selectedOctave);
        }
      }

      const savedSurprises = localStorage.getItem('harmonylab_recent_surprises');
      if (savedSurprises) {
        const surprises = JSON.parse(savedSurprises);
        if (Array.isArray(surprises)) {
          setRecentSurprises(surprises.slice(0, 6));
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted state from localStorage:', e);
    }
  }, []);

  // Save state to localStorage whenever changes occur
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        'harmonylab_persisted_state_v1',
        JSON.stringify({
          timelineBlocks,
          activeVoicing,
          activeVoicingOctave,
          addBass,
          octaveOffset,
          selectedPitchClass,
          selectedOctave,
        })
      );
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [
    timelineBlocks,
    activeVoicing,
    activeVoicingOctave,
    addBass,
    octaveOffset,
    selectedPitchClass,
    selectedOctave,
    isHydrated,
  ]);

  const handleSelectVoicing = (voicing: Voicing) => {
    setActiveVoicing(voicing);
    setActiveVoicingOctave(0);
  };

  const handleSelectVoicingForInspection = (voicing: Voicing, blockOctaveOffset: number = 0) => {
    setActiveVoicing(voicing);
    setActiveVoicingOctave(blockOctaveOffset);
  };

  const handleAddToTimeline = (voicing: Voicing) => {
    const newBlock: TimelineBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      measure: timelineBlocks.length + 1,
      beat: 1,
      duration: '1m',
      topNote: voicing.topNote,
      voicing,
      octaveOffset: 0,
    };
    setTimelineBlocks((prev) => [...prev, newBlock]);
    setActiveVoicing(voicing);
    setActiveVoicingOctave(0);
  };

  // Immediate "Surprise Me" action for chosen top note
  const handleTriggerSurpriseForTopNote = (
    pitchClass: PitchClass,
    targetOctave: number = selectedOctave
  ) => {
    setSelectedPitchClass(pitchClass);
    setSelectedOctave(targetOctave);

    const list = getVoicingsForTopNote(pitchClass, targetOctave, selectedFamily);
    const voicingsToPick = list.length > 0 ? list : getVoicingsForTopNote(pitchClass, targetOctave, 'All');
    if (voicingsToPick.length === 0) return;

    const randomIndex = Math.floor(Math.random() * voicingsToPick.length);
    const surpriseChoice = voicingsToPick[randomIndex];

    setActiveVoicing(surpriseChoice);
    setActiveVoicingOctave(0);
    audioEngine.playVoicing(surpriseChoice, { addBass, octaveOffset });

    // Track the last 6 chords played by the surprise button
    setRecentSurprises((prev) => {
      const filtered = prev.filter((v) => v.id !== surpriseChoice.id);
      const updated = [surpriseChoice, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('harmonylab_recent_surprises', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Provide visual flash on active key
    setActiveKeyId(`${pitchClass}${targetOctave}`);
    setTimeout(() => {
      setActiveKeyId(null);
    }, 300);
  };

  // Global Computer Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if focused inside an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // 1. Add Last Played Chord to Progression: Space, Enter, +
      if (e.code === 'Space' || e.code === 'Enter' || e.key === '+' || e.key === '=') {
        if (e.code === 'Space') {
          e.preventDefault(); // Prevent page scroll down
        }
        if (activeVoicing) {
          handleAddToTimeline(activeVoicing);
        } else {
          handleTriggerSurpriseForTopNote(selectedPitchClass, selectedOctave);
        }
        return;
      }

      // 2. Octave Down / Up: Z / X
      if (e.code === 'KeyZ' || e.key.toLowerCase() === 'z') {
        setSelectedOctave((prev) => Math.max(3, prev - 1));
        return;
      }
      if (e.code === 'KeyX' || e.key.toLowerCase() === 'x') {
        setSelectedOctave((prev) => Math.min(6, prev + 1));
        return;
      }

      // 3. Toggle On-Screen Keyboard Overlay: \ or `
      if (e.code === 'Backslash' || e.code === 'Backquote' || e.key === '\\' || e.key === '`') {
        setIsKeyboardOverlayOpen((prev) => !prev);
        return;
      }

      // 4. Close Overlay on Escape
      if (e.code === 'Escape' && isKeyboardOverlayOpen) {
        setIsKeyboardOverlayOpen(false);
        return;
      }

      // 5. Musical Typing QWERTY Map (Home Row & Black Keys)
      const KEY_TO_NOTE: Record<string, { pc: PitchClass; octOffset: number }> = {
        // Base octave
        KeyA: { pc: 'C', octOffset: 0 },
        KeyW: { pc: 'C#', octOffset: 0 },
        KeyS: { pc: 'D', octOffset: 0 },
        KeyE: { pc: 'Eb', octOffset: 0 },
        KeyD: { pc: 'E', octOffset: 0 },
        KeyF: { pc: 'F', octOffset: 0 },
        KeyT: { pc: 'F#', octOffset: 0 },
        KeyG: { pc: 'G', octOffset: 0 },
        KeyY: { pc: 'Ab', octOffset: 0 },
        KeyH: { pc: 'A', octOffset: 0 },
        KeyU: { pc: 'Bb', octOffset: 0 },
        KeyJ: { pc: 'B', octOffset: 0 },

        // Next octave extension
        KeyK: { pc: 'C', octOffset: 1 },
        KeyO: { pc: 'C#', octOffset: 1 },
        KeyL: { pc: 'D', octOffset: 1 },
        KeyP: { pc: 'Eb', octOffset: 1 },
      };

      const match = KEY_TO_NOTE[e.code];
      if (match) {
        const targetOct = Math.min(6, selectedOctave + match.octOffset);
        handleTriggerSurpriseForTopNote(match.pc, targetOct);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeVoicing,
    selectedPitchClass,
    selectedOctave,
    selectedFamily,
    addBass,
    octaveOffset,
    isKeyboardOverlayOpen,
    timelineBlocks.length,
  ]);

  const handleLoadPreset = (blocks: TimelineBlock[]) => {
    setTimelineBlocks(blocks);
    if (blocks[0]?.voicing) {
      setActiveVoicing(blocks[0].voicing);
      setActiveVoicingOctave(blocks[0].octaveOffset || 0);
    }
  };

  const handleClearRecentSurprises = () => {
    setRecentSurprises([]);
    try {
      localStorage.removeItem('harmonylab_recent_surprises');
    } catch (e) {}
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
      {/* Top Navigation */}
      <Navbar
        onLoadPreset={handleLoadPreset}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        isKeyboardOverlayOpen={isKeyboardOverlayOpen}
        onToggleKeyboardOverlay={() => setIsKeyboardOverlayOpen((prev) => !prev)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">
        {/* Editorial Subtitle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight">
              HarmonyLab
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Top-note piano voicings & reharmonizer. Press computer keys <kbd className="px-1 py-0.2 bg-warm-200 rounded font-mono text-[10px]">A–K</kbd> to surprise top notes, and press <kbd className="px-1 py-0.2 bg-warm-200 rounded font-mono text-[10px]">Space</kbd> to add chords to your progression.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto bg-white border border-warm-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 shadow-2xs">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Audition shortcuts: <strong className="text-slate-900 font-mono">[A-K]</strong> Surprise • <strong className="text-slate-900 font-mono">[Space]</strong> Add • <strong className="text-slate-900 font-mono">[\]</strong> Overlay
            </span>
          </div>
        </div>

        {/* 2-Column Studio Workbench */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Left Column: Filter Panel & Narrow Chords List */}
          <div className="w-full lg:w-[360px] xl:w-[390px] shrink-0">
            <TopNoteReharmonizer
              selectedVoicing={activeVoicing}
              onSelectVoicing={handleSelectVoicing}
              onAddToTimeline={handleAddToTimeline}
              addBass={addBass}
              onToggleAddBass={() => setAddBass(!addBass)}
              octaveOffset={octaveOffset}
              onSetOctaveOffset={setOctaveOffset}
              selectedPitchClass={selectedPitchClass}
              onSelectPitchClass={setSelectedPitchClass}
              selectedOctave={selectedOctave}
              onSelectOctave={setSelectedOctave}
              selectedFamily={selectedFamily}
              onSelectFamily={setSelectedFamily}
              onTriggerSurprise={(pc, oct) =>
                handleTriggerSurpriseForTopNote(pc || selectedPitchClass, oct || selectedOctave)
              }
              isKeyboardOverlayOpen={isKeyboardOverlayOpen}
              onToggleKeyboardOverlay={() => setIsKeyboardOverlayOpen((prev) => !prev)}
              recentSurprises={recentSurprises}
              onClearRecentSurprises={handleClearRecentSurprises}
            />
          </div>

          {/* Right Stage: Interactive Piano Visualizer & Reharmonizer Timeline */}
          <div className="flex-1 w-full flex flex-col gap-5 min-w-0">
            {/* 1. Piano Visualizer with Note Names, Recipe, Playback, and Add Chord to Progression */}
            <section>
              <PianoVisualizer
                activeVoicing={activeVoicing}
                addBass={addBass}
                onToggleAddBass={() => setAddBass(!addBass)}
                octaveOffset={octaveOffset + activeVoicingOctave}
                onSetOctaveOffset={setOctaveOffset}
                onAddToTimeline={handleAddToTimeline}
              />
            </section>

            {/* 2. Reharmonizer Timeline / Sequencer (4/4 Measure Strip) */}
            <section>
              <ReharmonizerTimeline
                blocks={timelineBlocks}
                onUpdateBlocks={setTimelineBlocks}
                onSelectVoicingForInspection={handleSelectVoicingForInspection}
                addBass={addBass}
                octaveOffset={octaveOffset}
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Floating On-Screen Keyboard Overlay for Touch & Mouse */}
      <KeyboardOverlay
        isOpen={isKeyboardOverlayOpen}
        onClose={() => setIsKeyboardOverlayOpen(false)}
        selectedPitchClass={selectedPitchClass}
        selectedOctave={selectedOctave}
        onSelectOctave={setSelectedOctave}
        activeVoicing={activeVoicing}
        onTriggerNote={(pc, oct) => handleTriggerSurpriseForTopNote(pc, oct)}
        onAddToTimeline={handleAddToTimeline}
        activeKeyId={activeKeyId}
      />

      {/* Printable Sheet Modal */}
      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        blocks={timelineBlocks}
        bpm={82}
        addBass={addBass}
        octaveOffset={octaveOffset}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-warm-200 bg-white py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} HarmonyLab • Inspired by Jeff Schneider’s Sick Chords Lab.
          </p>
          <p className="flex items-center gap-1">
            <span>Built with Next.js, Web Audio API, Tonal.js & MidiWriterJS</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
