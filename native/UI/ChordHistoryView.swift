//
// ChordHistoryView.swift
// HarmonyLab AUv3 MIDI FX
//
// History section displaying the last 12 played/surprised chords with 1-click slot assignment
//

import SwiftUI

public struct ChordHistoryView: View {
    @ObservedObject var viewModel: HarmonyLabViewModel

    public init(viewModel: HarmonyLabViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack(spacing: 6) {
                Image(systemName: "clock.arrow.circlepath")
                    .foregroundColor(.blue)
                    .font(.system(size: 11, weight: .bold))

                Text("LAST 12 CHORDS HISTORY")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundColor(.secondary)

                Text("(\(viewModel.chordHistory.count)/12)")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundColor(Color.white.opacity(0.35))

                Spacer()

                if let active = viewModel.activeVoicing {
                    Menu {
                        Text("Store Active '\(active.chordSymbol)' in Slot:")
                        ForEach(0..<10, id: \.self) { slotIdx in
                            let key = viewModel.getTriggerKeyName(forSlot: slotIdx)
                            let curName = viewModel.chordSlots[slotIdx].chord?.chordSymbol ?? "Empty"
                            Button("Slot #\(slotIdx + 1) [\(key)]: \(curName)") {
                                viewModel.storeVoicing(active, inSlot: slotIdx)
                            }
                        }
                    } label: {
                        HStack(spacing: 3) {
                            Image(systemName: "plus.square.fill")
                                .font(.system(size: 9))
                            Text("Store Active in Slot ▾")
                                .font(.system(size: 9, weight: .bold))
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                    }
                    .menuStyle(BorderlessButtonMenuStyle())
                }

                if !viewModel.chordHistory.isEmpty {
                    Button(action: { viewModel.clearHistory() }) {
                        Image(systemName: "trash")
                            .font(.system(size: 9))
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .help("Clear History")
                }
            }

            // Cards Grid or Empty State
            if viewModel.chordHistory.isEmpty {
                HStack {
                    Spacer()
                    Text("Play melody notes or hit Surprise Me to capture your last 12 chords here.")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(Color.white.opacity(0.35))
                        .padding(.vertical, 14)
                    Spacer()
                }
            } else {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 5), count: 6), spacing: 5) {
                    ForEach(Array(viewModel.chordHistory.enumerated()), id: \.element.id) { index, item in
                        HistoryCard(
                            item: item,
                            index: index,
                            viewModel: viewModel
                        )
                    }
                }
            }
        }
        .padding(8)
        .background(Color(red: 0.11, green: 0.12, blue: 0.14))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct HistoryCard: View {
    let item: ChordHistoryItem
    let index: Int
    @ObservedObject var viewModel: HarmonyLabViewModel

    var isSelected: Bool {
        viewModel.isVoicingSelected(item.chord)
    }

    var body: some View {
        VStack(spacing: 2) {
            // Top Row: Index & Play Button
            HStack(spacing: 3) {
                Text("#\(index + 1)")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundColor(isSelected ? .yellow : .secondary)

                Spacer()

                // Play / Audition icon
                Button(action: { viewModel.selectHistoryChord(item) }) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 7))
                        .foregroundColor(isSelected ? .white : Color(white: 0.6))
                        .frame(width: 14, height: 14)
                        .background(isSelected ? Color.blue : Color(white: 0.2))
                        .cornerRadius(3)
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Chord Symbol
            Text(item.chord.chordSymbol)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundColor(isSelected ? .white : Color(white: 0.9))
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Top Voice Label
            Text("Top: \(item.chord.topNote)")
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundColor(isSelected ? Color.blue.opacity(0.9) : .secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 5)
        .padding(.vertical, 4)
        .background(isSelected ? Color.blue.opacity(0.25) : Color(white: 0.15))
        .cornerRadius(5)
        .overlay(
            RoundedRectangle(cornerRadius: 5)
                .stroke(isSelected ? Color.blue : Color.white.opacity(0.06), lineWidth: isSelected ? 1.5 : 1.0)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            viewModel.selectHistoryChord(item)
        }
        .onDrag {
            NSItemProvider(object: item.chord.dragPayload as NSString)
        } preview: {
            Text(item.chord.chordSymbol)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue)
                .cornerRadius(5)
        }
        .help("Click to audition • Drag onto a slot to store it")
        .contextMenu {
            Button("Audition '\(item.chord.chordSymbol)'") {
                viewModel.selectHistoryChord(item)
            }
            Menu("Store in Slot...") {
                ForEach(0..<10, id: \.self) { slotIdx in
                    let key = viewModel.getTriggerKeyName(forSlot: slotIdx)
                    let curName = viewModel.chordSlots[slotIdx].chord?.chordSymbol ?? "Empty"
                    Button("Slot #\(slotIdx + 1) [\(key)]: \(curName)") {
                        viewModel.storeVoicing(item.chord, inSlot: slotIdx)
                    }
                }
            }
        }
    }
}

// MARK: - Drag payload (history card → slot)

extension NativeVoicing {
    static let dragPrefix = "harmonylab-chord:"

    /// JSON-encoded chord, prefixed so foreign text drops are ignored.
    var dragPayload: String {
        guard let data = try? JSONEncoder().encode(self),
              let json = String(data: data, encoding: .utf8) else { return "" }
        return NativeVoicing.dragPrefix + json
    }

    static func fromDragPayload(_ payload: String) -> NativeVoicing? {
        guard payload.hasPrefix(dragPrefix) else { return nil }
        let json = String(payload.dropFirst(dragPrefix.count))
        guard let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(NativeVoicing.self, from: data)
    }
}
