import { Voicing, ChordFamily, PitchClass } from '@/types/harmonylab';
import { midiToNoteName, getPitchClass, noteNameToMidi, normalizePitchClass } from './theory';
import { Note } from 'tonal';

export const SEED_VOICINGS: Voicing[] = [
  // ==========================================
  // MAJOR FAMILY
  // ==========================================
  {
    id: 'maj9-lydian-e5',
    chordSymbol: 'Cmaj9(#11)',
    name: 'Maj9(#11) Lydian Spread',
    root: 'C',
    family: 'Major',
    topNote: 'E5',
    topPitchClass: 'E',
    midiNotes: [48, 59, 62, 66, 76], // C3, B3, D4, F#4, E5
    recipe: ['1', '7', '9', '#11', '3'],
    styleTags: ['Modern Jazz', 'Lydian', 'Open Spread'],
    description: 'Ethereal modern jazz voicing with #11 color and wide interval resonance.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'maj9-neosoul-cluster-d5',
    chordSymbol: 'Fmaj9',
    name: 'Neo-Soul Maj9 Cluster',
    root: 'F',
    family: 'Major',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [53, 60, 64, 65, 69, 74], // F3, C4, E4, F4, A4, D5
    recipe: ['1', '5', '7', '1', '3', '6/13'],
    styleTags: ['Neo-Soul', 'Cluster', 'Rich'],
    description: 'Luscious tight cluster in the inner voices with the 13th soaring on top.',
    bassNoteMidi: 41, // F2
  },
  {
    id: 'maj7-drop2-b4',
    chordSymbol: 'Cmaj7',
    name: 'Drop-2 Maj7',
    root: 'C',
    family: 'Major',
    topNote: 'B4',
    topPitchClass: 'B',
    midiNotes: [48, 55, 64, 71], // C3, G3, E4, B4
    recipe: ['1', '5', '3', '7'],
    styleTags: ['Drop-2', 'Classic Jazz', 'Clean'],
    description: 'Essential drop-2 jazz piano voicing with the major 7th in the soprano voice.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'maj69-gospel-a4',
    chordSymbol: 'C6/9',
    name: 'Gospel 6/9 Warmth',
    root: 'C',
    family: 'Major',
    topNote: 'A4',
    topPitchClass: 'A',
    midiNotes: [48, 52, 57, 62, 69], // C3, E3, A3, D4, A4
    recipe: ['1', '3', '6', '9', '6'],
    styleTags: ['Gospel', 'Neo-Soul', 'Warm'],
    description: 'Pure warmth without the tension of a natural 7th. Quintessential R&B staple.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'maj13-evans-g4',
    chordSymbol: 'Ebmaj13',
    name: 'Bill Evans Maj13 Rootless',
    root: 'Eb',
    family: 'Major',
    topNote: 'G4',
    topPitchClass: 'G',
    midiNotes: [50, 55, 58, 62, 67], // D3, G3, Bb3, D4, G4 (relative to Eb: 7, 3, 5, 7, 3)
    recipe: ['7', '3', '5', '7', '3'],
    styleTags: ['Rootless', 'Bill Evans', 'Cool Jazz'],
    description: 'Famous Type A rootless major voicing creating an uncluttered piano texture.',
    bassNoteMidi: 39, // Eb2
  },
  {
    id: 'maj9-quartal-g5',
    chordSymbol: 'Abmaj9',
    name: 'Ab Maj9 Quartal Stack',
    root: 'Ab',
    family: 'Major',
    topNote: 'G5',
    topPitchClass: 'G',
    midiNotes: [44, 56, 60, 63, 68, 79], // Ab2, Ab3, C4, Eb4, Ab4, G5
    recipe: ['1', '1', '3', '5', '1', '7'],
    styleTags: ['Modern Jazz', 'Concert', 'Majestic'],
    description: 'Monumental acoustic voicing with the pure major 7th crowning the upper octave.',
    bassNoteMidi: 32, // Ab1
  },
  {
    id: 'maj7sharp11-upperstructure-c5',
    chordSymbol: 'Dbmaj7(#11)',
    name: 'Db Maj7(#11) Upper Structure',
    root: 'C#',
    family: 'Major',
    topNote: 'C5',
    topPitchClass: 'C',
    midiNotes: [49, 56, 61, 67, 72], // Db3, Ab3, Db4, G4, C5
    recipe: ['1', '5', '1', '#11', '7'],
    styleTags: ['Upper Structure', 'Film Score', 'Lydian'],
    description: 'Open fifths in left hand with an Eb triad superimposed in right hand.',
    bassNoteMidi: 37, // Db2
  },

  // ==========================================
  // MINOR FAMILY
  // ==========================================
  {
    id: 'm9-butter-e5',
    chordSymbol: 'Dm9',
    name: 'Neo-Soul Butter Minor 9',
    root: 'D',
    family: 'Minor',
    topNote: 'E5',
    topPitchClass: 'E',
    midiNotes: [50, 57, 60, 65, 69, 76], // D3, A3, C4, F4, A4, E5
    recipe: ['1', '5', 'b7', 'b3', '5', '9'],
    styleTags: ['Neo-Soul', 'R&B', 'Velvety'],
    description: 'The golden standard R&B minor 9 chord with rich interval spacing.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'm11-sowhat-d5',
    chordSymbol: 'Em11',
    name: '"So What" Quartal Minor 11',
    root: 'E',
    family: 'Minor',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [52, 57, 62, 67, 71, 74], // E3, A3, D4, G4, B4, D5 (3 fourths + major third)
    recipe: ['1', '11', 'b7', 'b3', '5', 'b7'],
    styleTags: ['Quartal', 'Miles Davis', 'Modal'],
    description: 'The iconic Miles Davis / Bill Evans modal voicing stacked in perfect fourths.',
    bassNoteMidi: 40, // E2
  },
  {
    id: 'm11-kennybarron-g5',
    chordSymbol: 'Am11',
    name: 'Kenny Barron Minor 11 Stasis',
    root: 'A',
    family: 'Minor',
    topNote: 'G5',
    topPitchClass: 'G',
    midiNotes: [45, 52, 57, 62, 67, 72, 79], // A2, E3, A3, D4, G4, C5, G5
    recipe: ['1', '5', '1', '11', 'b7', 'b3', 'b7'],
    styleTags: ['Modern Jazz', 'Wide', 'Resonant'],
    description: 'Tower of fourths over deep fifths used constantly by modern post-bop pianists.',
    bassNoteMidi: 33, // A1
  },
  {
    id: 'm9-rootless-b-c5',
    chordSymbol: 'Fm9',
    name: 'Bill Evans Minor 9 (Type B)',
    root: 'F',
    family: 'Minor',
    topNote: 'C5',
    topPitchClass: 'C',
    midiNotes: [51, 55, 58, 63, 72], // Eb3, G3, Ab3, Eb4, C5 (relative to F: b7, 9, b3, b7, 5)
    recipe: ['b7', '9', 'b3', 'b7', '5'],
    styleTags: ['Rootless', 'Bill Evans', 'Sophisticated'],
    description: 'Rootless Type B minor voicing with smooth voice-leading potential.',
    bassNoteMidi: 41, // F2
  },
  {
    id: 'mmaj9-noir-fsharp5',
    chordSymbol: 'Bm(maj9)',
    name: 'Film Noir Minor-Major 9',
    root: 'B',
    family: 'Minor',
    topNote: 'F#5',
    topPitchClass: 'F#',
    midiNotes: [47, 54, 58, 61, 66, 78], // B2, F#3, A#3, C#4, F#4, F#5
    recipe: ['1', '5', '7', '9', '5', '5'],
    styleTags: ['Film Noir', 'Mysterious', 'Melodic Minor'],
    description: 'Haunting harmonic minor / melodic minor sound with natural 7 tension.',
    bassNoteMidi: 35, // B1
  },
  {
    id: 'm11-glasper-cluster-a5',
    chordSymbol: 'Gm11',
    name: 'Glasper Minor 11 Cluster',
    root: 'G',
    family: 'Minor',
    topNote: 'A5',
    topPitchClass: 'A',
    midiNotes: [43, 53, 58, 60, 62, 69, 81], // G2, F3, Bb3, C4, D4, A4, A5
    recipe: ['1', 'b7', 'b3', '11', '5', '9', '9'],
    styleTags: ['Neo-Soul', 'Glasper', 'Hip-Hop Jazz'],
    description: 'Subtle 2nd rub between Bb and C creating rich contemporary texture.',
    bassNoteMidi: 31, // G1
  },

  // ==========================================
  // DOMINANT FAMILY
  // ==========================================
  {
    id: 'dom13-schneider-e5',
    chordSymbol: 'G13',
    name: 'Jeff Schneider Slick 13th',
    root: 'G',
    family: 'Dominant',
    topNote: 'E5',
    topPitchClass: 'E',
    midiNotes: [43, 53, 59, 64, 69, 76], // G2, F3, B3, E4, A4, E5
    recipe: ['1', 'b7', '3', '13', '9', '13'],
    styleTags: ['Neo-Soul', 'Schneider', 'Punchy'],
    description: 'Tritone guide tones in LH with pentatonic / quartal stack in RH.',
    bassNoteMidi: 31, // G1
  },
  {
    id: 'dom9sharp11-lydiandom-fsharp5',
    chordSymbol: 'C9(#11)',
    name: 'Lydian Dominant 9(#11)',
    root: 'C',
    family: 'Dominant',
    topNote: 'F#5',
    topPitchClass: 'F#',
    midiNotes: [48, 58, 62, 64, 69, 78], // C3, Bb3, D4, E4, A4, F#5
    recipe: ['1', 'b7', '9', '3', '13', '#11'],
    styleTags: ['Lydian Dominant', 'Modern Jazz', 'Bright'],
    description: 'Acoustic scale harmony with sparkling #11 (tritone) on the very top.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'dom13b9-soul-d5',
    chordSymbol: 'F13(b9)',
    name: 'Stevie Wonder 13(b9)',
    root: 'F',
    family: 'Dominant',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [41, 51, 57, 62, 66, 74], // F2, Eb3, A3, D4, F#4 (Gb4=b9), D5
    recipe: ['1', 'b7', '3', '13', 'b9', '13'],
    styleTags: ['Neo-Soul', 'Gospel', 'Tension'],
    description: 'Sensational resolving chord used constantly in gospel and Stevie Wonder ballads.',
    bassNoteMidi: 29, // F1
  },
  {
    id: 'dom9-drop2-b4',
    chordSymbol: 'A9',
    name: 'West Coast 9th Drop-2',
    root: 'A',
    family: 'Dominant',
    topNote: 'B4',
    topPitchClass: 'B',
    midiNotes: [45, 55, 61, 64, 71], // A2, G3, C#4, E4, B4
    recipe: ['1', 'b7', '3', '5', '9'],
    styleTags: ['Funk', 'West Coast', 'Crisp'],
    description: 'Crisp funk/blues voicing with high 9th extension singing on top.',
    bassNoteMidi: 33, // A1
  },
  {
    id: 'dom7sharp9-hendrix-eb5',
    chordSymbol: 'C7(#9)',
    name: 'Purple Soul 7(#9)',
    root: 'C',
    family: 'Dominant',
    topNote: 'Eb5',
    topPitchClass: 'Eb',
    midiNotes: [48, 58, 64, 70, 75], // C3, Bb3, E4, Bb4, D#5 (Eb5)
    recipe: ['1', 'b7', '3', 'b7', '#9'],
    styleTags: ['Blues', 'Neo-Soul', 'Gritty'],
    description: 'The famous sharp-nine chord with natural 3 and minor 3 enharmonic collision.',
    bassNoteMidi: 36, // C2
  },

  // ==========================================
  // ALTERED FAMILY
  // ==========================================
  {
    id: 'alt7-tritone-sub-bb4',
    chordSymbol: 'E7alt',
    name: 'Altered Dominant (Tritone Sub)',
    root: 'E',
    family: 'Altered',
    topNote: 'Bb4',
    topPitchClass: 'Bb',
    midiNotes: [40, 50, 56, 62, 65, 70], // E2, D3, G#3, D4, F4(b9), Bb4(#11)
    recipe: ['1', 'b7', '3', 'b7', 'b9', '#11/b5'],
    styleTags: ['Altered', 'Tritone Sub', 'Dark'],
    description: 'Fully altered dominant ready to resolve with maximum momentum to Am.',
    bassNoteMidi: 28, // E1
  },
  {
    id: 'alt7-sharp9-sharp5-g5',
    chordSymbol: 'A7(#9#5)',
    name: 'Super-Locrian 7(#9#5)',
    root: 'A',
    family: 'Altered',
    topNote: 'G5',
    topPitchClass: 'G',
    midiNotes: [45, 55, 61, 68, 72, 79], // A2, G3, C#4, G#4(b13/#5), C5(#9), G5(b7)
    recipe: ['1', 'b7', '3', '#5/b13', '#9', 'b7'],
    styleTags: ['Altered', 'Modern Jazz', 'Intense'],
    description: 'Peak harmonic tension voicing resolving masterfully to Dmaj9 or Dm9.',
    bassNoteMidi: 33, // A1
  },
  {
    id: 'alt7-upperstructure-triad-ab5',
    chordSymbol: 'C7alt',
    name: 'C7alt (Ab Triad Superimposed)',
    root: 'C',
    family: 'Altered',
    topNote: 'Ab5',
    topPitchClass: 'Ab',
    midiNotes: [48, 58, 64, 68, 72, 80], // C3, Bb3, E4, Ab4, C5, Ab5
    recipe: ['1', 'b7', '3', '#5/b13', '1', '#5/b13'],
    styleTags: ['Upper Structure', 'Clean Tension', 'Neo-Soul'],
    description: 'C7 shell in the bass with an Ab major triad in the right hand.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'alt7-b9b13-fsharp5',
    chordSymbol: 'B7(b9,b13)',
    name: 'B7(b9,b13) Dark Gospel',
    root: 'B',
    family: 'Altered',
    topNote: 'F#5',
    topPitchClass: 'F#',
    midiNotes: [47, 57, 63, 67, 73, 78], // B2, A3, D#4, G4(b13), C5(b9), F#5(5)
    recipe: ['1', 'b7', '3', '#5/b13', 'b9', '5'],
    styleTags: ['Gospel', 'Altered', 'Rich'],
    description: 'Deep soulful turnaround chord for gospel and neo-soul ballads.',
    bassNoteMidi: 35, // B1
  },

  // ==========================================
  // SUSPENDED / QUARTAL FAMILY
  // ==========================================
  {
    id: 'sus-quartal-d5',
    chordSymbol: 'G7sus4(9)',
    name: 'Neo-Soul Quartal 7sus',
    root: 'G',
    family: 'Suspended',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [43, 53, 58, 62, 67, 74], // G2, F3, Bb3 (b3/blues), D4, G4, D5
    recipe: ['1', 'b7', '#9', '5', '1', '5'],
    styleTags: ['Quartal', 'Neo-Soul', 'Open'],
    description: 'Ambiguous open quartal sound that floats without requiring immediate resolution.',
    bassNoteMidi: 31, // G1
  },
  {
    id: 'sus-13sus4-a4',
    chordSymbol: 'D13sus4',
    name: 'Herbie Hancock 13sus4',
    root: 'D',
    family: 'Suspended',
    topNote: 'A4',
    topPitchClass: 'A',
    midiNotes: [50, 57, 60, 64, 67, 69], // D3, A3, C4, E4, G4, A4 (Cmaj7/D)
    recipe: ['1', '5', 'b7', '9', '11', '5'],
    styleTags: ['Herbie Hancock', 'Maiden Voyage', 'Floating'],
    description: 'Slash chord voicing (Cmaj7 / D). The Maiden Voyage modal foundation.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'sus-phrygian-c5',
    chordSymbol: 'Esus4(b9)',
    name: 'Flamenco Phrygian Sus(b9)',
    root: 'E',
    family: 'Suspended',
    topNote: 'C5',
    topPitchClass: 'C',
    midiNotes: [40, 52, 57, 61, 65, 72], // E2, E3, A3, C#4 (or F3, Bb3), F4(b9), C5(b6)
    recipe: ['1', '1', '11', '6/13', 'b9', '#5/b13'],
    styleTags: ['Phrygian', 'Exotic', 'Dramatic'],
    description: 'Evocative Spanish / Flamenco sus chord with flat 9 and flat 6 coloration.',
    bassNoteMidi: 28, // E1
  },

  // ==========================================
  // HALF-DIMINISHED & DIMINISHED FAMILY
  // ==========================================
  {
    id: 'm7b5-halfdim-f5',
    chordSymbol: 'Bm7(b5)',
    name: 'Modern Half-Diminished 11',
    root: 'B',
    family: 'Half-Diminished',
    topNote: 'F5',
    topPitchClass: 'F',
    midiNotes: [47, 53, 57, 62, 65, 77], // B2, F3, A3, D4, F4, F5
    recipe: ['1', '#11/b5', 'b7', 'b3', '#11/b5', '#11/b5'],
    styleTags: ['Minor ii-V', 'Open', 'Melancholic'],
    description: 'Pristine half-diminished voicing, opening step of a minor 2-5-1 progression.',
    bassNoteMidi: 35, // B1
  },
  {
    id: 'dim7-symmetrical-ab5',
    chordSymbol: 'F#dim7',
    name: 'Symmetrical Barry Harris Dim7',
    root: 'F#',
    family: 'Diminished',
    topNote: 'Ab5',
    topPitchClass: 'Ab',
    midiNotes: [42, 51, 57, 60, 66, 80], // F#2, Eb3, A3, C4, F#4, G#5(Ab5=maj7 tension)
    recipe: ['1', '6/13', 'b3', '#11/b5', '1', '9'],
    styleTags: ['Barry Harris', 'Bebop', 'Passing'],
    description: 'Diminished chord with added major scale step passing tone on top.',
    bassNoteMidi: 30, // F#1
  },
  {
    id: 'm11b5-neo-e5',
    chordSymbol: 'Em11(b5)',
    name: 'Neo-Soul Locrian 9th',
    root: 'E',
    family: 'Half-Diminished',
    topNote: 'E5',
    topPitchClass: 'E',
    midiNotes: [40, 50, 53, 58, 62, 76], // E2, D3, F3, Bb3, D4, E5
    recipe: ['1', 'b7', 'b9', '#11/b5', 'b7', '1'],
    styleTags: ['Locrian Natural 2', 'Modern', 'Spacious'],
    description: 'Spacious Locrian voicing with tonic melody resonance.',
    bassNoteMidi: 28, // E1
  },

  // ==========================================
  // MORE RICH NEO-SOUL & JAZZ VOICINGS
  // ==========================================
  {
    id: 'maj9-drop24-c5',
    chordSymbol: 'Abmaj9',
    name: 'Drop 2 & 4 Velvet Maj9',
    root: 'Ab',
    family: 'Major',
    topNote: 'C5',
    topPitchClass: 'C',
    midiNotes: [44, 51, 58, 63, 72], // Ab2, Eb3, Bb3, Eb4, C5
    recipe: ['1', '5', '9', '5', '3'],
    styleTags: ['Drop 2&4', 'Velvet', 'Wide'],
    description: 'Luxurious broad voicing often heard in D’Angelo and Erykah Badu productions.',
    bassNoteMidi: 32, // Ab1
  },
  {
    id: 'maj7sharp11-stravinsky-a5',
    chordSymbol: 'Dmaj7(#11)',
    name: 'Lydian Starburst',
    root: 'D',
    family: 'Major',
    topNote: 'A5',
    topPitchClass: 'A',
    midiNotes: [50, 57, 61, 66, 68, 81], // D3, A3, C#4, F#4, G#4, A5
    recipe: ['1', '5', '7', '3', '#11', '5'],
    styleTags: ['Cinematic', 'Lydian', 'Luminous'],
    description: 'A luminous filmic chord with sharp 11 nestled beneath the melodic octave 5th.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'm9-smooth-g4',
    chordSymbol: 'Eb9(sus)',
    name: 'Smooth R&B 9sus4',
    root: 'Eb',
    family: 'Suspended',
    topNote: 'G4',
    topPitchClass: 'G',
    midiNotes: [39, 51, 58, 61, 65, 67], // Eb2, Eb3, Bb3, Db4, F4, G4
    recipe: ['1', '1', '5', 'b7', '9', '3'],
    styleTags: ['R&B', '90s Soul', 'Warm'],
    description: 'The definitive 90s slow jam chord voicing with the third sweetly positioned on top.',
    bassNoteMidi: 27, // Eb1
  },
  {
    id: 'dom13-drop3-f5',
    chordSymbol: 'Bb13',
    name: 'Drop-3 Big Band 13th',
    root: 'Bb',
    family: 'Dominant',
    topNote: 'F5',
    topPitchClass: 'F',
    midiNotes: [46, 56, 62, 67, 77], // Bb2, Ab3, D4, G4, F5
    recipe: ['1', 'b7', '3', '13', '5'],
    styleTags: ['Drop-3', 'Big Band', 'Brass'],
    description: 'Classic jazz guitar and piano voicing with fifth singing on top.',
    bassNoteMidi: 34, // Bb1
  },
  {
    id: 'm11-soul-bb4',
    chordSymbol: 'Cm11',
    name: 'Chicago Soul Minor 11',
    root: 'C',
    family: 'Minor',
    topNote: 'Bb4',
    topPitchClass: 'Bb',
    midiNotes: [48, 55, 60, 63, 65, 70], // C3, G3, C4, Eb4, F4, Bb4
    recipe: ['1', '5', '1', 'b3', '11', 'b7'],
    styleTags: ['Chicago Soul', 'Gospel', 'Deep'],
    description: 'Warm, low-mid weight minor 11 voicing popular in Donny Hathaway arrangements.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'alt7-sharp9-b5-fsharp5',
    chordSymbol: 'D7(#9#5)',
    name: 'Neo-Soul Turnaround 7alt',
    root: 'D',
    family: 'Altered',
    topNote: 'F#5',
    topPitchClass: 'F#',
    midiNotes: [50, 58, 62, 66, 74, 78], // D3, Bb3(#5), D4, F#4(3), D5, F#5(3)
    recipe: ['1', '#5/b13', '1', '3', '1', '3'],
    styleTags: ['Turnaround', 'Neo-Soul', 'Crisp'],
    description: 'Crunchy altered voicing providing undeniable pull towards Gmaj9 or Gm9.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'maj9-robertglasper-f5',
    chordSymbol: 'Bbmaj9',
    name: 'Glasper Velvet Maj9',
    root: 'Bb',
    family: 'Major',
    topNote: 'F5',
    topPitchClass: 'F',
    midiNotes: [46, 57, 60, 62, 69, 77], // Bb2, A3, C4, D4, A4, F5
    recipe: ['1', '7', '9', '3', '7', '5'],
    styleTags: ['Robert Glasper', 'Neo-Soul', 'Spacious'],
    description: 'Signature Glasper open left hand with clustered extension right hand.',
    bassNoteMidi: 34, // Bb1
  },
  {
    id: 'dim7-passing-dsharp5',
    chordSymbol: 'Adim7',
    name: 'Gospel Passing Diminished',
    root: 'A',
    family: 'Diminished',
    topNote: 'Eb5',
    topPitchClass: 'Eb',
    midiNotes: [45, 54, 57, 63, 69, 75], // A2, F#3, A3, Eb4, A4, Eb5
    recipe: ['1', '6/13', '1', '#11/b5', '1', '#11/b5'],
    styleTags: ['Gospel', 'Passing', 'Tension'],
    description: 'The quintessential passing diminished chord between IV and I.',
    bassNoteMidi: 33, // A1
  },
  {
    id: 'm9-phrygian-soul-bb5',
    chordSymbol: 'Gm9',
    name: 'Modern Neo-Soul High Octave m9',
    root: 'G',
    family: 'Minor',
    topNote: 'Bb5',
    topPitchClass: 'Bb',
    midiNotes: [43, 53, 57, 62, 70, 82], // G2, F3, A3, D4, Bb4, Bb5
    recipe: ['1', 'b7', '9', '5', 'b3', 'b3'],
    styleTags: ['Neo-Soul', 'High Melody', 'Clear'],
    description: 'Allows the minor third to cry out at the peak of the piano register.',
    bassNoteMidi: 31, // G1
  },
  {
    id: 'dom13-funk-b4',
    chordSymbol: 'E13',
    name: 'Steely Dan Mu-Major 13',
    root: 'E',
    family: 'Dominant',
    topNote: 'B4',
    topPitchClass: 'B',
    midiNotes: [40, 50, 56, 61, 66, 71], // E2, D3, G#3, C#4, F#4, B4
    recipe: ['1', 'b7', '3', '13', '9', '5'],
    styleTags: ['Steely Dan', 'Funk', 'Sophisticated'],
    description: 'Quartal-flavored dominant voicing with clear voice projection.',
    bassNoteMidi: 28, // E1
  },
  {
    id: 'sus-gospel-praise-csharp5',
    chordSymbol: 'F#7sus4',
    name: 'Sunday Morning 7sus4',
    root: 'F#',
    family: 'Suspended',
    topNote: 'C#5',
    topPitchClass: 'C#',
    midiNotes: [42, 49, 54, 61, 64, 73], // F#2, C#3, F#3, C#4, E4, C#5
    recipe: ['1', '5', '1', '5', 'b7', '5'],
    styleTags: ['Gospel', 'Praise', 'Triumphant'],
    description: 'Broad resonant fifths and fourths giving immense sonic power.',
    bassNoteMidi: 30, // F#1
  },
  {
    id: 'm11-dangelo-c5',
    chordSymbol: 'Abm11',
    name: 'D’Angelo Brown Sugar m11',
    root: 'Ab',
    family: 'Minor',
    topNote: 'C#5',
    topPitchClass: 'C#',
    midiNotes: [44, 54, 59, 63, 68, 73], // Ab2, Gb3, B3, Eb4, Ab4, Db5(C#5)
    recipe: ['1', 'b7', 'b3', '5', '1', '11'],
    styleTags: ['D’Angelo', 'Neo-Soul', 'Groove'],
    description: 'Deep soulful minor 11 with the 11th hovering in the vocal sweet spot.',
    bassNoteMidi: 32, // Ab1
  },
  {
    id: 'maj7-upper-d5',
    chordSymbol: 'Gmaj7',
    name: 'Acoustic Folk-Soul Maj7',
    root: 'G',
    family: 'Major',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [43, 50, 55, 66, 71, 74], // G2, D3, G3, F#4, B4, D5
    recipe: ['1', '5', '1', '7', '3', '5'],
    styleTags: ['Folk-Soul', 'Open Strings', 'Warm'],
    description: 'Resonant fifth-based voicing ringing out like an acoustic guitar.',
    bassNoteMidi: 31, // G1
  },
  {
    id: 'dom7-sharp11-monk-eb5',
    chordSymbol: 'A7(#11)',
    name: 'Thelonious Monk Tritone 7(#11)',
    root: 'A',
    family: 'Dominant',
    topNote: 'Eb5',
    topPitchClass: 'Eb',
    midiNotes: [45, 55, 61, 67, 75], // A2, G3, C#4, G4, D#5(Eb5=#11)
    recipe: ['1', 'b7', '3', 'b7', '#11/b5'],
    styleTags: ['Thelonious Monk', 'Bebop', 'Sharp'],
    description: 'Unforgiving, crystalline tritone bite directly on the top voice.',
    bassNoteMidi: 33, // A1
  },
  {
    id: 'maj9-bill-evans-d5',
    chordSymbol: 'Cmaj9',
    name: 'Bill Evans Maj9 (Type B)',
    root: 'C',
    family: 'Major',
    topNote: 'D5',
    topPitchClass: 'D',
    midiNotes: [52, 55, 59, 62, 74], // E3, G3, B3, D4, D5 (3, 5, 7, 9, 9)
    recipe: ['3', '5', '7', '9', '9'],
    styleTags: ['Bill Evans', 'Rootless', 'Classic'],
    description: 'Smooth rootless voicing starting on the third with 9th on top.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'm9-quartal-clustered-f5',
    chordSymbol: 'Dm11(9)',
    name: 'Schneider "Butter 11" Stack',
    root: 'D',
    family: 'Minor',
    topNote: 'F5',
    topPitchClass: 'F',
    midiNotes: [50, 57, 60, 64, 67, 77], // D3, A3, C4, E4, G4, F5 (b7, 9, 11, b3)
    recipe: ['1', '5', 'b7', '9', '11', 'b3'],
    styleTags: ['Schneider', 'Neo-Soul', 'Lush'],
    description: 'Stack of 4ths in mid-register with singing minor 3rd melody.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'dom13b9-evans-rootless-bb4',
    chordSymbol: 'C13(b9)',
    name: 'Rootless 13(b9) Tension',
    root: 'C',
    family: 'Dominant',
    topNote: 'Bb4',
    topPitchClass: 'Bb',
    midiNotes: [52, 57, 61, 64, 70], // E3, A3(13), C#4(Db4=b9), E4, Bb4(b7)
    recipe: ['3', '6/13', 'b9', '3', 'b7'],
    styleTags: ['Rootless', 'Bebop', 'Tension'],
    description: 'Bill Evans rootless dominant with poignant minor-second internal friction.',
    bassNoteMidi: 36, // C2
  },
  {
    id: 'alt7-sharp9-soul-a5',
    chordSymbol: 'F#7alt',
    name: 'Modern R&B 7alt Turnaround',
    root: 'F#',
    family: 'Altered',
    topNote: 'A5',
    topPitchClass: 'A',
    midiNotes: [42, 52, 58, 64, 69, 81], // F#2, E3, A#3, E4, A4(#9), A5(#9)
    recipe: ['1', 'b7', '3', 'b7', '#9', '#9'],
    styleTags: ['Neo-Soul', 'Turnaround', 'Powerful'],
    description: 'Electrifying altered dominant leading with undeniable momentum into Bm9.',
    bassNoteMidi: 30, // F#1
  },
  {
    id: 'maj7-lydian-bright-b5',
    chordSymbol: 'Fmaj7(#11)',
    name: 'F Lydian Dreamscape',
    root: 'F',
    family: 'Major',
    topNote: 'B5',
    topPitchClass: 'B',
    midiNotes: [41, 53, 60, 64, 69, 83], // F2, F3, C4, E4, A4, B5
    recipe: ['1', '1', '5', '7', '3', '#11'],
    styleTags: ['Lydian', 'Dreamy', 'Ethereal'],
    description: 'High register #11 overtone over a warm deep F fundamental.',
    bassNoteMidi: 29, // F1
  },
  {
    id: 'm7b5-drop2-ab4',
    chordSymbol: 'Dm7(b5)',
    name: 'Drop-2 Half-Diminished',
    root: 'D',
    family: 'Half-Diminished',
    topNote: 'Ab4',
    topPitchClass: 'Ab',
    midiNotes: [50, 56, 60, 65, 68], // D3, Ab3, C4, F4, Ab4
    recipe: ['1', '#11/b5', 'b7', 'b3', '#11/b5'],
    styleTags: ['Drop-2', 'Minor ii-V', 'Pure'],
    description: 'Clean textbook drop-2 voicing with flat five on top.',
    bassNoteMidi: 38, // D2
  },
  {
    id: 'sus-neo-soul-smooth-e5',
    chordSymbol: 'Bb9sus4',
    name: 'Gospel 9sus4 (Ab/Bb)',
    root: 'Bb',
    family: 'Suspended',
    topNote: 'Eb5',
    topPitchClass: 'Eb',
    midiNotes: [46, 56, 60, 63, 68, 75], // Bb2, Ab3, C4, Eb4, Ab4, Eb5
    recipe: ['1', 'b7', '9', '11', 'b7', '11'],
    styleTags: ['Gospel', 'Slash Chord', 'Soul'],
    description: 'Ab major triad over Bb bass. The warm sound of modern church worship & R&B.',
    bassNoteMidi: 34, // Bb1
  },
  {
    id: 'maj9-stevie-wonder-csharp5',
    chordSymbol: 'Amaj9',
    name: 'Stevie Wonder Golden Maj9',
    root: 'A',
    family: 'Major',
    topNote: 'C#5',
    topPitchClass: 'C#',
    midiNotes: [45, 52, 59, 63, 68, 73], // A2, E3, B3, D#4, G#4, C#5
    recipe: ['1', '5', '9', '#11', '7', '3'],
    styleTags: ['Stevie Wonder', 'Golden Era', 'Majestic'],
    description: 'Rich open acoustic voicing straight out of Songs in the Key of Life.',
    bassNoteMidi: 33, // A1
  },
];

