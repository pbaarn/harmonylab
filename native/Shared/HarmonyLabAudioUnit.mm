#import "HarmonyLabAudioUnit.h"
#import "HarmonyLabDSP.hpp"

@interface HarmonyLabAudioUnit () {
    AUAudioUnitBusArray *_inputBusArray;
    AUAudioUnitBusArray *_outputBusArray;
    HarmonyLab::Engine *_engine;
}
@end

@implementation HarmonyLabAudioUnit

- (instancetype)initWithComponentDescription:(AudioComponentDescription)componentDescription
                                     options:(AudioComponentInstantiationOptions)options
                                       error:(NSError **)outError {
    self = [super initWithComponentDescription:componentDescription options:options error:outError];
    if (self == nil) return nil;

    _engine = new HarmonyLab::Engine();

    // Critical Gotcha A: Dummy Audio Buses to prevent -10875 error in Logic Pro / auval
    AVAudioFormat *defaultFormat = [[AVAudioFormat alloc] initStandardFormatWithSampleRate:44100.0 channels:2];
    AUAudioUnitBus *inBus = [[AUAudioUnitBus alloc] initWithFormat:defaultFormat error:nil];
    AUAudioUnitBus *outBus = [[AUAudioUnitBus alloc] initWithFormat:defaultFormat error:nil];

    _inputBusArray = [[AUAudioUnitBusArray alloc] initWithAudioUnit:self
                                                            busType:AUAudioUnitBusTypeInput
                                                            busses:@[inBus]];
    _outputBusArray = [[AUAudioUnitBusArray alloc] initWithAudioUnit:self
                                                             busType:AUAudioUnitBusTypeOutput
                                                             busses:@[outBus]];

    return self;
}

- (void)dealloc {
    delete _engine;
}

- (AUAudioUnitBusArray *)inputBusses {
    return _inputBusArray;
}

- (AUAudioUnitBusArray *)outputBusses {
    return _outputBusArray;
}

- (BOOL)allocateRenderResourcesAndReturnError:(NSError **)outError {
    if (![super allocateRenderResourcesAndReturnError:outError]) {
        return NO;
    }
    _engine->setSampleRate(self.outputBusses[0].format.sampleRate);
    _engine->reset();
    return YES;
}

- (void)deallocateRenderResources {
    _engine->reset();
    [super deallocateRenderResources];
}

- (AUInternalRenderBlock)internalRenderBlock {
    HarmonyLab::Engine *engine = _engine;
    __weak HarmonyLabAudioUnit *weakSelf = self;

    return ^AUAudioUnitStatus(
        AudioUnitRenderActionFlags *actionFlags,
        const AudioTimeStamp *timestamp,
        AUAudioFrameCount frameCount,
        NSInteger outputBusNumber,
        AudioBufferList *outputData,
        const AURenderEvent *realtimeEventListHead,
        AURenderPullInputBlock pullInputBlock
    ) {
        // Clear dummy audio output buffer (silence)
        for (UInt32 i = 0; i < outputData->mNumberBuffers; ++i) {
            memset(outputData->mBuffers[i].mData, 0, outputData->mBuffers[i].mDataByteSize);
        }

        HarmonyLabAudioUnit *strongSelf = weakSelf;
        if (strongSelf && engine) {
            AUMIDIOutputEventBlock midiOut = strongSelf.MIDIOutputEventBlock;
            if (midiOut) {
                engine->process(timestamp, frameCount, realtimeEventListHead, midiOut);
            }
        }

        return noErr;
    };
}

#pragma mark - Swift Configuration Bridge

- (void)setSlot:(NSInteger)slotIndex notes:(const uint8_t *)notes count:(uint8_t)count name:(NSString *)name {
    if (_engine) {
        _engine->setSlotChord((size_t)slotIndex, notes, count, [name UTF8String]);
    }
}

- (void)clearSlot:(NSInteger)slotIndex {
    if (_engine) {
        _engine->clearSlot((size_t)slotIndex);
    }
}

- (void)setActiveVoicingNotes:(const uint8_t *)notes count:(uint8_t)count {
    if (_engine) {
        _engine->setActiveVoicingNotes(notes, count);
    }
}

- (void)setLiveHarmonizerEnabled:(BOOL)enabled {
    if (_engine) {
        _engine->setLiveHarmonizerEnabled(enabled);
    }
}

- (void)setAddBassEnabled:(BOOL)enabled {
    if (_engine) {
        _engine->setAddBassEnabled(enabled);
    }
}

- (void)setOctaveOffset:(NSInteger)offset {
    if (_engine) {
        _engine->setOctaveOffset((int)offset);
    }
}

- (void)setTriggerBaseNote:(uint8_t)baseNote {
    if (_engine) {
        _engine->setTriggerBaseNote(baseNote);
    }
}

- (NSInteger)getLastTriggeredSlot {
    return _engine ? _engine->getLastTriggeredSlot() : -1;
}

- (void)clearLastTriggeredSlot {
    if (_engine) {
        _engine->clearLastTriggeredSlot();
    }
}

- (NSInteger)getLastTriggeredMelodyNote {
    return _engine ? _engine->getLastTriggeredMelodyNote() : -1;
}

- (void)clearLastTriggeredMelodyNote {
    if (_engine) {
        _engine->clearLastTriggeredMelodyNote();
    }
}

- (void)triggerAuditionNotes:(const uint8_t *)notes count:(uint8_t)count {
    if (_engine && self.MIDIOutputEventBlock) {
        _engine->triggerAuditionChord(notes, count, self.MIDIOutputEventBlock);
    }
}

- (void)stopAuditionNotes {
    if (_engine && self.MIDIOutputEventBlock) {
        _engine->stopAuditionChord(self.MIDIOutputEventBlock);
    }
}

@end
