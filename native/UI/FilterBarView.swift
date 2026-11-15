//
// FilterBarView.swift
// HarmonyLab AUv3 MIDI FX
//
// Filtering options: Melody Pitch Class, Octave, Chord Family, Search, and Surprise Me
//

import SwiftUI

public struct FilterBarView: View {
    @ObservedObject var viewModel: HarmonyLabViewModel

    public init(viewModel: HarmonyLabViewModel) {
        self.viewModel = viewModel
    }

    private var isCommonTones: Bool { viewModel.selectionMode == .commonTones }

    private let commonToneColor = Color(red: 0.15, green: 0.72, blue: 0.62)

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Mode switch: Top Note | Common Tones
            HStack(spacing: 2) {
                ForEach(HarmonyLabViewModel.SelectionMode.allCases) { mode in
                    let isSelected = viewModel.selectionMode == mode
                    Button(action: { viewModel.selectionMode = mode }) {
                        Text(mode.rawValue.uppercased())
                            .font(.system(size: 9, weight: .black, design: .monospaced))
                            .frame(maxWidth: .infinity)
                            .frame(height: 20)
                            .background(isSelected ? Color.white : Color.clear)
                            .foregroundColor(isSelected ? .black : Color(white: 0.7))
                            .cornerRadius(4)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding(2)
            .background(Color(white: 0.16))
            .cornerRadius(6)

            // Header Row: Title & Surprise Me
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    if isCommonTones {
                        Text("COMMON TONES")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundColor(.secondary)
                        if viewModel.commonTones.isEmpty {
                            Text("Pick 2–4 notes")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundColor(Color(white: 0.5))
                        } else {
                            Text(viewModel.commonTonesLabel)
                                .font(.system(size: 15, weight: .black, design: .rounded))
                                .foregroundColor(commonToneColor)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                    } else {
                        Text("MELODY TOP NOTE")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundColor(.secondary)
                        Text("\(viewModel.selectedPitchClass)\(viewModel.selectedOctave)")
                            .font(.system(size: 15, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                    }
                }

                Spacer()

                // Surprise Me Button (picks from the current list, in either mode, also triggered by MIDI A#2)
                Button(action: { viewModel.surpriseMe() }) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 11, weight: .semibold))
                        Text("Surprise Me")
                            .font(.system(size: 11, weight: .bold))
                        Text("A#2")
                            .font(.system(size: 8, weight: .black, design: .monospaced))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Color.black.opacity(0.25))
                            .cornerRadius(3)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(surpriseEnabled ? Color.blue : Color(white: 0.22))
                    .foregroundColor(surpriseEnabled ? .white : Color(white: 0.5))
                    .cornerRadius(6)
                    .shadow(color: Color.blue.opacity(surpriseEnabled ? 0.4 : 0), radius: 3, x: 0, y: 1)
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(!surpriseEnabled)
                .help(isCommonTones && !viewModel.hasEnoughCommonTones
                      ? "Pick at least \(HarmonyLabViewModel.minCommonTones) common tones first"
                      : "Play a random chord from the list (MIDI A#2)")
            }

            // Pitch Class Buttons (2 rows of 6)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 6), spacing: 3) {
                ForEach(VoicingsEngine.pitchClasses, id: \.self) { pc in
                    pitchButton(pc)
                }
            }

            // Octave (Top Note mode) or Common Tone status (Common Tones mode) & Search Row
            HStack(spacing: 8) {
                if isCommonTones {
                    commonToneStatus
                } else {
                    // Octaves 4, 5, 6
                    HStack(spacing: 3) {
                        Text("Oct:")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundColor(.secondary)
                        ForEach([4, 5, 6], id: \.self) { oct in
                            let isSelected = viewModel.selectedOctave == oct
                            Button(action: { viewModel.selectedOctave = oct }) {
                                Text("\(oct)")
                                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                                    .frame(width: 22, height: 20)
                                    .background(isSelected ? Color.white : Color(white: 0.18))
                                    .foregroundColor(isSelected ? .black : Color.white)
                                    .cornerRadius(3)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                }

                Spacer()

                // Search Box
                HStack(spacing: 4) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                    TextField("Search voicings...", text: $viewModel.searchQuery)
                        .textFieldStyle(PlainTextFieldStyle())
                        .font(.system(size: 10))
                }
                .padding(.horizontal, 6)
                .frame(width: 140, height: 22)
                .background(Color(white: 0.15))
                .cornerRadius(4)
            }

            // Chord Family Pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(ChordFamily.allCases) { fam in
                        let isSelected = viewModel.selectedFamily == fam
                        Button(action: { viewModel.selectedFamily = fam }) {
                            Text(fam.rawValue)
                                .font(.system(size: 10, weight: isSelected ? .bold : .medium))
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(isSelected ? Color.white : Color(white: 0.18))
                                .foregroundColor(isSelected ? .black : Color(white: 0.75))
                                .cornerRadius(4)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
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

    private var surpriseEnabled: Bool {
        !isCommonTones || (viewModel.hasEnoughCommonTones && !viewModel.matchingVoicings.isEmpty)
    }

    @ViewBuilder
    private func pitchButton(_ pc: String) -> some View {
        if isCommonTones {
            let isSelected = viewModel.isCommonTone(pc)
            let isFull = viewModel.commonTones.count >= HarmonyLabViewModel.maxCommonTones
            Button(action: { viewModel.toggleCommonTone(pc) }) {
                Text(pc)
                    .font(.system(size: 11, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 24)
                    .background(isSelected ? commonToneColor : Color(white: 0.18))
                    .foregroundColor(isSelected ? .white : Color(white: (isFull ? 0.4 : 0.85)))
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
            .disabled(!isSelected && isFull)
        } else {
            let isSelected = viewModel.selectedPitchClass == pc
            Button(action: { viewModel.selectedPitchClass = pc }) {
                Text(pc)
                    .font(.system(size: 11, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 24)
                    .background(isSelected ? Color.blue : Color(white: 0.18))
                    .foregroundColor(isSelected ? .white : Color(white: 0.85))
                    .cornerRadius(4)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }

    @ViewBuilder
    private var commonToneStatus: some View {
        HStack(spacing: 4) {
            let count = viewModel.commonTones.count
            let minimum = HarmonyLabViewModel.minCommonTones
            Text(count < minimum ? "\(count)/\(minimum) min" : "\(count)/\(HarmonyLabViewModel.maxCommonTones)")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundColor(count < minimum ? .orange : commonToneColor)

            if count > 0 {
                Button(action: { viewModel.clearCommonTones() }) {
                    Text("Clear")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 5)
                        .frame(height: 18)
                        .background(Color(white: 0.18))
                        .foregroundColor(.white)
                        .cornerRadius(3)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
    }
}
