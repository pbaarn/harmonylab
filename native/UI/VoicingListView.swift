//
// VoicingListView.swift
// HarmonyLab AUv3 MIDI FX
//
// Narrow scrollable column of voicings matching current top note & filters
//

import SwiftUI

public struct VoicingListView: View {
    @ObservedObject var viewModel: HarmonyLabViewModel

    public init(viewModel: HarmonyLabViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 6, height: 6)
                Text("VOICINGS (\(viewModel.matchingVoicings.count))")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.horizontal, 4)

            // Scrollable List
            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(Array(viewModel.matchingVoicings.enumerated()), id: \.element.id) { index, voicing in
                        VoicingRow(
                            voicing: voicing,
                            index: index + 1,
                            isSelected: viewModel.activeVoicing?.id == voicing.id,
                            onSelect: { viewModel.selectVoicing(voicing) },
                            onStoreInSlot: { slotIdx in
                                viewModel.activeVoicing = voicing
                                viewModel.storeCurrentVoicing(inSlot: slotIdx)
                            }
                        )
                    }

                    if viewModel.matchingVoicings.isEmpty {
                        VStack(spacing: 6) {
                            Text("No matching voicings")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.secondary)
                            Text("Try another melody note or family.")
                                .font(.system(size: 10))
                                .foregroundColor(Color.white.opacity(0.3))
                        }
                        .padding(.vertical, 30)
                    }
                }
                .padding(.trailing, 2)
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

struct VoicingRow: View {
    let voicing: NativeVoicing
    let index: Int
    let isSelected: Bool
    let onSelect: () -> Void
    let onStoreInSlot: (Int) -> Void

    var body: some View {
        HStack(spacing: 8) {
            // Play Icon
            Button(action: onSelect) {
                Image(systemName: "play.fill")
                    .font(.system(size: 8))
                    .foregroundColor(isSelected ? .white : Color(white: 0.7))
                    .frame(width: 22, height: 22)
                    .background(isSelected ? Color.blue : Color(white: 0.2))
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())

            // Voicing Index
            Text(String(format: "#%03d", index))
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(.secondary)

            // Chord Symbol & Top Note
            VStack(alignment: .leading, spacing: 1) {
                Text(voicing.chordSymbol)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(isSelected ? Color.blue.opacity(0.9) : .white)
                    .lineLimit(1)

                Text("TOP: \(voicing.topNote)")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Family Tag
            Text(voicing.family.rawValue)
                .font(.system(size: 8, weight: .bold))
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(isSelected ? Color.blue.opacity(0.2) : Color(white: 0.2))
                .foregroundColor(isSelected ? Color.blue : Color(white: 0.7))
                .cornerRadius(3)

            // Store in Slot Menu
            Menu {
                Text("Store in Slot:")
                ForEach(0..<10, id: \.self) { slotIdx in
                    Button("Slot #\(slotIdx + 1)") {
                        onStoreInSlot(slotIdx)
                    }
                }
            } label: {
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
                    .frame(width: 18, height: 22)
            }
            .menuStyle(BorderlessButtonMenuStyle())
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(isSelected ? Color.blue.opacity(0.15) : Color(white: 0.14))
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(isSelected ? Color.blue : Color.white.opacity(0.04), lineWidth: 1)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onSelect()
        }
    }
}
