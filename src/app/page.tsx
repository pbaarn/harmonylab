'use client';

import React, { useState, useEffect } from 'react';
import { Voicing, TimelineBlock } from '@/types/harmonylab';
import { SEED_VOICINGS } from '@/lib/voicingsDatabase';
import { Navbar, PRESET_PROGRESSIONS } from '@/components/Navbar';
import { PianoVisualizer } from '@/components/PianoVisualizer';
import { TopNoteReharmonizer } from '@/components/TopNoteReharmonizer';
import { ReharmonizerTimeline } from '@/components/ReharmonizerTimeline';
import { PrintSheetModal } from '@/components/PrintSheetModal';
import { audioEngine } from '@/lib/audio';
import { Sparkles, Music, Info, HelpCircle } from 'lucide-react';

export default function Home() {
  // Initialize with the first seed voicing
  const [activeVoicing, setActiveVoicing] = useState<Voicing | null>(SEED_VOICINGS[0]);
  const [activeVoicingOctave, setActiveVoicingOctave] = useState<number>(0);
  const [addBass, setAddBass] = useState<boolean>(true);
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

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

  // Load persisted state from localStorage on client mount
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
        })
      );
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [timelineBlocks, activeVoicing, activeVoicingOctave, addBass, octaveOffset, isHydrated]);

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

  const handleLoadPreset = (blocks: TimelineBlock[]) => {
    setTimelineBlocks(blocks);
    if (blocks[0]?.voicing) {
      setActiveVoicing(blocks[0].voicing);
      setActiveVoicingOctave(blocks[0].octaveOffset || 0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
      {/* Top Navigation */}
      <Navbar
        onLoadPreset={handleLoadPreset}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* Subtle Editorial Header Introduction */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              HarmonyLab
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              In real songwriting and arranging, chords are governed by the soprano melody. Choose any top note to instantly unlock rich Jazz, Neo-Soul, Gospel, and R&B reharmonizations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto bg-white border border-warm-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 shadow-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Tip: Click any key on the visualizer to hear it, or hit &quot;Surprise Me&quot; to audition random voicings.
            </span>
          </div>
        </div>

        {/* 1. Interactive 61-Key Visualizer */}
        <section>
          <PianoVisualizer
            activeVoicing={activeVoicing}
            addBass={addBass}
            octaveOffset={octaveOffset + activeVoicingOctave}
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

        {/* 3. Top-Note Reharmonizer Filter & Voicings Database */}
        <section>
          <TopNoteReharmonizer
            selectedVoicing={activeVoicing}
            onSelectVoicing={handleSelectVoicing}
            onAddToTimeline={handleAddToTimeline}
            addBass={addBass}
            onToggleAddBass={() => setAddBass(!addBass)}
            octaveOffset={octaveOffset}
            onSetOctaveOffset={setOctaveOffset}
          />
        </section>
      </main>

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
