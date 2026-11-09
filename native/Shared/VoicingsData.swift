//
// VoicingsData.swift
// HarmonyLab AUv3 MIDI FX
//

import Foundation

public enum ChordFamily: String, CaseIterable, Identifiable, Codable {
    case all = "All"
    case major = "Major"
    case minor = "Minor"
    case dominant = "Dominant"
    case altered = "Altered"
    case halfDiminished = "Half-Diminished"
    case diminished = "Diminished"
    case suspended = "Suspended"

    public var id: String { rawValue }
}

public struct NativeVoicing: Identifiable, Equatable, Codable {
    public let id: String
    public let chordSymbol: String
    public let name: String
    public let root: String
    public let family: ChordFamily
    public let topNote: String
    public let topPitchClass: String
    public let midiNotes: [UInt8]
    public let recipe: [String]
    public let styleTags: [String]
    public let descriptionText: String
    public let bassNoteMidi: UInt8?

    public init(
        id: String,
        chordSymbol: String,
        name: String,
        root: String,
        family: ChordFamily,
        topNote: String,
        topPitchClass: String,
        midiNotes: [UInt8],
        recipe: [String],
        styleTags: [String],
        descriptionText: String,
        bassNoteMidi: UInt8? = nil
    ) {
        self.id = id
        self.chordSymbol = chordSymbol
        self.name = name
        self.root = root
        self.family = family
        self.topNote = topNote
        self.topPitchClass = topPitchClass
        self.midiNotes = midiNotes
        self.recipe = recipe
        self.styleTags = styleTags
        self.descriptionText = descriptionText
        self.bassNoteMidi = bassNoteMidi
    }
}

public struct ChordSlot: Identifiable, Equatable, Codable {
    public let id: Int
    public var chord: NativeVoicing?
    public var customName: String?

    public init(id: Int, chord: NativeVoicing? = nil, customName: String? = nil) {
        self.id = id
        self.chord = chord
        self.customName = customName
    }
}

public struct ChordHistoryItem: Identifiable, Equatable, Codable {
    public let id: String
    public let chord: NativeVoicing
    public let timestamp: Date

    public init(id: String = UUID().uuidString, chord: NativeVoicing, timestamp: Date = Date()) {
        self.id = id
        self.chord = chord
        self.timestamp = timestamp
    }
}

public class VoicingsEngine {
    public static let shared = VoicingsEngine()

    public static let pitchClasses: [String] = [
        "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"
    ]

