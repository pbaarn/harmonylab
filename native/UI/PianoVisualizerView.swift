//
// PianoVisualizerView.swift
// HarmonyLab AUv3 MIDI FX
//
// Native SwiftUI Piano Visualizer with realistic keybed proportions and chord note labels
//

import SwiftUI

public struct PianoVisualizerView: View {
    @ObservedObject var viewModel: HarmonyLabViewModel

    public init(viewModel: HarmonyLabViewModel) {
        self.viewModel = viewModel
    }

    private let startMidi: UInt8 = 48 // C3
    private let endMidi: UInt8 = 83   // B5

    private var activeNotes: Set<UInt8> {
        guard let chord = viewModel.activeVoicing else { return [] }
        var notes = Set(chord.midiNotes)
        if viewModel.addBass, let bass = chord.bassNoteMidi {
            notes.insert(bass)
        }
        return notes
    }

    private var topNoteMidi: UInt8? {
        viewModel.activeVoicing?.midiNotes.last
    }

    private var bassNoteMidi: UInt8? {
        viewModel.addBass ? viewModel.activeVoicing?.bassNoteMidi : nil
    }

    private func whiteKeyColor(isTop: Bool, isBass: Bool, isHeld: Bool) -> Color {
        if isTop { return Color.blue }
        if isBass { return Color.yellow }
        if isHeld { return Color(red: 1.0, green: 0.9, blue: 0.6) }
        return Color(white: 0.95)
    }

    private func blackKeyColor(isTop: Bool, isBass: Bool, isHeld: Bool) -> Color {
        if isTop { return Color.blue }
        if isBass { return Color.yellow }
        if isHeld { return Color(red: 1.0, green: 0.85, blue: 0.4) }
        return Color(white: 0.12)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            headerView
            keyboardView
            chipsView
        }
        .padding(10)
        .background(Color(red: 0.11, green: 0.12, blue: 0.14))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    @ViewBuilder
    private var headerView: some View {
        HStack {
            if let chord = viewModel.activeVoicing {
                HStack(spacing: 6) {
                    Text(chord.chordSymbol)
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text("• Top: \(chord.topNote)")
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(.blue)
                }
            } else {
                Text("Select a chord to inspect")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
            }

            Spacer()

            if let chord = viewModel.activeVoicing {
                Button(action: { viewModel.triggerAudition(chord) }) {
                    HStack(spacing: 4) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 9))
                        Text("Play Chord")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.15))
                    .foregroundColor(.white)
                    .cornerRadius(5)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
    }

    @ViewBuilder
    private var keyboardView: some View {
        GeometryReader { geo in
            let whiteKeys = (startMidi...endMidi).filter { !isBlackKey($0) }
            let totalWhites = CGFloat(whiteKeys.count)
            let whiteWidth = geo.size.width / totalWhites
            let blackWidth = whiteWidth * 0.62
            let blackHeight = geo.size.height * 0.64

            ZStack(alignment: .topLeading) {
                // Fallboard & Red Felt Keybed Strip
                VStack(spacing: 0) {
                    Rectangle()
                        .fill(Color(white: 0.08))
                        .frame(height: 4)
                    Rectangle()
                        .fill(Color(red: 0.7, green: 0.1, blue: 0.15))
                        .frame(height: 2)
                }
                .zIndex(10)

                // White Keys Layer
                HStack(spacing: 0) {
                    ForEach(whiteKeys, id: \.self) { midi in
                        let isHeld = activeNotes.contains(midi)
                        let isTop = midi == topNoteMidi
                        let isBass = midi == bassNoteMidi

                        VStack {
                            Spacer()
                            if isHeld {
                                Text(VoicingsEngine.sharpNames[Int(midi) % 12])
                                    .font(.system(size: 9, weight: .black, design: .rounded))
                                    .foregroundColor(isTop ? .white : .black)
                                    .padding(.bottom, 4)
                            }
                        }
                        .frame(width: whiteWidth, height: geo.size.height)
                        .background(whiteKeyColor(isTop: isTop, isBass: isBass, isHeld: isHeld))
                        .border(Color.black.opacity(0.2), width: 0.5)
                        .cornerRadius(3)
                    }
                }

                // Black Keys Layer
                ForEach(startMidi...endMidi, id: \.self) { midi in
                    if isBlackKey(midi) {
                        let whiteIndexBefore = getWhiteIndexBefore(midi)
                        let left = (CGFloat(whiteIndexBefore + 1) * whiteWidth) - (blackWidth / 2)
                        let isHeld = activeNotes.contains(midi)
                        let isTop = midi == topNoteMidi
                        let isBass = midi == bassNoteMidi

                        VStack {
                            Spacer()
                            if isHeld {
                                Text(VoicingsEngine.sharpNames[Int(midi) % 12])
                                    .font(.system(size: 8, weight: .black, design: .rounded))
                                    .foregroundColor(isTop ? .white : .black)
                                    .padding(.bottom, 3)
                            }
                        }
                        .frame(width: blackWidth, height: blackHeight)
                        .background(blackKeyColor(isTop: isTop, isBass: isBass, isHeld: isHeld))
                        .border(Color.black, width: 0.5)
                        .cornerRadius(2)
                        .offset(x: left, y: 0)
                        .zIndex(5)
                    }
                }
            }
        }
        .frame(height: 100)
        .background(Color.black)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }

    @ViewBuilder
    private var chipsView: some View {
        if let chord = viewModel.activeVoicing {
            HStack(spacing: 12) {
                HStack(spacing: 4) {
                    Text("NOTES:")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.secondary)
                    ForEach(chord.midiNotes, id: \.self) { note in
                        Text(VoicingsEngine.midiToNoteName(note))
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(note == topNoteMidi ? Color.blue.opacity(0.3) : Color(white: 0.2))
                            .foregroundColor(note == topNoteMidi ? Color.blue : .white)
                            .cornerRadius(3)
                    }
                }

                Spacer()

                HStack(spacing: 4) {
                    Text("RECIPE:")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.secondary)
                    ForEach(chord.recipe, id: \.self) { interval in
                        Text(interval)
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color(white: 0.18))
                            .foregroundColor(.yellow)
                            .cornerRadius(3)
                    }
                }
            }
            .padding(.top, 2)
        }
    }

    private func isBlackKey(_ midi: UInt8) -> Bool {
        let note = Int(midi) % 12
        return note == 1 || note == 3 || note == 6 || note == 8 || note == 10
    }

    private func getWhiteIndexBefore(_ midi: UInt8) -> Int {
        var count = 0
        for m in startMidi..<midi {
            if !isBlackKey(m) {
                count += 1
            }
        }
        return count - 1
    }
}
