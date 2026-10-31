import MidiWriter from 'midi-writer-js';
import { TimelineBlock, Voicing } from '@/types/harmonylab';
import { midiToNoteName } from './theory';

/**
 * Convert NoteDuration ('1m', '2n', '4n') to midi-writer-js duration code
 */
function durationToMidiWriterDuration(duration: string): string {
  switch (duration) {
    case '1m': return '1'; // Whole note
    case '2n': return '2'; // Half note
    case '4n': return '4'; // Quarter note
    default: return '1';
  }
}

export interface GeneratedMidi {
  uint8: Uint8Array;
  dataUri: string;
  blob: Blob;
  file: File;
  filename: string;
}

/**
 * Build a standard MIDI file for the entire timeline sequence
 */
export function generateTimelineMidi(
  blocks: TimelineBlock[],
  bpm: number = 85,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string } = {}
): GeneratedMidi | null {
  const { addBass = true, octaveOffset = 0, filename = 'HarmonyLab_Progression.mid' } = options;

  const validBlocks = blocks.filter((b) => b.voicing !== null);
  if (validBlocks.length === 0) return null;

  const track = new MidiWriter.Track();
  track.setTempo(bpm);
  track.setTimeSignature(4, 4);
  track.addTrackName('HarmonyLab Progression');

  validBlocks.forEach((block) => {
    if (!block.voicing) return;
    const v = block.voicing;
    const blockShift = (octaveOffset || 0) + (block.octaveOffset || 0);

    let notes = v.midiNotes.map((m) => m + blockShift);

    if (addBass) {
      const rawBass = (v.bassNoteMidi ?? notes[0] - 12) + blockShift;
      const adjustedBass = rawBass > 46 ? rawBass - 12 : rawBass;
      notes = [adjustedBass, ...notes];
    }

    const noteNames = notes.map((m) => midiToNoteName(m));
    const mwDuration = durationToMidiWriterDuration(block.duration);

    track.addEvent(
      new MidiWriter.NoteEvent({
        pitch: noteNames,
        duration: mwDuration,
        velocity: 88,
      })
    );
  });

  const write = new MidiWriter.Writer(track);
  const dataUri = write.dataUri();
  const uint8 = write.buildFile();
  const blob = new Blob([uint8 as unknown as BlobPart], { type: 'audio/midi' });
  const file = new File([blob], filename, { type: 'audio/midi' });

  return { uint8, dataUri, blob, file, filename };
}

/**
 * Build a standard MIDI file for a single Voicing
 */
export function generateVoicingMidi(
  voicing: Voicing,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string; duration?: string } = {}
): GeneratedMidi {
  const {
    addBass = true,
    octaveOffset = 0,
    filename = `${voicing.chordSymbol.replace(/[\/\\?%*:|"<>]/g, '_')}_voicing.mid`,
    duration = '1',
  } = options;

  const track = new MidiWriter.Track();
  track.setTempo(80);
  track.setTimeSignature(4, 4);
  track.addTrackName(voicing.name);

  let notes = voicing.midiNotes.map((m) => m + octaveOffset);

  if (addBass) {
    const rawBass = (voicing.bassNoteMidi ?? notes[0] - 12) + octaveOffset;
    const adjustedBass = rawBass > 46 ? rawBass - 12 : rawBass;
    notes = [adjustedBass, ...notes];
  }

  const noteNames = notes.map((m) => midiToNoteName(m));

  track.addEvent(
    new MidiWriter.NoteEvent({
      pitch: noteNames,
      duration: durationToMidiWriterDuration(duration),
      velocity: 90,
    })
  );

  const write = new MidiWriter.Writer(track);
  const dataUri = write.dataUri();
  const uint8 = write.buildFile();
  const blob = new Blob([uint8 as unknown as BlobPart], { type: 'audio/midi' });
  const file = new File([blob], filename, { type: 'audio/midi' });

  return { uint8, dataUri, blob, file, filename };
}

/**
 * Export timeline blocks to .mid file and trigger browser download
 */
