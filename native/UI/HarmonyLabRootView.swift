//
// HarmonyLabRootView.swift
// HarmonyLab AUv3 MIDI FX
//
// Root SwiftUI interface for AUv3 plugin and standalone app
//

import SwiftUI

public struct HarmonyLabRootView: View {
    @StateObject private var viewModel: HarmonyLabViewModel

    public init(audioUnit: HarmonyLabAudioUnit? = nil) {
        _viewModel = StateObject(wrappedValue: HarmonyLabViewModel(audioUnit: audioUnit))
    }

    public var body: some View {
        VStack(spacing: 8) {
            // Top Toolbar Bar
            HStack(spacing: 12) {
                // Logo & Name
                HStack(spacing: 6) {
                    Image(systemName: "waveform.circle.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.blue)

                    Text("HarmonyLab")
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundColor(.white)

                    Text("MIDI FX")
                        .font(.system(size: 8, weight: .black, design: .monospaced))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 1)
                        .background(Color.blue.opacity(0.25))
                        .foregroundColor(.blue)
                        .cornerRadius(3)
                }

                Spacer()

                // Live Harmonizer Performance Toggle
                Toggle(isOn: $viewModel.liveHarmonizerEnabled) {
                    HStack(spacing: 3) {
                        Text("Live Harmonizer:")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundColor(.secondary)
                        Text(viewModel.liveHarmonizerEnabled ? "ON" : "OFF")
                            .font(.system(size: 10, weight: .black, design: .monospaced))
                            .foregroundColor(viewModel.liveHarmonizerEnabled ? .green : .secondary)
                    }
                }
                .toggleStyle(SwitchToggleStyle(tint: .green))
                .help("When ON, playing notes in upper register voices that melody note")

                // Add Bass Root Toggle
                Button(action: { viewModel.addBass.toggle() }) {
                    Text("+Bass Root")
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(viewModel.addBass ? Color.yellow.opacity(0.2) : Color(white: 0.18))
                        .foregroundColor(viewModel.addBass ? .yellow : .secondary)
                        .cornerRadius(5)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Adds root bass note 1-2 octaves below")

                // Octave Shift (-8va, 8va, +8va)
                HStack(spacing: 2) {
                    Button(action: { if (viewModel.octaveOffset > -2) { viewModel.octaveOffset -= 1 } }) {
                        Image(systemName: "arrow.down")
                            .font(.system(size: 9, weight: .bold))
                            .frame(width: 20, height: 20)
                            .background(Color(white: 0.18))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Text(viewModel.octaveOffset == 0 ? "8va" : "\(viewModel.octaveOffset > 0 ? "+" : "")\(viewModel.octaveOffset)8va")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .frame(width: 32)

                    Button(action: { if (viewModel.octaveOffset < 2) { viewModel.octaveOffset += 1 } }) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 9, weight: .bold))
                            .frame(width: 20, height: 20)
                            .background(Color(white: 0.18))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .buttonStyle(PlainButtonStyle())
                }

                // Global MIDI Drag for Active Voicing
                if let chord = viewModel.activeVoicing {
                    MidiDragButton(
                        notes: chord.midiNotes,
                        chordName: chord.chordSymbol,
                        label: "Drag \(chord.chordSymbol) to Logic"
                    )
                    .frame(height: 24)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(red: 0.08, green: 0.09, blue: 0.11))
            .cornerRadius(8)

            // Main 2-Column Split
            HStack(alignment: .top, spacing: 8) {
                // Left Column: Filters + Narrow Voicings List
                VStack(spacing: 8) {
                    FilterBarView(viewModel: viewModel)
                    VoicingListView(viewModel: viewModel)
                }
                .frame(width: 280)

                // Right Stage: 10 Stored Chord Trigger Slots + Chord History + Piano Visualizer
                VStack(spacing: 8) {
                    ChordSlotsView(viewModel: viewModel)
                    ChordHistoryView(viewModel: viewModel)
                    PianoVisualizerView(viewModel: viewModel)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(10)
        .frame(minWidth: 860, minHeight: 620)
        .background(Color(red: 0.06, green: 0.07, blue: 0.08))
    }
}