    public static let sharpNames: [String] = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    ]

    public static func normalizePitchClass(_ pc: String) -> String {
        switch pc.trimmingCharacters(in: .whitespaces) {
        case "Db": return "C#"
        case "D#": return "Eb"
        case "Gb": return "F#"
        case "G#": return "Ab"
        case "A#": return "Bb"
        case "E#": return "F"
        case "B#": return "C"
        case "Cb": return "B"
        case "Fb": return "E"
        default: return pc
        }
    }

    public static func noteNameToMidi(_ noteName: String) -> UInt8 {
        let pattern = "^([A-G][b#]?)(-?\\d+)$"
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return 60 }
        let nsString = noteName as NSString
        guard let match = regex.firstMatch(in: noteName, range: NSRange(location: 0, length: nsString.length)),
              match.numberOfRanges == 3 else {
            return 60
        }
        let pcStr = nsString.substring(with: match.range(at: 1))
        let octStr = nsString.substring(with: match.range(at: 2))
        let oct = Int(octStr) ?? 4
        let norm = normalizePitchClass(pcStr)
        let idx = pitchClasses.firstIndex(of: norm) ?? 0
        let midi = (oct + 1) * 12 + idx
        return UInt8(clamping: midi)
    }

    public static func midiToNoteName(_ midi: UInt8) -> String {
        let oct = (Int(midi) / 12) - 1
        let idx = Int(midi) % 12
        return "\(sharpNames[idx])\(oct)"
    }

    public static func parseNoteName(_ noteName: String) -> (pitchClass: String, octave: Int) {
        let midi = noteNameToMidi(noteName)
        let oct = (Int(midi) / 12) - 1
        let pc = sharpNames[Int(midi) % 12]
        return (pc, oct)
    }

    public static let seedVoicings: [NativeVoicing] = [
        NativeVoicing(
            id: "maj9-lydian-e5",
            chordSymbol: "Cmaj9(#11)",
            name: "Maj9(#11) Lydian Spread",
            root: "C",
            family: ChordFamily.major,
            topNote: "E5",
            topPitchClass: "E",
            midiNotes: [48, 59, 62, 66, 76],
            recipe: ["1", "7", "9", "#11", "3"],
            styleTags: ["Modern Jazz", "Lydian", "Open Spread"],
            descriptionText: "Ethereal modern jazz voicing with #11 color and wide interval resonance.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "maj9-neosoul-cluster-d5",
            chordSymbol: "Fmaj9",
            name: "Neo-Soul Maj9 Cluster",
            root: "F",
            family: ChordFamily.major,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [53, 60, 64, 65, 69, 74],
            recipe: ["1", "5", "7", "1", "3", "6/13"],
            styleTags: ["Neo-Soul", "Cluster", "Rich"],
            descriptionText: "Luscious tight cluster in the inner voices with the 13th soaring on top.",
            bassNoteMidi: 41
        ),
        NativeVoicing(
            id: "maj7-drop2-b4",
            chordSymbol: "Cmaj7",
            name: "Drop-2 Maj7",
            root: "C",
            family: ChordFamily.major,
            topNote: "B4",
            topPitchClass: "B",
            midiNotes: [48, 55, 64, 71],
            recipe: ["1", "5", "3", "7"],
            styleTags: ["Drop-2", "Classic Jazz", "Clean"],
            descriptionText: "Essential drop-2 jazz piano voicing with the major 7th in the soprano voice.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "maj69-gospel-a4",
            chordSymbol: "C6/9",
            name: "Gospel 6/9 Warmth",
            root: "C",
            family: ChordFamily.major,
            topNote: "A4",
            topPitchClass: "A",
            midiNotes: [48, 52, 57, 62, 69],
            recipe: ["1", "3", "6", "9", "6"],
            styleTags: ["Gospel", "Neo-Soul", "Warm"],
            descriptionText: "Pure warmth without the tension of a natural 7th. Quintessential R&B staple.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "maj13-evans-g4",
            chordSymbol: "Ebmaj13",
            name: "Bill Evans Maj13 Rootless",
            root: "Eb",
            family: ChordFamily.major,
            topNote: "G4",
            topPitchClass: "G",
            midiNotes: [50, 55, 58, 62, 67],
            recipe: ["7", "3", "5", "7", "3"],
            styleTags: ["Rootless", "Bill Evans", "Cool Jazz"],
            descriptionText: "Famous Type A rootless major voicing creating an uncluttered piano texture.",
            bassNoteMidi: 39
        ),
        NativeVoicing(
            id: "maj9-quartal-g5",
            chordSymbol: "Abmaj9",
            name: "Ab Maj9 Quartal Stack",
            root: "Ab",
            family: ChordFamily.major,
            topNote: "G5",
            topPitchClass: "G",
            midiNotes: [44, 56, 60, 63, 68, 79],
            recipe: ["1", "1", "3", "5", "1", "7"],
            styleTags: ["Modern Jazz", "Concert", "Majestic"],
            descriptionText: "Monumental acoustic voicing with the pure major 7th crowning the upper octave.",
            bassNoteMidi: 32
        ),
        NativeVoicing(
            id: "maj7sharp11-upperstructure-c5",
            chordSymbol: "Dbmaj7(#11)",
            name: "Db Maj7(#11) Upper Structure",
            root: "C#",
            family: ChordFamily.major,
            topNote: "C5",
            topPitchClass: "C",
            midiNotes: [49, 56, 61, 67, 72],
            recipe: ["1", "5", "1", "#11", "7"],
            styleTags: ["Upper Structure", "Film Score", "Lydian"],
            descriptionText: "Open fifths in left hand with an Eb triad superimposed in right hand.",
            bassNoteMidi: 37
        ),
        NativeVoicing(
            id: "m9-butter-e5",
            chordSymbol: "Dm9",
            name: "Neo-Soul Butter Minor 9",
            root: "D",
            family: ChordFamily.minor,
            topNote: "E5",
            topPitchClass: "E",
            midiNotes: [50, 57, 60, 65, 69, 76],
            recipe: ["1", "5", "b7", "b3", "5", "9"],
            styleTags: ["Neo-Soul", "R&B", "Velvety"],
            descriptionText: "The golden standard R&B minor 9 chord with rich interval spacing.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "m11-sowhat-d5",
            chordSymbol: "Em11",
            name: "\"So What\" Quartal Minor 11",
            root: "E",
            family: ChordFamily.minor,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [52, 57, 62, 67, 71, 74],
            recipe: ["1", "11", "b7", "b3", "5", "b7"],
            styleTags: ["Quartal", "Miles Davis", "Modal"],
            descriptionText: "The iconic Miles Davis / Bill Evans modal voicing stacked in perfect fourths.",
            bassNoteMidi: 40
        ),
        NativeVoicing(
            id: "m11-kennybarron-g5",
            chordSymbol: "Am11",
            name: "Kenny Barron Minor 11 Stasis",
            root: "A",
            family: ChordFamily.minor,
            topNote: "G5",
            topPitchClass: "G",
            midiNotes: [45, 52, 57, 62, 67, 72, 79],
            recipe: ["1", "5", "1", "11", "b7", "b3", "b7"],
            styleTags: ["Modern Jazz", "Wide", "Resonant"],
            descriptionText: "Tower of fourths over deep fifths used constantly by modern post-bop pianists.",
            bassNoteMidi: 33
        ),
        NativeVoicing(
            id: "m9-rootless-b-c5",
            chordSymbol: "Fm9",
            name: "Bill Evans Minor 9 (Type B)",
            root: "F",
            family: ChordFamily.minor,
            topNote: "C5",
            topPitchClass: "C",
            midiNotes: [51, 55, 58, 63, 72],
            recipe: ["b7", "9", "b3", "b7", "5"],
            styleTags: ["Rootless", "Bill Evans", "Sophisticated"],
            descriptionText: "Rootless Type B minor voicing with smooth voice-leading potential.",
            bassNoteMidi: 41
        ),
        NativeVoicing(
            id: "mmaj9-noir-fsharp5",
            chordSymbol: "Bm(maj9)",
            name: "Film Noir Minor-Major 9",
            root: "B",
            family: ChordFamily.minor,
            topNote: "F#5",
            topPitchClass: "F#",
            midiNotes: [47, 54, 58, 61, 66, 78],
            recipe: ["1", "5", "7", "9", "5", "5"],
            styleTags: ["Film Noir", "Mysterious", "Melodic Minor"],
            descriptionText: "Haunting harmonic minor / melodic minor sound with natural 7 tension.",
            bassNoteMidi: 35
        ),
        NativeVoicing(
            id: "m11-glasper-cluster-a5",
            chordSymbol: "Gm11",
            name: "Glasper Minor 11 Cluster",
            root: "G",
            family: ChordFamily.minor,
            topNote: "A5",
            topPitchClass: "A",
            midiNotes: [43, 53, 58, 60, 62, 69, 81],
            recipe: ["1", "b7", "b3", "11", "5", "9", "9"],
            styleTags: ["Neo-Soul", "Glasper", "Hip-Hop Jazz"],
            descriptionText: "Subtle 2nd rub between Bb and C creating rich contemporary texture.",
            bassNoteMidi: 31
        ),
        NativeVoicing(
            id: "dom13-schneider-e5",
            chordSymbol: "G13",
            name: "Jeff Schneider Slick 13th",
            root: "G",
            family: ChordFamily.dominant,
            topNote: "E5",
            topPitchClass: "E",
            midiNotes: [43, 53, 59, 64, 69, 76],
            recipe: ["1", "b7", "3", "13", "9", "13"],
            styleTags: ["Neo-Soul", "Schneider", "Punchy"],
            descriptionText: "Tritone guide tones in LH with pentatonic / quartal stack in RH.",
            bassNoteMidi: 31
        ),
        NativeVoicing(
            id: "dom9sharp11-lydiandom-fsharp5",
            chordSymbol: "C9(#11)",
            name: "Lydian Dominant 9(#11)",
            root: "C",
            family: ChordFamily.dominant,
            topNote: "F#5",
            topPitchClass: "F#",
            midiNotes: [48, 58, 62, 64, 69, 78],
            recipe: ["1", "b7", "9", "3", "13", "#11"],
            styleTags: ["Lydian Dominant", "Modern Jazz", "Bright"],
            descriptionText: "Acoustic scale harmony with sparkling #11 (tritone) on the very top.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "dom13b9-soul-d5",
            chordSymbol: "F13(b9)",
            name: "Stevie Wonder 13(b9)",
            root: "F",
            family: ChordFamily.dominant,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [41, 51, 57, 62, 66, 74],
            recipe: ["1", "b7", "3", "13", "b9", "13"],
            styleTags: ["Neo-Soul", "Gospel", "Tension"],
            descriptionText: "Sensational resolving chord used constantly in gospel and Stevie Wonder ballads.",
            bassNoteMidi: 29
        ),
        NativeVoicing(
            id: "dom9-drop2-b4",
            chordSymbol: "A9",
            name: "West Coast 9th Drop-2",
            root: "A",
            family: ChordFamily.dominant,
            topNote: "B4",
            topPitchClass: "B",
            midiNotes: [45, 55, 61, 64, 71],
            recipe: ["1", "b7", "3", "5", "9"],
            styleTags: ["Funk", "West Coast", "Crisp"],
            descriptionText: "Crisp funk/blues voicing with high 9th extension singing on top.",
            bassNoteMidi: 33
        ),
        NativeVoicing(
            id: "dom7sharp9-hendrix-eb5",
            chordSymbol: "C7(#9)",
            name: "Purple Soul 7(#9)",
            root: "C",
            family: ChordFamily.dominant,
            topNote: "Eb5",
            topPitchClass: "Eb",
            midiNotes: [48, 58, 64, 70, 75],
            recipe: ["1", "b7", "3", "b7", "#9"],
            styleTags: ["Blues", "Neo-Soul", "Gritty"],
            descriptionText: "The famous sharp-nine chord with natural 3 and minor 3 enharmonic collision.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "alt7-tritone-sub-bb4",
            chordSymbol: "E7alt",
            name: "Altered Dominant (Tritone Sub)",
            root: "E",
            family: ChordFamily.altered,
            topNote: "Bb4",
            topPitchClass: "Bb",
            midiNotes: [40, 50, 56, 62, 65, 70],
            recipe: ["1", "b7", "3", "b7", "b9", "#11/b5"],
            styleTags: ["Altered", "Tritone Sub", "Dark"],
            descriptionText: "Fully altered dominant ready to resolve with maximum momentum to Am.",
            bassNoteMidi: 28
        ),
        NativeVoicing(
            id: "alt7-sharp9-sharp5-g5",
            chordSymbol: "A7(#9#5)",
            name: "Super-Locrian 7(#9#5)",
            root: "A",
            family: ChordFamily.altered,
            topNote: "G5",
            topPitchClass: "G",
            midiNotes: [45, 55, 61, 68, 72, 79],
            recipe: ["1", "b7", "3", "#5/b13", "#9", "b7"],
            styleTags: ["Altered", "Modern Jazz", "Intense"],
            descriptionText: "Peak harmonic tension voicing resolving masterfully to Dmaj9 or Dm9.",
            bassNoteMidi: 33
        ),
        NativeVoicing(
            id: "alt7-upperstructure-triad-ab5",
            chordSymbol: "C7alt",
            name: "C7alt (Ab Triad Superimposed)",
            root: "C",
            family: ChordFamily.altered,
            topNote: "Ab5",
            topPitchClass: "Ab",
            midiNotes: [48, 58, 64, 68, 72, 80],
            recipe: ["1", "b7", "3", "#5/b13", "1", "#5/b13"],
            styleTags: ["Upper Structure", "Clean Tension", "Neo-Soul"],
            descriptionText: "C7 shell in the bass with an Ab major triad in the right hand.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "alt7-b9b13-fsharp5",
            chordSymbol: "B7(b9,b13)",
            name: "B7(b9,b13) Dark Gospel",
            root: "B",
            family: ChordFamily.altered,
            topNote: "F#5",
            topPitchClass: "F#",
            midiNotes: [47, 57, 63, 67, 73, 78],
            recipe: ["1", "b7", "3", "#5/b13", "b9", "5"],
            styleTags: ["Gospel", "Altered", "Rich"],
            descriptionText: "Deep soulful turnaround chord for gospel and neo-soul ballads.",
            bassNoteMidi: 35
        ),
        NativeVoicing(
            id: "sus-quartal-d5",
            chordSymbol: "G7sus4(9)",
            name: "Neo-Soul Quartal 7sus",
            root: "G",
            family: ChordFamily.suspended,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [43, 53, 58, 62, 67, 74],
            recipe: ["1", "b7", "#9", "5", "1", "5"],
            styleTags: ["Quartal", "Neo-Soul", "Open"],
            descriptionText: "Ambiguous open quartal sound that floats without requiring immediate resolution.",
            bassNoteMidi: 31
        ),
        NativeVoicing(
            id: "sus-13sus4-a4",
            chordSymbol: "D13sus4",
            name: "Herbie Hancock 13sus4",
            root: "D",
            family: ChordFamily.suspended,
            topNote: "A4",
            topPitchClass: "A",
            midiNotes: [50, 57, 60, 64, 67, 69],
            recipe: ["1", "5", "b7", "9", "11", "5"],
            styleTags: ["Herbie Hancock", "Maiden Voyage", "Floating"],
            descriptionText: "Slash chord voicing (Cmaj7 / D). The Maiden Voyage modal foundation.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "sus-phrygian-c5",
            chordSymbol: "Esus4(b9)",
            name: "Flamenco Phrygian Sus(b9)",
            root: "E",
            family: ChordFamily.suspended,
            topNote: "C5",
            topPitchClass: "C",
            midiNotes: [40, 52, 57, 61, 65, 72],
            recipe: ["1", "1", "11", "6/13", "b9", "#5/b13"],
            styleTags: ["Phrygian", "Exotic", "Dramatic"],
            descriptionText: "Evocative Spanish / Flamenco sus chord with flat 9 and flat 6 coloration.",
            bassNoteMidi: 28
        ),
        NativeVoicing(
            id: "m7b5-halfdim-f5",
            chordSymbol: "Bm7(b5)",
            name: "Modern Half-Diminished 11",
            root: "B",
            family: ChordFamily.halfDiminished,
            topNote: "F5",
            topPitchClass: "F",
            midiNotes: [47, 53, 57, 62, 65, 77],
            recipe: ["1", "#11/b5", "b7", "b3", "#11/b5", "#11/b5"],
            styleTags: ["Minor ii-V", "Open", "Melancholic"],
            descriptionText: "Pristine half-diminished voicing, opening step of a minor 2-5-1 progression.",
            bassNoteMidi: 35
        ),
        NativeVoicing(
            id: "dim7-symmetrical-ab5",
            chordSymbol: "F#dim7",
            name: "Symmetrical Barry Harris Dim7",
            root: "F#",
            family: ChordFamily.diminished,
            topNote: "Ab5",
            topPitchClass: "Ab",
            midiNotes: [42, 51, 57, 60, 66, 80],
            recipe: ["1", "6/13", "b3", "#11/b5", "1", "9"],
            styleTags: ["Barry Harris", "Bebop", "Passing"],
            descriptionText: "Diminished chord with added major scale step passing tone on top.",
            bassNoteMidi: 30
        ),
        NativeVoicing(
            id: "m11b5-neo-e5",
            chordSymbol: "Em11(b5)",
            name: "Neo-Soul Locrian 9th",
            root: "E",
            family: ChordFamily.halfDiminished,
            topNote: "E5",
            topPitchClass: "E",
            midiNotes: [40, 50, 53, 58, 62, 76],
            recipe: ["1", "b7", "b9", "#11/b5", "b7", "1"],
            styleTags: ["Locrian Natural 2", "Modern", "Spacious"],
            descriptionText: "Spacious Locrian voicing with tonic melody resonance.",
            bassNoteMidi: 28
        ),
        NativeVoicing(
            id: "maj9-drop24-c5",
            chordSymbol: "Abmaj9",
            name: "Drop 2 & 4 Velvet Maj9",
            root: "Ab",
            family: ChordFamily.major,
            topNote: "C5",
            topPitchClass: "C",
            midiNotes: [44, 51, 58, 63, 72],
            recipe: ["1", "5", "9", "5", "3"],
            styleTags: ["Drop 2&4", "Velvet", "Wide"],
            descriptionText: "Luxurious broad voicing often heard in D’Angelo and Erykah Badu productions.",
            bassNoteMidi: 32
        ),
        NativeVoicing(
            id: "maj7sharp11-stravinsky-a5",
            chordSymbol: "Dmaj7(#11)",
            name: "Lydian Starburst",
            root: "D",
            family: ChordFamily.major,
            topNote: "A5",
            topPitchClass: "A",
            midiNotes: [50, 57, 61, 66, 68, 81],
            recipe: ["1", "5", "7", "3", "#11", "5"],
            styleTags: ["Cinematic", "Lydian", "Luminous"],
            descriptionText: "A luminous filmic chord with sharp 11 nestled beneath the melodic octave 5th.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "m9-smooth-g4",
            chordSymbol: "Eb9(sus)",
            name: "Smooth R&B 9sus4",
            root: "Eb",
            family: ChordFamily.suspended,
            topNote: "G4",
            topPitchClass: "G",
            midiNotes: [39, 51, 58, 61, 65, 67],
            recipe: ["1", "1", "5", "b7", "9", "3"],
            styleTags: ["R&B", "90s Soul", "Warm"],
            descriptionText: "The definitive 90s slow jam chord voicing with the third sweetly positioned on top.",
            bassNoteMidi: 27
        ),
        NativeVoicing(
            id: "dom13-drop3-f5",
            chordSymbol: "Bb13",
            name: "Drop-3 Big Band 13th",
            root: "Bb",
            family: ChordFamily.dominant,
            topNote: "F5",
            topPitchClass: "F",
            midiNotes: [46, 56, 62, 67, 77],
            recipe: ["1", "b7", "3", "13", "5"],
            styleTags: ["Drop-3", "Big Band", "Brass"],
            descriptionText: "Classic jazz guitar and piano voicing with fifth singing on top.",
            bassNoteMidi: 34
        ),
        NativeVoicing(
            id: "m11-soul-bb4",
            chordSymbol: "Cm11",
            name: "Chicago Soul Minor 11",
            root: "C",
            family: ChordFamily.minor,
            topNote: "Bb4",
            topPitchClass: "Bb",
            midiNotes: [48, 55, 60, 63, 65, 70],
            recipe: ["1", "5", "1", "b3", "11", "b7"],
            styleTags: ["Chicago Soul", "Gospel", "Deep"],
            descriptionText: "Warm, low-mid weight minor 11 voicing popular in Donny Hathaway arrangements.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "alt7-sharp9-b5-fsharp5",
            chordSymbol: "D7(#9#5)",
            name: "Neo-Soul Turnaround 7alt",
            root: "D",
            family: ChordFamily.altered,
            topNote: "F#5",
            topPitchClass: "F#",
            midiNotes: [50, 58, 62, 66, 74, 78],
            recipe: ["1", "#5/b13", "1", "3", "1", "3"],
            styleTags: ["Turnaround", "Neo-Soul", "Crisp"],
            descriptionText: "Crunchy altered voicing providing undeniable pull towards Gmaj9 or Gm9.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "maj9-robertglasper-f5",
            chordSymbol: "Bbmaj9",
            name: "Glasper Velvet Maj9",
            root: "Bb",
            family: ChordFamily.major,
            topNote: "F5",
            topPitchClass: "F",
            midiNotes: [46, 57, 60, 62, 69, 77],
            recipe: ["1", "7", "9", "3", "7", "5"],
            styleTags: ["Robert Glasper", "Neo-Soul", "Spacious"],
            descriptionText: "Signature Glasper open left hand with clustered extension right hand.",
            bassNoteMidi: 34
        ),
        NativeVoicing(
            id: "dim7-passing-dsharp5",
            chordSymbol: "Adim7",
            name: "Gospel Passing Diminished",
            root: "A",
            family: ChordFamily.diminished,
            topNote: "Eb5",
            topPitchClass: "Eb",
            midiNotes: [45, 54, 57, 63, 69, 75],
            recipe: ["1", "6/13", "1", "#11/b5", "1", "#11/b5"],
            styleTags: ["Gospel", "Passing", "Tension"],
            descriptionText: "The quintessential passing diminished chord between IV and I.",
            bassNoteMidi: 33
        ),
        NativeVoicing(
            id: "m9-phrygian-soul-bb5",
            chordSymbol: "Gm9",
            name: "Modern Neo-Soul High Octave m9",
            root: "G",
            family: ChordFamily.minor,
            topNote: "Bb5",
            topPitchClass: "Bb",
            midiNotes: [43, 53, 57, 62, 70, 82],
            recipe: ["1", "b7", "9", "5", "b3", "b3"],
            styleTags: ["Neo-Soul", "High Melody", "Clear"],
            descriptionText: "Allows the minor third to cry out at the peak of the piano register.",
            bassNoteMidi: 31
        ),
        NativeVoicing(
            id: "dom13-funk-b4",
            chordSymbol: "E13",
            name: "Steely Dan Mu-Major 13",
            root: "E",
            family: ChordFamily.dominant,
            topNote: "B4",
            topPitchClass: "B",
            midiNotes: [40, 50, 56, 61, 66, 71],
            recipe: ["1", "b7", "3", "13", "9", "5"],
            styleTags: ["Steely Dan", "Funk", "Sophisticated"],
            descriptionText: "Quartal-flavored dominant voicing with clear voice projection.",
            bassNoteMidi: 28
        ),
        NativeVoicing(
            id: "sus-gospel-praise-csharp5",
            chordSymbol: "F#7sus4",
            name: "Sunday Morning 7sus4",
            root: "F#",
            family: ChordFamily.suspended,
            topNote: "C#5",
            topPitchClass: "C#",
            midiNotes: [42, 49, 54, 61, 64, 73],
            recipe: ["1", "5", "1", "5", "b7", "5"],
            styleTags: ["Gospel", "Praise", "Triumphant"],
            descriptionText: "Broad resonant fifths and fourths giving immense sonic power.",
            bassNoteMidi: 30
        ),
        NativeVoicing(
            id: "m11-dangelo-c5",
            chordSymbol: "Abm11",
            name: "D’Angelo Brown Sugar m11",
            root: "Ab",
            family: ChordFamily.minor,
            topNote: "C#5",
            topPitchClass: "C#",
            midiNotes: [44, 54, 59, 63, 68, 73],
            recipe: ["1", "b7", "b3", "5", "1", "11"],
            styleTags: ["D’Angelo", "Neo-Soul", "Groove"],
            descriptionText: "Deep soulful minor 11 with the 11th hovering in the vocal sweet spot.",
            bassNoteMidi: 32
        ),
        NativeVoicing(
            id: "maj7-upper-d5",
            chordSymbol: "Gmaj7",
            name: "Acoustic Folk-Soul Maj7",
            root: "G",
            family: ChordFamily.major,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [43, 50, 55, 66, 71, 74],
            recipe: ["1", "5", "1", "7", "3", "5"],
            styleTags: ["Folk-Soul", "Open Strings", "Warm"],
            descriptionText: "Resonant fifth-based voicing ringing out like an acoustic guitar.",
            bassNoteMidi: 31
        ),
        NativeVoicing(
            id: "dom7-sharp11-monk-eb5",
            chordSymbol: "A7(#11)",
            name: "Thelonious Monk Tritone 7(#11)",
            root: "A",
            family: ChordFamily.dominant,
            topNote: "Eb5",
            topPitchClass: "Eb",
            midiNotes: [45, 55, 61, 67, 75],
            recipe: ["1", "b7", "3", "b7", "#11/b5"],
            styleTags: ["Thelonious Monk", "Bebop", "Sharp"],
            descriptionText: "Unforgiving, crystalline tritone bite directly on the top voice.",
            bassNoteMidi: 33
        ),
        NativeVoicing(
            id: "maj9-bill-evans-d5",
            chordSymbol: "Cmaj9",
            name: "Bill Evans Maj9 (Type B)",
            root: "C",
            family: ChordFamily.major,
            topNote: "D5",
            topPitchClass: "D",
            midiNotes: [52, 55, 59, 62, 74],
            recipe: ["3", "5", "7", "9", "9"],
            styleTags: ["Bill Evans", "Rootless", "Classic"],
            descriptionText: "Smooth rootless voicing starting on the third with 9th on top.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "m9-quartal-clustered-f5",
            chordSymbol: "Dm11(9)",
            name: "Schneider \"Butter 11\" Stack",
            root: "D",
            family: ChordFamily.minor,
            topNote: "F5",
            topPitchClass: "F",
            midiNotes: [50, 57, 60, 64, 67, 77],
            recipe: ["1", "5", "b7", "9", "11", "b3"],
            styleTags: ["Schneider", "Neo-Soul", "Lush"],
            descriptionText: "Stack of 4ths in mid-register with singing minor 3rd melody.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "dom13b9-evans-rootless-bb4",
            chordSymbol: "C13(b9)",
            name: "Rootless 13(b9) Tension",
            root: "C",
            family: ChordFamily.dominant,
            topNote: "Bb4",
            topPitchClass: "Bb",
            midiNotes: [52, 57, 61, 64, 70],
            recipe: ["3", "6/13", "b9", "3", "b7"],
            styleTags: ["Rootless", "Bebop", "Tension"],
            descriptionText: "Bill Evans rootless dominant with poignant minor-second internal friction.",
            bassNoteMidi: 36
        ),
        NativeVoicing(
            id: "alt7-sharp9-soul-a5",
            chordSymbol: "F#7alt",
            name: "Modern R&B 7alt Turnaround",
            root: "F#",
            family: ChordFamily.altered,
            topNote: "A5",
            topPitchClass: "A",
            midiNotes: [42, 52, 58, 64, 69, 81],
            recipe: ["1", "b7", "3", "b7", "#9", "#9"],
            styleTags: ["Neo-Soul", "Turnaround", "Powerful"],
            descriptionText: "Electrifying altered dominant leading with undeniable momentum into Bm9.",
            bassNoteMidi: 30
        ),
        NativeVoicing(
            id: "maj7-lydian-bright-b5",
            chordSymbol: "Fmaj7(#11)",
            name: "F Lydian Dreamscape",
            root: "F",
            family: ChordFamily.major,
            topNote: "B5",
            topPitchClass: "B",
            midiNotes: [41, 53, 60, 64, 69, 83],
            recipe: ["1", "1", "5", "7", "3", "#11"],
            styleTags: ["Lydian", "Dreamy", "Ethereal"],
            descriptionText: "High register #11 overtone over a warm deep F fundamental.",
            bassNoteMidi: 29
        ),
        NativeVoicing(
            id: "m7b5-drop2-ab4",
            chordSymbol: "Dm7(b5)",
            name: "Drop-2 Half-Diminished",
            root: "D",
            family: ChordFamily.halfDiminished,
            topNote: "Ab4",
            topPitchClass: "Ab",
            midiNotes: [50, 56, 60, 65, 68],
            recipe: ["1", "#11/b5", "b7", "b3", "#11/b5"],
            styleTags: ["Drop-2", "Minor ii-V", "Pure"],
            descriptionText: "Clean textbook drop-2 voicing with flat five on top.",
            bassNoteMidi: 38
        ),
        NativeVoicing(
            id: "sus-neo-soul-smooth-e5",
            chordSymbol: "Bb9sus4",
            name: "Gospel 9sus4 (Ab/Bb)",
            root: "Bb",
            family: ChordFamily.suspended,
            topNote: "Eb5",
            topPitchClass: "Eb",
            midiNotes: [46, 56, 60, 63, 68, 75],
            recipe: ["1", "b7", "9", "11", "b7", "11"],
            styleTags: ["Gospel", "Slash Chord", "Soul"],
            descriptionText: "Ab major triad over Bb bass. The warm sound of modern church worship & R&B.",
            bassNoteMidi: 34
        ),
        NativeVoicing(
            id: "maj9-stevie-wonder-csharp5",
            chordSymbol: "Amaj9",
            name: "Stevie Wonder Golden Maj9",
            root: "A",
            family: ChordFamily.major,
            topNote: "C#5",
            topPitchClass: "C#",
            midiNotes: [45, 52, 59, 63, 68, 73],
            recipe: ["1", "5", "9", "#11", "7", "3"],
            styleTags: ["Stevie Wonder", "Golden Era", "Majestic"],
            descriptionText: "Rich open acoustic voicing straight out of Songs in the Key of Life.",
            bassNoteMidi: 33
        ),
    ]

    public func getVoicings(
        topPitchClass: String,
        topOctave: Int = 5,
        family: ChordFamily = .all
    ) -> [NativeVoicing] {
        let normTarget = VoicingsEngine.normalizePitchClass(topPitchClass)
        let targetTopMidi = VoicingsEngine.noteNameToMidi("\(normTarget)\(topOctave)")

        var results: [NativeVoicing] = []
        var seen = Set<String>()

        for (idx, v) in VoicingsEngine.seedVoicings.enumerated() {
            if family != .all && v.family != family { continue }
            if let transposed = voicingForRecipe(index: idx, targetTopMidi: targetTopMidi) {
                let sig = "\(transposed.chordSymbol)-\(transposed.midiNotes)"
                if !seen.contains(sig) {
                    seen.insert(sig)
                    results.append(transposed)
                }
            }
        }

        return results
    }

    public func voicingForRecipe(index: Int, targetTopMidi: UInt8) -> NativeVoicing? {
        guard index >= 0 && index < VoicingsEngine.seedVoicings.count else { return nil }
        let seed = VoicingsEngine.seedVoicings[index]
        let origTopMidi = VoicingsEngine.noteNameToMidi(seed.topNote)
        let semitoneDelta = Int(targetTopMidi) - Int(origTopMidi)

        var transposedNotes: [UInt8] = []
        for note in seed.midiNotes {
            let shifted = Int(note) + semitoneDelta
            if shifted >= 0 && shifted <= 127 {
                transposedNotes.append(UInt8(shifted))
            }
        }
        guard transposedNotes.count == seed.midiNotes.count else { return nil }

        let origRootMidi = VoicingsEngine.noteNameToMidi("\(seed.root)4")
        let newRootMidi = UInt8(clamping: Int(origRootMidi) + semitoneDelta)
        let newRootName = VoicingsEngine.sharpNames[Int(newRootMidi) % 12]

        var newSymbol = seed.chordSymbol
        if seed.chordSymbol.hasPrefix(seed.root) {
            newSymbol = newRootName + seed.chordSymbol.dropFirst(seed.root.count)
        }

        var newBassMidi: UInt8? = nil
        if let bass = seed.bassNoteMidi {
            let shiftedBass = Int(bass) + semitoneDelta
            if shiftedBass >= 0 && shiftedBass <= 127 {
                newBassMidi = UInt8(shiftedBass)
            }
        }

        let melodyPc = VoicingsEngine.sharpNames[Int(targetTopMidi) % 12]
        let melodyOct = (Int(targetTopMidi) / 12) - 1

        return NativeVoicing(
            id: "\(seed.id)-t\(targetTopMidi)",
            chordSymbol: newSymbol,
            name: seed.name,
            root: newRootName,
            family: seed.family,
            topNote: "\(melodyPc)\(melodyOct)",
            topPitchClass: melodyPc,
            midiNotes: transposedNotes,
            recipe: seed.recipe,
            styleTags: seed.styleTags,
            descriptionText: seed.descriptionText,
            bassNoteMidi: newBassMidi
        )
    }
}
