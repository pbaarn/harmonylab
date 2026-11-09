//
// AppDelegate.swift
// HarmonyLab Standalone App
//

import AppKit
import SwiftUI
import CoreAudioKit

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var audioUnit: HarmonyLabAudioUnit?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Instantiate the Audio Unit
        let desc = AudioComponentDescription(
            componentType: kAudioUnitType_MIDIProcessor,
            componentSubType: 0x686d6c62, // 'hmlb'
            componentManufacturer: 0x5042726e, // 'PBrn'
            componentFlags: 0,
            componentFlagsMask: 0
        )

        let au = try? HarmonyLabAudioUnit(componentDescription: desc, options: [])
        self.audioUnit = au

        // In standalone mode, hook MIDIOutputEventBlock to ChordPreviewPlayer
        au?.midiOutputEventBlock = { (sampleTime, cable, length, data) in
            guard length >= 3 else { return noErr }
            let bytes = data
            let status = bytes[0] & 0xF0
            let note = bytes[1]
            let vel = bytes[2]

            if status == 0x90 && vel > 0 {
                ChordPreviewPlayer.shared.playSingleNote(note)
            }
            return noErr
        }

        let contentView = HarmonyLabRootView(audioUnit: au)

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 880, height: 560),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "HarmonyLab • Top-Note Voicings & MIDI FX"
        window.contentView = NSHostingView(rootView: contentView)
        window.makeKeyAndOrderFront(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
