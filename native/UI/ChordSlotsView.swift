//
// ChordSlotsView.swift
// HarmonyLab AUv3 MIDI FX
//
// 10 Stored Chord Trigger Slots with lower-octave key triggers & native MIDI drag-and-drop
//

import SwiftUI

public struct ChordSlotsView: View {
    @ObservedObject var viewModel: HarmonyLabViewModel

    public init(viewModel: HarmonyLabViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "square.grid.2x5.fill")
                        .foregroundColor(.blue)
                        .font(.system(size: 13, weight: .bold))
                    Text("10 STORED CHORD TRIGGER SLOTS")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Trigger Octave selector
                HStack(spacing: 4) {
                    Text("Triggers:")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundColor(.secondary)

                    Button(action: { viewModel.triggerBaseNote = 24 }) {
                        Text("C1–A1")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(viewModel.triggerBaseNote == 24 ? Color.blue : Color(white: 0.18))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: { viewModel.triggerBaseNote = 36 }) {
                        Text("C2–A2")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(viewModel.triggerBaseNote == 36 ? Color.blue : Color(white: 0.18))
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }

            // 10 Chord Slots Grid (2 rows of 5)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 5), spacing: 6) {
                ForEach(0..<10, id: \.self) { idx in
                    SlotCard(index: idx, viewModel: viewModel)
                }
            }
        }
        .padding(10)
        .background(Color(red: 0.11, green: 0.12, blue: 0.14))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct SlotCard: View {
    let index: Int
    @ObservedObject var viewModel: HarmonyLabViewModel

    var isTriggered: Bool {
        viewModel.lastTriggeredSlot == index
    }

    var slot: ChordSlot {
        viewModel.chordSlots[index]
    }

    var triggerKey: String {
        viewModel.getTriggerKeyName(forSlot: index)
    }

    private var backgroundColor: Color {
        if isTriggered {
            return Color.blue.opacity(0.6)
        } else if slot.chord != nil {
            return Color(white: 0.16)
        } else {
            return Color(white: 0.13)
        }
    }

    private var strokeColor: Color {
        isTriggered ? Color.yellow : Color.white.opacity(0.1)
    }

    private var strokeWidth: CGFloat {
        isTriggered ? 2.0 : 1.0
    }

    var body: some View {
        VStack(spacing: 4) {
            slotHeader
            slotContent
            slotActions
        }
        .padding(6)
        .background(backgroundColor)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(strokeColor, lineWidth: strokeWidth)
        )
        .animation(.easeInOut(duration: 0.1), value: isTriggered)
        .contextMenu {
            if let active = viewModel.activeVoicing {
                Button("Store '\(active.chordSymbol)' in Slot #\(index + 1)") {
                    viewModel.storeCurrentVoicing(inSlot: index)
                }
            }
            if let chord = slot.chord {
                Button("Audition Slot #\(index + 1) (\(chord.chordSymbol))") {
                    viewModel.triggerAudition(chord)
                }
                Divider()
                Button("Clear Slot #\(index + 1)", role: .destructive) {
                    viewModel.clearSlot(index)
                }
            }
        }
    }

    @ViewBuilder
    private var slotHeader: some View {
        HStack {
            Text("#\(index + 1)")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(.secondary)

            Spacer()

            Text("[\(triggerKey)]")
                .font(.system(size: 9, weight: .black, design: .monospaced))
                .foregroundColor(isTriggered ? .black : .yellow)
                .padding(.horizontal, 3)
                .padding(.vertical, 1)
                .background(isTriggered ? Color.yellow : Color.yellow.opacity(0.15))
                .cornerRadius(3)
        }
    }

    @ViewBuilder
    private var slotContent: some View {
        ZStack {
            if let chord = slot.chord {
                VStack(spacing: 1) {
                    Text(chord.chordSymbol)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)

                    Text("Top: \(chord.topNote)")
                        .font(.system(size: 9, weight: .medium, design: .monospaced))
                        .foregroundColor(.secondary)
                }
            } else {
                Text("<Empty>")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(Color.white.opacity(0.25))
            }
        }
        .frame(height: 32)
    }

    @ViewBuilder
    private var slotActions: some View {
        HStack(spacing: 3) {
            if let chord = slot.chord {
                Button(action: { viewModel.triggerAudition(chord) }) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.white)
                        .frame(width: 18, height: 20)
                        .background(Color.white.opacity(0.15))
                        .cornerRadius(4)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Audition Chord")

                MidiDragButton(
                    notes: chord.midiNotes,
                    chordName: chord.chordSymbol,
                    label: "MIDI"
                )
                .frame(height: 20)
                .help("Drag MIDI directly onto Logic Pro Track")

                Button(action: { viewModel.clearSlot(index) }) {
                    Image(systemName: "xmark")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                        .frame(width: 16, height: 20)
                }
                .buttonStyle(PlainButtonStyle())
                .help("Clear Slot (Right-click to Replace)")
            } else {
                Button(action: { viewModel.storeCurrentVoicing(inSlot: index) }) {
                    HStack(spacing: 2) {
                        Image(systemName: "plus")
                            .font(.system(size: 8, weight: .bold))
                        Text("Store")
                            .font(.system(size: 9, weight: .bold))
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .frame(height: 20)
                    .background(Color.blue.opacity(0.15))
                    .cornerRadius(4)
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(viewModel.activeVoicing == nil)
                .help("Store currently selected chord into Slot #\(index + 1)")
            }
        }
    }
}
