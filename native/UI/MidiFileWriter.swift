//
// MidiFileWriter.swift
// HarmonyLab AUv3 MIDI FX
//
// Pure Swift Standard MIDI File (SMF Type 0) generator for native DAW Drag & Drop
//

import Foundation

public class MidiFileWriter {
    public static func createMidiFile(for notes: [UInt8], chordName: String) -> URL? {
        let tempDir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("HarmonyLab", isDirectory: true)
        try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true, attributes: nil)

        let safeName = chordName.replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "#", with: "sharp")
        let fileURL = tempDir.appendingPathComponent("\(safeName).mid")

        var data = Data()

        // 1. Header Chunk: "MThd" + length (6) + format (0) + ntracks (1) + division (480 ticks/beat)
        data.append(contentsOf: [0x4D, 0x54, 0x68, 0x64]) // "MThd"
        data.append(contentsOf: [0x00, 0x00, 0x00, 0x06]) // length: 6
        data.append(contentsOf: [0x00, 0x00])             // format 0
        data.append(contentsOf: [0x00, 0x01])             // 1 track
        data.append(contentsOf: [0x01, 0xE0])             // 480 ticks per quarter note

        // 2. Track Data
        var trackData = Data()

        // Time Signature: 4/4
        trackData.append(contentsOf: [0x00, 0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08])

        // Tempo: 120 BPM (500,000 microseconds/quarter)
        trackData.append(contentsOf: [0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20])

        // Track Name
        let nameBytes = Array(chordName.utf8)
        trackData.append(contentsOf: [0x00, 0xFF, 0x03, UInt8(nameBytes.count)])
        trackData.append(contentsOf: nameBytes)

        // Note Ons at delta-time 0
        for (i, note) in notes.enumerated() {
            let delta: UInt8 = (i == 0) ? 0x00 : 0x00
            trackData.append(contentsOf: [delta, 0x90, note, 96])
        }

        // Note Offs at delta-time = 4 beats (1920 ticks = 0x0F 0x00 in variable length quantity)
        // 1920 in VLQ: 1920 = (15 << 7) | 0 = 0x8F, 0x00
        for (i, note) in notes.enumerated() {
            if i == 0 {
                trackData.append(contentsOf: [0x8F, 0x00, 0x80, note, 0x00]) // 4 beats duration
            } else {
                trackData.append(contentsOf: [0x00, 0x80, note, 0x00])
            }
        }

        // End of Track Meta Event: delta 0, FF 2F 00
        trackData.append(contentsOf: [0x00, 0xFF, 0x2F, 0x00])

        // 3. Track Chunk: "MTrk" + track length + track data
        data.append(contentsOf: [0x4D, 0x54, 0x72, 0x6B]) // "MTrk"
        let trackLength = UInt32(trackData.count).bigEndian
        withUnsafeBytes(of: trackLength) { data.append(contentsOf: $0) }
        data.append(trackData)

        do {
            try data.write(to: fileURL)
            return fileURL
        } catch {
            print("Failed to write MIDI file:", error)
            return nil
        }
    }
}
