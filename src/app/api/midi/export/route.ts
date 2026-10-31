import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename = 'HarmonyLab_Progression.mid', midiBase64, action = 'reveal' } = body;

    if (!midiBase64) {
      return NextResponse.json({ error: 'Missing midiBase64 data' }, { status: 400 });
    }

    // Clean filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    // Store in midi_exports inside workspace
    const exportsDir = path.join(process.cwd(), 'midi_exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filePath = path.join(exportsDir, safeFilename);

    // Remove data URI prefix if present
    const base64Data = midiBase64.replace(/^data:audio\/midi;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(filePath, buffer);

    if (action === 'reveal') {
      // Reveal the file in macOS Finder
      exec(`open -R "${filePath}"`, (error) => {
        if (error) {
          console.warn('Could not reveal in Finder:', error);
        }
      });
      return NextResponse.json({
        success: true,
        action: 'reveal',
        filePath,
        message: 'Revealed in Finder! Ready to drag directly into Logic Pro.',
      });
    }

    if (action === 'copy') {
      // Copy real POSIX file to macOS clipboard pasteboard
      exec(`osascript -e 'set the clipboard to (POSIX file "${filePath}")'`, (error) => {
        if (error) {
          console.warn('Could not copy file to clipboard:', error);
        }
      });
      return NextResponse.json({
        success: true,
        action: 'copy',
        filePath,
        message: 'MIDI file copied to macOS clipboard! You can paste (⌘V) into Finder or DAW.',
      });
    }

    return NextResponse.json({
      success: true,
      filePath,
      message: 'MIDI file saved to disk.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('MIDI export API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
