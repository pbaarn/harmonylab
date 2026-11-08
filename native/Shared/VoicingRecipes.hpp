//
// VoicingRecipes.hpp
// HarmonyLab AUv3 MIDI FX
// Pre-calculated relative voicing recipes for sample-accurate real-time Surprise Mode
//

#pragma once
#include <cstdint>

namespace HarmonyLab {

struct Recipe {
    const char* chordSuffix;
    const char* name;
    uint8_t family;
    int8_t rootOffset;
    int8_t bassOffset;
    int8_t noteOffsets[16];
    uint8_t noteCount;
};

static const Recipe ALL_RECIPES[] = {
    { "maj9(#11)", "Maj9(#11) Lydian Spread", 1, -4, -40, { -28, -17, -14, -10, 0 }, 5 },
    { "maj9", "Neo-Soul Maj9 Cluster", 1, -9, -33, { -21, -14, -10, -9, -5, 0 }, 6 },
    { "maj7", "Drop-2 Maj7", 1, -11, -35, { -23, -16, -7, 0 }, 4 },
    { "6/9", "Gospel 6/9 Warmth", 1, -9, -33, { -21, -17, -12, -7, 0 }, 5 },
    { "maj13", "Bill Evans Maj13 Rootless", 1, -4, -28, { -17, -12, -9, -5, 0 }, 5 },
    { "maj9", "Ab Maj9 Quartal Stack", 1, -11, -47, { -35, -23, -19, -16, -11, 0 }, 6 },
    { "maj7(#11)", "Db Maj7(#11) Upper Structure", 1, -11, -35, { -23, -16, -11, -5, 0 }, 5 },
    { "m9", "Neo-Soul Butter Minor 9", 2, -2, -38, { -26, -19, -16, -11, -7, 0 }, 6 },
    { "m11", "\"So What\" Quartal Minor 11", 2, -10, -34, { -22, -17, -12, -7, -3, 0 }, 6 },
    { "m11", "Kenny Barron Minor 11 Stasis", 2, -10, -46, { -34, -27, -22, -17, -12, -7, 0 }, 7 },
    { "m9", "Bill Evans Minor 9 (Type B)", 2, -7, -31, { -21, -17, -14, -9, 0 }, 5 },
    { "m(maj9)", "Film Noir Minor-Major 9", 2, -7, -43, { -31, -24, -20, -17, -12, 0 }, 6 },
    { "m11", "Glasper Minor 11 Cluster", 2, -2, -50, { -38, -28, -23, -21, -19, -12, 0 }, 7 },
    { "13", "Jeff Schneider Slick 13th", 3, -9, -45, { -33, -23, -17, -12, -7, 0 }, 6 },
    { "9(#11)", "Lydian Dominant 9(#11)", 3, -6, -42, { -30, -20, -16, -14, -9, 0 }, 6 },
    { "13(b9)", "Stevie Wonder 13(b9)", 3, -9, -45, { -33, -23, -17, -12, -8, 0 }, 6 },
    { "9", "West Coast 9th Drop-2", 3, -2, -38, { -26, -16, -10, -7, 0 }, 5 },
    { "7(#9)", "Purple Soul 7(#9)", 3, -3, -39, { -27, -17, -11, -5, 0 }, 5 },
    { "7alt", "Altered Dominant (Tritone Sub)", 4, -6, -42, { -30, -20, -14, -8, -5, 0 }, 6 },
    { "7(#9#5)", "Super-Locrian 7(#9#5)", 4, -10, -46, { -34, -24, -18, -11, -7, 0 }, 6 },
    { "7alt", "C7alt (Ab Triad Superimposed)", 4, -8, -44, { -32, -22, -16, -12, -8, 0 }, 6 },
    { "7(b9,b13)", "B7(b9,b13) Dark Gospel", 4, -7, -43, { -31, -21, -15, -11, -5, 0 }, 6 },
    { "7sus4(9)", "Neo-Soul Quartal 7sus", 7, -7, -43, { -31, -21, -16, -12, -7, 0 }, 6 },
    { "13sus4", "Herbie Hancock 13sus4", 7, -7, -31, { -19, -12, -9, -5, -2, 0 }, 6 },
    { "sus4(b9)", "Flamenco Phrygian Sus(b9)", 7, -8, -44, { -32, -20, -15, -11, -7, 0 }, 6 },
    { "m7(b5)", "Modern Half-Diminished 11", 5, -6, -42, { -30, -24, -20, -15, -12, 0 }, 6 },
    { "dim7", "Symmetrical Barry Harris Dim7", 6, -2, -50, { -38, -29, -23, -20, -14, 0 }, 6 },
    { "m11(b5)", "Neo-Soul Locrian 9th", 5, 0, -48, { -36, -26, -23, -18, -14, 0 }, 6 },
    { "maj9", "Drop 2 & 4 Velvet Maj9", 1, -4, -40, { -28, -21, -14, -9, 0 }, 5 },
    { "maj7(#11)", "Lydian Starburst", 1, -7, -43, { -31, -24, -20, -15, -13, 0 }, 6 },
    { "9(sus)", "Smooth R&B 9sus4", 7, -4, -40, { -28, -16, -9, -6, -2, 0 }, 6 },
    { "13", "Drop-3 Big Band 13th", 3, -7, -43, { -31, -21, -15, -10, 0 }, 5 },
    { "m11", "Chicago Soul Minor 11", 2, -10, -34, { -22, -15, -10, -7, -5, 0 }, 6 },
    { "7(#9#5)", "Neo-Soul Turnaround 7alt", 4, -4, -40, { -28, -20, -16, -12, -4, 0 }, 6 },
    { "maj9", "Glasper Velvet Maj9", 1, -7, -43, { -31, -20, -17, -15, -8, 0 }, 6 },
    { "dim7", "Gospel Passing Diminished", 6, -6, -42, { -30, -21, -18, -12, -6, 0 }, 6 },
    { "m9", "Modern Neo-Soul High Octave m9", 2, -3, -51, { -39, -29, -25, -20, -12, 0 }, 6 },
    { "13", "Steely Dan Mu-Major 13", 3, -7, -43, { -31, -21, -15, -10, -5, 0 }, 6 },
    { "7sus4", "Sunday Morning 7sus4", 7, -7, -43, { -31, -24, -19, -12, -9, 0 }, 6 },
    { "m11", "D’Angelo Brown Sugar m11", 2, -5, -41, { -29, -19, -14, -10, -5, 0 }, 6 },
    { "maj7", "Acoustic Folk-Soul Maj7", 1, -7, -43, { -31, -24, -19, -8, -3, 0 }, 6 },
    { "7(#11)", "Thelonious Monk Tritone 7(#11)", 3, -6, -42, { -30, -20, -14, -8, 0 }, 5 },
    { "maj9", "Bill Evans Maj9 (Type B)", 1, -2, -38, { -22, -19, -15, -12, 0 }, 5 },
    { "m11(9)", "Schneider \"Butter 11\" Stack", 2, -3, -39, { -27, -20, -17, -13, -10, 0 }, 6 },
    { "13(b9)", "Rootless 13(b9) Tension", 3, -10, -34, { -18, -13, -9, -6, 0 }, 5 },
    { "7alt", "Modern R&B 7alt Turnaround", 4, -3, -51, { -39, -29, -23, -17, -12, 0 }, 6 },
    { "maj7(#11)", "F Lydian Dreamscape", 1, -6, -54, { -42, -30, -23, -19, -14, 0 }, 6 },
    { "m7(b5)", "Drop-2 Half-Diminished", 5, -6, -30, { -18, -12, -8, -3, 0 }, 5 },
    { "9sus4", "Gospel 9sus4 (Ab/Bb)", 7, -5, -41, { -29, -19, -15, -12, -7, 0 }, 6 },
    { "maj9", "Stevie Wonder Golden Maj9", 1, -4, -40, { -28, -21, -14, -10, -5, 0 }, 6 },
};

static constexpr size_t NUM_RECIPES = sizeof(ALL_RECIPES) / sizeof(ALL_RECIPES[0]);

} // namespace HarmonyLab
