#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVFoundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface HarmonyLabAudioUnit : AUAudioUnit

// Configuration called from Swift
- (void)setSlot:(NSInteger)slotIndex notes:(const uint8_t *)notes count:(uint8_t)count name:(NSString *)name;
- (void)clearSlot:(NSInteger)slotIndex;
- (void)setActiveVoicingNotes:(const uint8_t *)notes count:(uint8_t)count;
- (void)setLiveHarmonizerEnabled:(BOOL)enabled;
- (void)setSelectedFamily:(uint8_t)familyCode;
- (void)setAddBassEnabled:(BOOL)enabled;
- (void)setOctaveOffset:(NSInteger)offset;
- (void)setTriggerBaseNote:(uint8_t)baseNote;
- (void)setSelectionMode:(uint8_t)mode;
- (void)beginFilteredChordBatch;
- (void)addFilteredChordNotes:(const uint8_t *)notes count:(uint8_t)count topNote:(uint8_t)topNote;
- (void)commitFilteredChordBatch;

// Polling triggers & live voiced surprise chord from UI
- (NSInteger)getLastTriggeredSlot;
- (NSInteger)getHeldSlotIndex;
- (uint32_t)getSlotEventCounter;
- (void)clearLastTriggeredSlot;

- (NSInteger)getLastTriggeredMelodyNote;
- (NSInteger)getHeldMelodyNote;
- (void)clearLastTriggeredMelodyNote;

- (NSInteger)getLastVoicedRecipeIndex;
- (NSInteger)getLastVoicedMelodyNote;
- (uint32_t)getVoicedEventCounter;
- (void)clearLastVoicedInfo;

- (NSInteger)getLastSurpriseChordIndex;
- (uint32_t)getSurpriseEventCounter;

- (NSInteger)getLastCommonToneChordIndex;
- (uint32_t)getCommonToneEventCounter;

// Audition triggering from UI buttons
- (void)triggerAuditionNotes:(const uint8_t *)notes count:(uint8_t)count;
- (void)stopAuditionNotes;

@end

NS_ASSUME_NONNULL_END
