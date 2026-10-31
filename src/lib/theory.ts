import { Note, Interval, Chord } from 'tonal';
import { PitchClass } from '@/types/harmonylab';

export const PITCH_CLASSES: PitchClass[] = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

const MIDI_SHARP_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const MIDI_FLAT_NAMES = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

/**
 * Standardize note name to PitchClass
 */
export function normalizePitchClass(pc: string): PitchClass {
  const clean = pc.trim();
  switch (clean) {
    case 'Db': return 'C#';
    case 'D#': return 'Eb';
    case 'Gb': return 'F#';
    case 'G#': return 'Ab';
    case 'A#': return 'Bb';
    case 'E#': return 'F';
    case 'B#': return 'C';
    case 'Cb': return 'B';
    case 'Fb': return 'E';
    default:
      if (PITCH_CLASSES.includes(clean as PitchClass)) {
        return clean as PitchClass;
      }
      return 'C';
  }
}

/**
 * Convert MIDI note number to note name with octave (e.g. 60 -> "C4")
 */
export function midiToNoteName(midi: number, preferFlats = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const name = preferFlats ? MIDI_FLAT_NAMES[noteIndex] : MIDI_SHARP_NAMES[noteIndex];
  return `${name}${octave}`;
}

/**
 * Convert note name to MIDI number (e.g. "C4" -> 60)
 */
export function noteNameToMidi(noteName: string): number {
  const midi = Note.midi(noteName);
  return midi !== null && midi !== undefined ? midi : 60;
}

/**
 * Extract pitch class from scientific note (e.g. "E5" -> "E")
 */
export function getPitchClass(noteName: string): PitchClass {
  const pc = Note.pitchClass(noteName);
  return normalizePitchClass(pc);
}

/**
 * Get Octave from note name (e.g. "E5" -> 5)
 */
export function getOctave(noteName: string): number {
  const oct = Note.octave(noteName);
  return oct !== null && oct !== undefined ? oct : 4;
}

/**
 * Calculate interval name relative to root (e.g. Root "C", Note "E" -> "3", Note "Bb" -> "b7")
 */
export function calculateIntervalName(root: string, noteName: string): string {
  const rootPc = Note.pitchClass(root);
  const notePc = Note.pitchClass(noteName);
  
  if (rootPc === notePc) return '1';

  const semitones = (Note.chroma(notePc) ?? 0) - (Note.chroma(rootPc) ?? 0);
  const normalizedSemitones = ((semitones % 12) + 12) % 12;

  const intervalMap: Record<number, string> = {
    0: '1',
    1: 'b9',
    2: '9',
    3: 'b3',
    4: '3',
    5: '11',
    6: '#11/b5',
    7: '5',
    8: '#5/b13',
    9: '6/13',
    10: 'b7',
    11: '7',
  };

  return intervalMap[normalizedSemitones] || 'ext';
}

/**
 * Check if a MIDI note is a black key on the piano
 */
export function isBlackKey(midi: number): boolean {
  const semitone = midi % 12;
  return [1, 3, 6, 8, 10].includes(semitone);
}

/**
 * Frequency from MIDI note (for synth / sampler)
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
