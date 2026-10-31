export type ChordFamily =
  | 'Major'
  | 'Minor'
  | 'Dominant'
  | 'Altered'
  | 'Half-Diminished'
  | 'Diminished'
  | 'Suspended';

export type PitchClass =
  | 'C'
  | 'C#'
  | 'D'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'Ab'
  | 'A'
  | 'Bb'
  | 'B';

export interface Voicing {
  id: string;
  chordSymbol: string; // e.g. "Cmaj9#11", "Eb9(13)", "F#m11"
  name: string; // e.g. "Maj9(#11) Lydian Spread"
  root: PitchClass;
  family: ChordFamily;
  topNote: string; // e.g. "E5", "G4"
  topPitchClass: PitchClass;
  midiNotes: number[]; // Sorted ascending e.g. [48, 59, 62, 64]
  recipe: string[]; // Relative to root e.g. ['1', '3', '7', '9', '#11']
  styleTags: string[]; // e.g. ['Neo-Soul', 'Rootless', 'Cluster', 'Modern Jazz']
  description?: string;
  bassNoteMidi?: number; // Optional deep octave root for "Add Bass"
}

export type NoteDuration = '1m' | '2n' | '4n'; // Whole, Half, Quarter

export interface TimelineBlock {
  id: string;
  measure: number;
  beat: number;
  duration: NoteDuration; // '1m' = 4 beats, '2n' = 2 beats, '4n' = 1 beat
  topNote: string; // Target melody note e.g. "E5"
  voicing: Voicing | null;
  octaveOffset?: number; // e.g. -24, -12, 0, +12, +24 (semitones)
}

export interface PlaybackState {
  isPlaying: boolean;
  bpm: number;
  currentBlockIndex: number | null;
  isLooping: boolean;
  addBass: boolean;
  octaveOffset: number; // -12, 0, +12
}
