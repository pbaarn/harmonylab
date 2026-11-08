#include "HarmonyLabDSP.hpp"

namespace HarmonyLab {

Engine::Engine() {
    reset();
}

void Engine::reset() {
    for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
        mVoices[i].active = false;
        mVoices[i].noteCount = 0;
    }
    mAuditionVoice.active = false;
    mAuditionVoice.noteCount = 0;
}

void Engine::setSampleRate(double sampleRate) {
    mSampleRate = sampleRate;
}

void Engine::setSlotChord(size_t slotIndex, const uint8_t* notes, uint8_t count, const char* name) {
    if (slotIndex >= NUM_CHORD_SLOTS) return;
    uint8_t safeCount = std::min<uint8_t>(count, MAX_CHORD_NOTES);
    mSlots[slotIndex].count = safeCount;
    for (uint8_t i = 0; i < safeCount; ++i) {
        mSlots[slotIndex].notes[i] = notes[i];
    }
    if (name) {
        std::strncpy(mSlots[slotIndex].name, name, sizeof(mSlots[slotIndex].name) - 1);
        mSlots[slotIndex].name[sizeof(mSlots[slotIndex].name) - 1] = '\0';
    }
}

void Engine::clearSlot(size_t slotIndex) {
    if (slotIndex >= NUM_CHORD_SLOTS) return;
    mSlots[slotIndex].count = 0;
    std::memset(mSlots[slotIndex].notes, 0, sizeof(mSlots[slotIndex].notes));
    std::memset(mSlots[slotIndex].name, 0, sizeof(mSlots[slotIndex].name));
}

void Engine::setActiveVoicingNotes(const uint8_t* notes, uint8_t count) {
    uint8_t safeCount = std::min<uint8_t>(count, MAX_CHORD_NOTES);
    mActiveVoicingCount = safeCount;
    for (uint8_t i = 0; i < safeCount; ++i) {
        mActiveVoicingNotes[i] = notes[i];
    }
}

void Engine::setLiveHarmonizerEnabled(bool enabled) {
    mLiveHarmonizerEnabled.store(enabled, std::memory_order_relaxed);
}

void Engine::setSurpriseModeEnabled(bool enabled) {
    mSurpriseModeEnabled.store(enabled, std::memory_order_relaxed);
}

void Engine::setSelectedFamily(uint8_t familyCode) {
    mSelectedFamily.store(familyCode, std::memory_order_relaxed);
}

void Engine::setAddBassEnabled(bool enabled) {
    mAddBassEnabled.store(enabled, std::memory_order_relaxed);
}

void Engine::setOctaveOffset(int offset) {
    mOctaveOffset.store(offset, std::memory_order_relaxed);
}

void Engine::setTriggerBaseNote(uint8_t baseMidiNote) {
    mTriggerBaseNote.store(baseMidiNote, std::memory_order_relaxed);
}

void Engine::process(
    const AudioTimeStamp* timestamp,
    AUAudioFrameCount frameCount,
    const AURenderEvent* realtimeEventListHead,
    AUMIDIOutputEventBlock midiOutputBlock
) {
    if (!midiOutputBlock) return;

    AUEventSampleTime baseTime = (timestamp && (timestamp->mFlags & kAudioTimeStampSampleTimeValid))
                                 ? (AUEventSampleTime)timestamp->mSampleTime
                                 : AUEventSampleTimeImmediate;

    const AURenderEvent* event = realtimeEventListHead;
    while (event != nullptr) {
        if (event->head.eventType == AURenderEventMIDI) {
            const AUMIDIEvent& midi = event->MIDI;
            if (midi.length >= 3) {
                int offset = std::clamp((int)midi.eventSampleTime, 0, (int)frameCount - 1);
                handleMIDI1(midi.data[0], midi.data[1], midi.data[2], offset, midiOutputBlock, baseTime);
            }
        } else if (event->head.eventType == AURenderEventMIDIEventList) {
            const AUMIDIEventList& list = event->MIDIEventsList;
            const MIDIEventList* eventList = &list.eventList;
            const MIDIEventPacket* packet = &eventList->packet[0];
            for (uint32_t p = 0; p < eventList->numPackets; ++p) {
                int offset = std::clamp((int)packet->timeStamp, 0, (int)frameCount - 1);
                for (uint32_t w = 0; w < packet->wordCount; ++w) {
                    uint32_t word = packet->words[w];
                    uint8_t mt = (word >> 28) & 0x0F;
                    if (mt == 0x2) { // 32-bit MIDI 1.0 Channel Voice Message inside UMP
                        uint8_t status = (word >> 16) & 0xFF;
                        uint8_t data1  = (word >> 8)  & 0xFF;
                        uint8_t data2  = word & 0xFF;
                        handleMIDI1(status, data1, data2, offset, midiOutputBlock, baseTime);
                    }
                }
                packet = MIDIEventPacketNext(packet);
            }
        }
        event = event->head.next;
    }
}

