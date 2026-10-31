# HarmonyLab 🎹
*Inspired by Jeff Schneider’s Sick Chords Lab*

**Live Demo**: [https://pbaarn.github.io/harmonylab](https://pbaarn.github.io/harmonylab)

**HarmonyLab** is a modern piano chord voicing and reharmonization tool where chords are indexed and filtered by their **TOP NOTE** (melody soprano voice) as well as traditional chord roots and qualities.

---

## 🌟 The Philosophy: Top-Note Reharmonization

In traditional music theory tools, chords are indexed primarily by their bass root (e.g. *“C major”*). In modern Jazz, Neo-Soul, Gospel, and R&B arranging, chord selection is driven by the **melody soprano voice**:
> *"I have a melody note (e.g., $E_5$). What rich, evocative chords can I place underneath it?"*

A single top note $E_5$ can be:
- The **3rd** of $\text{Cmaj9}$
- The **9th** of $\text{Dm9}$
- The **13th** of $\text{G13}$
- The **$\sharp$11** of $\text{Bbmaj7}\sharp11$
- The **7th** of $\text{F}\sharp\text{m7}$
- The **$\flat$9** of $\text{Eb7}\flat9$ or $\text{D}\sharp\text{dim7}$
- The **$\sharp$9** of $\text{C}\sharp\text{7}\sharp9$
- The **11th** of $\text{Bm11}$

HarmonyLab indexes chords from the melody down to provide instantaneous harmonic substitutions and voice-leading.

---

## ✨ Features

- **Rich Voicing Database & Transposition Engine**:
  - 30+ hand-crafted Jazz, Neo-Soul, and R&B chord voicings (`Maj9#11`, `m9`, `m11`, `7#9#5`, `13b9`, `7alt`, `6/9`, `Quartal stacks`, `Bill Evans Rootless Type A & B`).
  - Tracks chord symbols, roots, families, top notes, MIDI note numbers, and interval recipes relative to root (`['1', '3', 'b7', '9', '13']`).
  - Dynamic transposition engine to provide harmonic options for any melody note across octaves 4–6.
- **Interactive 61-Key Piano Visualizer**:
  - Highlights currently held keys.
  - Distinct royal blue badge and glowing accent marker on the top melody note.
  - Deep bass root badge on the bass note.
  - Interactive key playback on click with additive acoustic piano synthesis.
  - Interval recipe chips beneath the piano showing note names and scale roles.
- **Top-Note Reharmonizer Filter**:
  - Filter by melody note pitch ($C$ through $B$) and octave (4, 5, 6).
  - Filter by chord family (Major, Minor, Dominant, Altered, Half-Diminished, Diminished, Suspended).
  - **"Surprise Me!"** button to audition random matching voicings.
  - **"Add to Progression"** button right next to Surprise Me for rapid progression building without scrolling.
  - **"Add Bass"** toggle to trigger a deep sub-octave root note.
  - Global octave transpose buttons.
- **4/4 Sequencer Timeline**:
  - Construct custom progressions note-by-note.
  - Duration controls per measure (Whole note `1m`, Half note `2n`, Quarter note `4n`).
  - **Individual chord octave transpose buttons (`-8va` / `+8va`)** directly on each measure block.
  - Real-time transport controls: Play/Pause, BPM slider (50–160 BPM), Loop toggle, and **Clear Progression** button.
  - Reharmonize any measure block on the fly.
  - Preloaded with iconic progressions (Neo-Soul 2-5-1-6, Stevie Wonder Golden Era, Robert Glasper, Maiden Voyage).
- **Apple Logic Pro & DAW Export Suite**:
  - **"Reveal in Finder for Logic"**: 1-click local file creation that opens macOS Finder with the `.mid` file pre-selected, ready to drop straight into Logic Pro's Tracks Area.
  - **"Copy File (⌘C)"**: Copies native macOS POSIX file reference to system clipboard.
  - **Export standard `.mid` file**: Download Type 0/1 MIDI files generated with `midi-writer-js`.
  - **Print / Save as PDF**: Publication-grade editorial lead sheet view formatted with `@media print`, complete with chord symbols, interval recipes, and mini piano keyboard diagrams.
- **Local Storage Persistence**:
  - Progressions, tempo, bass toggles, and octave settings are saved to `localStorage`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Warm editorial theme, crisp borders, blue accents)
- **Music Theory**: [Tonal.js](https://github.com/tonaljs/tonal)
- **Audio Engine**: Web Audio API with additive harmonic synthesis and convolution impulse reverb
- **MIDI Engine**: [midi-writer-js](https://github.com/grimmdude/MidiWriterJS)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn or pnpm

### Installation

```bash
git clone https://github.com/pbaarn/harmonylab.git
cd harmonylab
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📄 License

MIT