export function exportTimelineToMidi(
  blocks: TimelineBlock[],
  bpm: number = 85,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string } = {}
) {
  const midiData = generateTimelineMidi(blocks, bpm, options);
  if (!midiData) {
    alert('Please add at least one chord to the timeline before exporting MIDI.');
    return;
  }
  downloadDataUri(midiData.dataUri, midiData.filename);
}

/**
 * Export a single Voicing to MIDI
 */
export function exportVoicingToMidi(
  voicing: Voicing,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string } = {}
) {
  const midiData = generateVoicingMidi(voicing, options);
  downloadDataUri(midiData.dataUri, midiData.filename);
}

/**
 * Setup Drag-and-Drop payload so dragging from the web page into Finder or Desktop works
 */
export function handleMidiDragStart(
  e: React.DragEvent,
  midiData: GeneratedMidi
) {
  e.dataTransfer.effectAllowed = 'copyMove';

  if (e.dataTransfer.items && e.dataTransfer.items.add) {
    try {
      e.dataTransfer.items.add(midiData.file);
    } catch (err) {
      console.warn('Could not add file to dataTransfer.items:', err);
    }
  }

  try {
    const blobUrl = URL.createObjectURL(midiData.blob);
    e.dataTransfer.setData('DownloadURL', `audio/midi:${midiData.filename}:${blobUrl}`);
    e.dataTransfer.setData('text/uri-list', blobUrl);
  } catch (err) {
    // ignore
  }

  try {
    e.dataTransfer.setData('audio/midi', midiData.dataUri);
    e.dataTransfer.setData('text/plain', midiData.filename);
  } catch (err) {
    // ignore
  }
}

/**
 * Save MIDI file to disk and reveal in Finder immediately.
 * This solves the Apple Logic Pro limitation where Logic requires a real local file:// POSIX path.
 */
export async function revealTimelineInFinder(
  blocks: TimelineBlock[],
  bpm: number = 85,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string } = {}
): Promise<{ success: boolean; message: string }> {
  const midiData = generateTimelineMidi(blocks, bpm, options);
  if (!midiData) {
    return { success: false, message: 'Please add chords before revealing in Finder.' };
  }

  try {
    const res = await fetch('/api/midi/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: midiData.filename,
        midiBase64: midiData.dataUri,
        action: 'reveal',
      }),
    });
    const data = await res.json();
    return { success: true, message: data.message || 'Revealed in Finder!' };
  } catch (err) {
    downloadDataUri(midiData.dataUri, midiData.filename);
    return { success: true, message: 'Downloaded MIDI file.' };
  }
}

/**
 * Copy native macOS file reference to system clipboard pasteboard
 */
export async function copyTimelineMidiToClipboard(
  blocks: TimelineBlock[],
  bpm: number = 85,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string } = {}
): Promise<{ success: boolean; message: string }> {
  const midiData = generateTimelineMidi(blocks, bpm, options);
  if (!midiData) {
    return { success: false, message: 'Please add chords before copying.' };
  }

  try {
    const res = await fetch('/api/midi/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: midiData.filename,
        midiBase64: midiData.dataUri,
        action: 'copy',
      }),
    });
    const data = await res.json();
    return { success: true, message: data.message || 'Copied to clipboard!' };
  } catch (err) {
    return { success: false, message: 'Failed to copy to clipboard.' };
  }
}

/**
 * Save single voicing to disk and reveal in Finder
 */
export async function revealVoicingInFinder(
  voicing: Voicing,
  options: { addBass?: boolean; octaveOffset?: number; filename?: string; duration?: string } = {}
): Promise<{ success: boolean; message: string }> {
  const midiData = generateVoicingMidi(voicing, options);

  try {
    const res = await fetch('/api/midi/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: midiData.filename,
        midiBase64: midiData.dataUri,
        action: 'reveal',
      }),
    });
    const data = await res.json();
    return { success: true, message: data.message || 'Revealed in Finder!' };
  } catch (err) {
    downloadDataUri(midiData.dataUri, midiData.filename);
    return { success: true, message: 'Downloaded MIDI file.' };
  }
}

/**
 * Trigger file download from Data URI
 */
function downloadDataUri(dataUri: string, filename: string) {
  if (typeof window === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