void Engine::handleMIDI1(
    uint8_t status,
    uint8_t data1,
    uint8_t data2,
    int offset,
    AUMIDIOutputEventBlock midiOutputBlock,
    AUEventSampleTime baseTime
) {
    uint8_t msgType = status & 0xF0;
    uint8_t channel = status & 0x0F;

    if (msgType == 0x90 && data2 > 0) {
        handleNoteOn(channel, data1, data2, offset, midiOutputBlock, baseTime);
    } else if (msgType == 0x80 || (msgType == 0x90 && data2 == 0)) {
        handleNoteOff(channel, data1, offset, midiOutputBlock, baseTime);
    } else if (msgType == 0xB0) {
        if (data1 == 123 || data1 == 120) {
            allNotesOff(midiOutputBlock, baseTime);
        } else {
            AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;
            uint8_t bytes[3] = { status, data1, data2 };
            midiOutputBlock(st, 0, 3, bytes);
        }
    } else if (msgType == 0xE0) {
        AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;
        uint8_t bytes[3] = { status, data1, data2 };
        midiOutputBlock(st, 0, 3, bytes);
    }
}

void Engine::handleNoteOn(
    uint8_t channel,
    uint8_t note,
    uint8_t velocity,
    int offset,
    AUMIDIOutputEventBlock midiOutputBlock,
    AUEventSampleTime baseTime
) {
    uint8_t baseTrigger = mTriggerBaseNote.load(std::memory_order_relaxed);

    // 1. Check if this is a lower-octave Chord Slot Trigger (e.g. C2 to A2, or C1 to A1)
    if (note >= baseTrigger && note < baseTrigger + NUM_CHORD_SLOTS) {
        size_t slotIdx = note - baseTrigger;
        mLastTriggeredSlot.store((int)slotIdx, std::memory_order_relaxed);

        const StoredChordSlot& slot = mSlots[slotIdx];
        if (slot.count > 0) {
            ActiveVoice* targetVoice = nullptr;
            for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
                if (!mVoices[i].active) {
                    targetVoice = &mVoices[i];
                    break;
                }
            }
            if (!targetVoice) targetVoice = &mVoices[0];

            targetVoice->triggerKey = note;
            targetVoice->channel = channel;
            targetVoice->noteCount = slot.count;
            targetVoice->active = true;

            int octOffset = mOctaveOffset.load(std::memory_order_relaxed);
            AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;

            for (uint8_t n = 0; n < slot.count; ++n) {
                int outNote = (int)slot.notes[n] + octOffset;
                outNote = std::clamp(outNote, 0, 127);
                targetVoice->soundingNotes[n] = (uint8_t)outNote;

                uint8_t noteOnBytes[3] = { (uint8_t)(0x90 | (channel & 0x0F)), (uint8_t)outNote, velocity };
                midiOutputBlock(st, 0, 3, noteOnBytes);
            }
            return;
        }
    }

    // 2. Performance Melody Harmonizer with SURPRISE MODE
    if (mLiveHarmonizerEnabled.load(std::memory_order_relaxed)) {
        mLastTriggeredMelodyNote.store((int)note, std::memory_order_relaxed);

        uint8_t targetFamily = mSelectedFamily.load(std::memory_order_relaxed);

        // Filter matching recipes by selected family
        uint16_t matchingIndices[NUM_RECIPES];
        uint16_t matchingCount = 0;

        for (size_t r = 0; r < NUM_RECIPES; ++r) {
            if (targetFamily == 0 || ALL_RECIPES[r].family == targetFamily) {
                matchingIndices[matchingCount++] = (uint16_t)r;
            }
        }

        // Fallback to all recipes if none match family
        if (matchingCount == 0) {
            for (size_t r = 0; r < NUM_RECIPES; ++r) {
                matchingIndices[matchingCount++] = (uint16_t)r;
            }
        }

        // Pick a random recipe for this melody note (Surprise Me!)
        uint16_t chosenRecipeIndex = matchingIndices[fastRand() % matchingCount];
        const Recipe& recipe = ALL_RECIPES[chosenRecipeIndex];

        // Allocate voice
        ActiveVoice* targetVoice = nullptr;
        for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
            if (!mVoices[i].active) {
                targetVoice = &mVoices[i];
                break;
            }
        }
        if (!targetVoice) targetVoice = &mVoices[0];

        targetVoice->triggerKey = note;
        targetVoice->channel = channel;
        targetVoice->active = true;

        int octOffset = mOctaveOffset.load(std::memory_order_relaxed);
        bool addBass = mAddBassEnabled.load(std::memory_order_relaxed);
        AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;

        uint8_t voiceCount = 0;

        // Sound chord notes
        for (uint8_t n = 0; n < recipe.noteCount; ++n) {
            int outNote = (int)note + recipe.noteOffsets[n] + octOffset;
            outNote = std::clamp(outNote, 0, 127);
            targetVoice->soundingNotes[voiceCount++] = (uint8_t)outNote;

            uint8_t noteOnBytes[3] = { (uint8_t)(0x90 | (channel & 0x0F)), (uint8_t)outNote, velocity };
            midiOutputBlock(st, 0, 3, noteOnBytes);
        }

        // Sound bass note if enabled
        if (addBass && voiceCount < MAX_CHORD_NOTES) {
            int bassNote = (int)note + recipe.bassOffset + octOffset;
            bassNote = std::clamp(bassNote, 0, 127);
            targetVoice->soundingNotes[voiceCount++] = (uint8_t)bassNote;

            uint8_t bassBytes[3] = { (uint8_t)(0x90 | (channel & 0x0F)), (uint8_t)bassNote, velocity };
            midiOutputBlock(st, 0, 3, bassBytes);
        }

        targetVoice->noteCount = voiceCount;

        // Notify UI of the live surprise chord
        mLastVoicedRecipeIndex.store((int)chosenRecipeIndex, std::memory_order_relaxed);
        mLastVoicedMelodyNote.store((int)note, std::memory_order_relaxed);

        return;
    }

    // 3. Fallback: Pass-Through
    AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;
    uint8_t bytes[3] = { (uint8_t)(0x90 | (channel & 0x0F)), note, velocity };
    midiOutputBlock(st, 0, 3, bytes);
}

