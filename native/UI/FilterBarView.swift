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

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header Row: Title & Surprise Me
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("MELODY TOP NOTE")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.secondary)
                    Text("\(viewModel.selectedPitchClass)\(viewModel.selectedOctave)")
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                }

                Spacer()

                // Surprise Me Button
                Button(action: { viewModel.surpriseMe() }) {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 11, weight: .semibold))
                        Text("Surprise Me")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(6)
                    .shadow(color: Color.blue.opacity(0.4), radius: 3, x: 0, y: 1)
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Pitch Class Buttons (2 rows of 6)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 6), spacing: 3) {
                ForEach(VoicingsEngine.pitchClasses, id: \.self) { pc in
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

            // Octave & Search Row
            HStack(spacing: 8) {
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
}
