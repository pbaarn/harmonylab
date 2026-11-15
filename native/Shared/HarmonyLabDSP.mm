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

void Engine::setSelectionMode(uint8_t mode) {
    mSelectionMode.store(mode, std::memory_order_relaxed);
}

void Engine::beginFilteredChordBatch() {
    mPendingFilteredCount = 0;
}

void Engine::addFilteredChord(const uint8_t* notes, uint8_t count, uint8_t topNote) {
    if (mPendingFilteredCount >= MAX_FILTERED_CHORDS || !notes) return;
    uint8_t back = 1 - mActiveFilteredBuffer.load(std::memory_order_acquire);
    FilteredChord& dst = mFilteredBuffers[back][mPendingFilteredCount];
    uint8_t safeCount = std::min<uint8_t>(count, MAX_CHORD_NOTES);
    dst.count = safeCount;
    dst.topNote = topNote;
    for (uint8_t i = 0; i < safeCount; ++i) {
        dst.notes[i] = notes[i];
    }
    mPendingFilteredCount++;
}

void Engine::commitFilteredChordBatch() {
    uint8_t back = 1 - mActiveFilteredBuffer.load(std::memory_order_acquire);
    mFilteredCounts[back] = mPendingFilteredCount;
    mLastSurpriseIndex = -1;
    mActiveFilteredBuffer.store(back, std::memory_order_release);
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

void Engine::playChordToVoice(
    uint8_t channel,
    uint8_t triggerKey,
    uint8_t velocity,
    const uint8_t* notes,
    uint8_t count,
    int offset,
    AUMIDIOutputEventBlock midiOutputBlock,
    AUEventSampleTime baseTime
) {
    if (count == 0 || !notes) return;
    ActiveVoice* targetVoice = nullptr;
    for (size_t i = 0; i < MAX_ACTIVE_VOICES; ++i) {
        if (!mVoices[i].active) {
            targetVoice = &mVoices[i];
            break;
        }
    }
    if (!targetVoice) targetVoice = &mVoices[0];

    uint8_t safeCount = std::min<uint8_t>(count, MAX_CHORD_NOTES);
    targetVoice->triggerKey = triggerKey;
    targetVoice->channel = channel;
    targetVoice->noteCount = safeCount;
    targetVoice->active = true;

    int octOffset = mOctaveOffset.load(std::memory_order_relaxed);
    AUEventSampleTime st = (baseTime != AUEventSampleTimeImmediate) ? (baseTime + offset) : AUEventSampleTimeImmediate;

    for (uint8_t n = 0; n < safeCount; ++n) {
        int outNote = std::clamp((int)notes[n] + octOffset, 0, 127);
        targetVoice->soundingNotes[n] = (uint8_t)outNote;
        uint8_t noteOnBytes[3] = { (uint8_t)(0x90 | (channel & 0x0F)), (uint8_t)outNote, velocity };
        midiOutputBlock(st, 0, 3, noteOnBytes);
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
        mHeldSlotIndex.store((int)slotIdx, std::memory_order_relaxed);
        mSlotEventCounter.fetch_add(1, std::memory_order_relaxed);

        const StoredChordSlot& slot = mSlots[slotIdx];
        if (slot.count > 0) {
            playChordToVoice(channel, note, velocity, slot.notes, slot.count, offset, midiOutputBlock, baseTime);
        }
        return; // Always return: slot trigger keys must NEVER voice as melody notes
    }

    // 2. Surprise Me MIDI Trigger (A#2 = 46, right above C2-A2 chord slots)
    if (note == SURPRISE_TRIGGER_NOTE) {
        uint8_t front = mActiveFilteredBuffer.load(std::memory_order_acquire);
        uint16_t count = mFilteredCounts[front];
        if (count > 0) {
            uint16_t chosenIdx = (uint16_t)(fastRand() % count);
            if (count > 1 && (int)chosenIdx == mLastSurpriseIndex) {
                chosenIdx = (chosenIdx + 1) % count;
            }
            mLastSurpriseIndex = (int)chosenIdx;

            const FilteredChord& chord = mFilteredBuffers[front][chosenIdx];
            playChordToVoice(channel, note, velocity, chord.notes, chord.count, offset, midiOutputBlock, baseTime);

            mLastSurpriseChordIndex.store((int)chosenIdx, std::memory_order_relaxed);
            mSurpriseEventCounter.fetch_add(1, std::memory_order_relaxed);
        }
        return; // Always return: surprise trigger key must NEVER voice as a melody note
    }

    // 3. Performance Melody Harmonizer
    if (mLiveHarmonizerEnabled.load(std::memory_order_relaxed)) {
        mLastTriggeredMelodyNote.store((int)note, std::memory_order_relaxed);
        mHeldMelodyNote.store((int)note, std::memory_order_relaxed);

        // 3a. Common Tones mode: restrict to filtered chords, match top note or round down to nearest available top note
        if (mSelectionMode.load(std::memory_order_relaxed) == 1) {
            uint8_t front = mActiveFilteredBuffer.load(std::memory_order_acquire);
            uint16_t count = mFilteredCounts[front];
            if (count == 0) {
                return;
            }

            int bestTopNote = -1;
            uint8_t minTopNote = 127;
            for (uint16_t i = 0; i < count; ++i) {
                uint8_t tn = mFilteredBuffers[front][i].topNote;
                if (tn < minTopNote) minTopNote = tn;
                if (tn <= note && (int)tn > bestTopNote) {
                    bestTopNote = (int)tn;
                }
            }
            if (bestTopNote < 0) {
                bestTopNote = (int)minTopNote;
            }

            uint16_t matching[MAX_FILTERED_CHORDS];
            uint16_t matchCount = 0;
            for (uint16_t i = 0; i < count; ++i) {
                if (mFilteredBuffers[front][i].topNote == (uint8_t)bestTopNote) {
                    matching[matchCount++] = i;
                }
            }

            if (matchCount > 0) {
                uint16_t chosenIdx = matching[fastRand() % matchCount];
                const FilteredChord& chord = mFilteredBuffers[front][chosenIdx];
                playChordToVoice(channel, note, velocity, chord.notes, chord.count, offset, midiOutputBlock, baseTime);

                mLastCommonToneChordIndex.store((int)chosenIdx, std::memory_order_relaxed);
                mCommonToneEventCounter.fetch_add(1, std::memory_order_relaxed);
            }
            return;
        }

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
        mVoicedEventCounter.fetch_add(1, std::memory_order_relaxed);

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

    uint8_t baseTrigger = mTriggerBaseNote.load(std::memory_order_relaxed);
    if (note >= baseTrigger && note < baseTrigger + NUM_CHORD_SLOTS) {
        size_t slotIdx = note - baseTrigger;
        if (mHeldSlotIndex.load(std::memory_order_relaxed) == (int)slotIdx) {
            mHeldSlotIndex.store(-1, std::memory_order_relaxed);
        }
    } else {
        if (mHeldMelodyNote.load(std::memory_order_relaxed) == (int)note) {
            mHeldMelodyNote.store(-1, std::memory_order_relaxed);
        }
    }

    bool isSlotKey = (note >= baseTrigger && note < baseTrigger + NUM_CHORD_SLOTS);
    bool isSurpriseKey = (note == SURPRISE_TRIGGER_NOTE);
    bool isCommonToneBlocked = (mLiveHarmonizerEnabled.load(std::memory_order_relaxed) &&
                                mSelectionMode.load(std::memory_order_relaxed) == 1);
    if (!foundVoice && !isSlotKey && !isSurpriseKey && !isCommonToneBlocked) {
        uint8_t bytes[3] = { (uint8_t)(0x80 | (channel & 0x0F)), note, 0 };
        midiOutputBlock(st, 0, 3, bytes);
    }
}

void Engine::allNotesOff(AUMIDIOutputEventBlock midiOutputBlock, AUEventSampleTime baseTime) {
    mHeldSlotIndex.store(-1, std::memory_order_relaxed);
    mHeldMelodyNote.store(-1, std::memory_order_relaxed);
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