/**
 * Transpose a Voicing by a semitone delta.
 * Keeps chord symbol and recipe properly updated.
 */
export function transposeVoicing(voicing: Voicing, semitones: number): Voicing {
  if (semitones === 0) return voicing;

  const newMidiNotes = voicing.midiNotes.map((m) => m + semitones);
  const newBassMidi = voicing.bassNoteMidi ? voicing.bassNoteMidi + semitones : undefined;

  const newTopMidi = newMidiNotes[newMidiNotes.length - 1];
  const newTopNote = midiToNoteName(newTopMidi);
  const newTopPitchClass = getPitchClass(newTopNote);

  // Transpose root
  const rootMidi = noteNameToMidi(`${voicing.root}4`);
  const newRootMidi = rootMidi + semitones;
  const newRootNote = midiToNoteName(newRootMidi);
  const newRootPitchClass = getPitchClass(newRootNote);

  // Transpose chord symbol prefix
  const originalSymbol = voicing.chordSymbol;
  let newSymbol = originalSymbol;
  // Replace leading root letter (e.g. "Cmaj9#11" -> "Dmaj9#11")
  const rootRegex = /^[A-G][#b]?/;
  newSymbol = originalSymbol.replace(rootRegex, newRootPitchClass);

  return {
    ...voicing,
    id: `${voicing.id}-t${semitones > 0 ? `+${semitones}` : semitones}`,
    root: newRootPitchClass,
    chordSymbol: newSymbol,
    topNote: newTopNote,
    topPitchClass: newTopPitchClass,
    midiNotes: newMidiNotes,
    bassNoteMidi: newBassMidi,
  };
}

/**
 * Get all available voicings for a specific Top Note pitch class & optional octave.
 * Dynamically transposes our rich database so that ANY target top note has an
 * abundant selection of 40+ authentic voicings across all chord families!
 */
export function getVoicingsForTopNote(
  targetPitchClass: PitchClass,
  targetOctave: number = 5,
  familyFilter?: ChordFamily | 'All'
): Voicing[] {
  const normTarget = normalizePitchClass(targetPitchClass);
  const targetTopMidi = noteNameToMidi(`${normTarget}${targetOctave}`);

  const results: Voicing[] = [];
  const seenSymbols = new Set<string>();

  // 1. Direct seed matches first
  for (const v of SEED_VOICINGS) {
    if (familyFilter && familyFilter !== 'All' && v.family !== familyFilter) continue;

    if (v.topPitchClass === normTarget) {
      results.push(v);
      seenSymbols.add(v.chordSymbol);
    }
  }

  // 2. Transposed matches to guarantee rich options for any note
  for (const v of SEED_VOICINGS) {
    if (familyFilter && familyFilter !== 'All' && v.family !== familyFilter) continue;

    // Calculate semitone delta needed to bring v's top note to targetTopMidi
    const currentTopMidi = v.midiNotes[v.midiNotes.length - 1];
    let delta = targetTopMidi - currentTopMidi;

    // Normalize delta so it doesn't shift more than 6 semitones up or down if possible
    while (delta > 6) delta -= 12;
    while (delta < -6) delta += 12;

    const transposed = transposeVoicing(v, delta);

    // Keep within reasonable piano range (top note within target octave ± 1)
    if (
      transposed.topPitchClass === normTarget &&
      !seenSymbols.has(transposed.chordSymbol)
    ) {
      results.push(transposed);
      seenSymbols.add(transposed.chordSymbol);
    }
  }

  return results;
}
