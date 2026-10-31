declare module 'midi-writer-js' {
  export class Track {
    setTempo(bpm: number): this;
    setTimeSignature(numerator: number, denominator: number): this;
    addTrackName(name: string): this;
    addEvent(event: any): this;
  }

  export class NoteEvent {
    constructor(fields: {
      pitch: string[];
      duration: string;
      velocity?: number;
      wait?: string;
    });
  }

  export class Writer {
    constructor(tracks: Track | Track[]);
    dataUri(): string;
    buildFile(): Uint8Array;
    base64(): string;
  }

  const MidiWriter: {
    Track: typeof Track;
    NoteEvent: typeof NoteEvent;
    Writer: typeof Writer;
  };

  export default MidiWriter;
}