void Engine::handleNoteOff(
    uint8_t channel,
    uint8_t note,
    int offset,
    AUMIDIOutputEventBlock midiOutputBlock,
    AUEventSampleTime baseTime
) {
    AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;
    bool foundVoice = false;

    // Turn off all sounding notes that were triggered by this key
    for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
        if (mVoices[i].active && mVoices[i].triggerKey == note && mVoices[i].channel == channel) {
            foundVoice = true;
            for (uint8_t n = 0; n < mVoices[i].noteCount; ++n) {
                uint8_t noteOffBytes[3] = { (uint8_t)(0x80 | (channel & 0x0F)), mVoices[i].soundingNotes[n], 0 };
                midiOutputBlock(st, 0, 3, noteOffBytes);
            }
            mVoices[i].active = false;
            mVoices[i].noteCount = 0;
        }
    }

    if (!foundVoice) {
        uint8_t bytes[3] = { (uint8_t)(0x80 | (channel & 0x0F)), note, 0 };
        midiOutputBlock(st, 0, 3, bytes);
    }
}

void Engine::allNotesOff(AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime) {
    AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? baseTime : AUEventSampleTimeImmediate;
    for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
        if (mVoices[i].active) {
            for (uint8_t n = 0; n < mVoices[i].noteCount; ++n) {
                uint8_t bytes[3] = { (uint8_t)(0x80 | (mVoices[i].channel & 0x0F)), mVoices[i].soundingNotes[n], 0 };
                midiOutputBlock(st, 0, 3, bytes);
            }
            mVoices[i].active = false;
            mVoices[i].noteCount = 0;
        }
    }
}

void Engine::triggerAuditionChord(const uint8_t* notes, uint8_t count, AUMIDIOutputEventBlock midiOutputBlock) {
    if (!midiOutputBlock) return;
    stopAuditionChord(midiOutputBlock);

    uint8_t safeCount = std::min<uint8_t>(count, MAX_CHORD_NOTES);
    mAuditionVoice.noteCount = safeCount;
    mAuditionVoice.channel = 0;
    mAuditionVoice.active = true;

    int octOffset = mOctaveOffset.load(std::memory_order_relaxed);
    for (uint8_t i = 0; i < safeCount; ++i) {
        int note = std::clamp((int)notes[i] + octOffset, 0, 127);
        mAuditionVoice.soundingNotes[i] = (uint8_t)note;
        uint8_t bytes[3] = { 0x90, (uint8_t)note, 96 };
        midiOutputBlock(AUEventSampleTimeImmediate, 0, 3, bytes);
    }
}

void Engine::stopAuditionChord(AUMIDIOutputEventBlock midiOutputBlock) {
    if (!midiOutputBlock || !mAuditionVoice.active) return;
    for (uint8_t i = 0; i < mAuditionVoice.noteCount; ++i) {
        uint8_t bytes[3] = { 0x80, mAuditionVoice.soundingNotes[i], 0 };
        midiOutputBlock(AUEventSampleTimeImmediate, 0, 3, bytes);
    }
    mAuditionVoice.active = false;
    mAuditionVoice.noteCount = 0;
}

} // namespace HarmonyLab
