#pragma once

#include <AudioToolbox/AudioToolbox.h>
#include <CoreMIDI/CoreMIDI.h>
#include <atomic>
#include <algorithm>
#include <cstdint>
#include <cstring>
#include "VoicingRecipes.hpp"

namespace HarmonyLab {

constexpr size_t MAX_ACTIVE_VOICES = 32;
constexpr size_t MAX_CHORD_NOTES = 16;
constexpr size_t NUM_CHORD_SLOTS = 10;

struct ActiveVoice {
    uint8_t triggerKey = 0;
    uint8_t soundingNotes[MAX_CHORD_NOTES] = {0};
    uint8_t noteCount = 0;
    uint8_t channel = 0;
    bool active = false;
};

struct StoredChordSlot {
    uint8_t notes[MAX_CHORD_NOTES] = {0};
    uint8_t count = 0;
    char name[32] = {0};
};

class Engine {
public:
    Engine();
    ~Engine() = default;

    void reset();
    void setSampleRate(double sampleRate);

    // Real-time process loop called by AURenderBlock
    void process(
        const AudioTimeStamp* timestamp,
        AUAudioFrameCount frameCount,
        const AURenderEvent* realtimeEventListHead,
        AUMIDIOutputEventBlock midiOutputBlock
    );

    // Thread-safe configuration from UI
    void setSlotChord(size_t slotIndex, const uint8_t* notes, uint8_t count, const char* name);
    void clearSlot(size_t slotIndex);
    void setActiveVoicingNotes(const uint8_t* notes, uint8_t count);
    void setLiveHarmonizerEnabled(bool enabled);
    void setSurpriseModeEnabled(bool enabled);
    void setSelectedFamily(uint8_t familyCode);
    void setAddBassEnabled(bool enabled);
    void setOctaveOffset(int offset);
    void setTriggerBaseNote(uint8_t baseMidiNote); // Default 36 (C2) or 24 (C1)

    // UI state queries
    int getLastTriggeredSlot() const { return mLastTriggeredSlot.load(std::memory_order_relaxed); }
    void clearLastTriggeredSlot() { mLastTriggeredSlot.store(-1, std::memory_order_relaxed); }

    int getLastTriggeredMelodyNote() const { return mLastTriggeredMelodyNote.load(std::memory_order_relaxed); }
    void clearLastTriggeredMelodyNote() { mLastTriggeredMelodyNote.store(-1, std::memory_order_relaxed); }

    int getLastVoicedRecipeIndex() const { return mLastVoicedRecipeIndex.load(std::memory_order_relaxed); }
    int getLastVoicedMelodyNote() const { return mLastVoicedMelodyNote.load(std::memory_order_relaxed); }

    // Manual chord audition trigger from UI
    void triggerAuditionChord(const uint8_t* notes, uint8_t count, AUMIDIOutputEventBlock midiOutputBlock);
    void stopAuditionChord(AUMIDIOutputEventBlock midiOutputBlock);

private:
    void handleMIDI1(uint8_t status, uint8_t data1, uint8_t data2, int offset, AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime);
    void handleNoteOn(uint8_t channel, uint8_t note, uint8_t velocity, int offset, AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime);
    void handleNoteOff(uint8_t channel, uint8_t note, int offset, AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime);
    void allNotesOff(AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime);

    // Fast lock-free XorShift32 PRNG for audio thread
    inline uint32_t fastRand() {
        mRngState ^= mRngState << 13;
        mRngState ^= mRngState >> 17;
        mRngState ^= mRngState << 5;
        return mRngState;
    }

    double mSampleRate = 44100.0;
    uint32_t mRngState = 0x1337BEEF;

    // Active sounding voices pool (pre-allocated, zero malloc)
    ActiveVoice mVoices[MAX_ACTIVE_VOICES];

    // 10 Chord storage slots
    StoredChordSlot mSlots[NUM_CHORD_SLOTS];

    // Fallback static active voicing notes
    uint8_t mActiveVoicingNotes[MAX_CHORD_NOTES] = {0};
    uint8_t mActiveVoicingCount = 0;

    // Control parameters (atomic for lock-free UI communication)
    std::atomic<bool> mLiveHarmonizerEnabled{true};
    std::atomic<bool> mSurpriseModeEnabled{true};
    std::atomic<uint8_t> mSelectedFamily{0}; // 0 = All
    std::atomic<bool> mAddBassEnabled{true};
    std::atomic<int> mOctaveOffset{0};
    std::atomic<uint8_t> mTriggerBaseNote{36}; // C2 by default (slots C2 through A2)
    std::atomic<int> mLastTriggeredSlot{-1};
    std::atomic<int> mLastTriggeredMelodyNote{-1};

    // Live surprise reporting to UI
    std::atomic<int> mLastVoicedRecipeIndex{-1};
    std::atomic<int> mLastVoicedMelodyNote{-1};

    // Audition voice tracking
    ActiveVoice mAuditionVoice;
};

} // namespace HarmonyLab
