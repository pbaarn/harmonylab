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

// Polling triggers & live voiced surprise chord from UI
- (NSInteger)getLastTriggeredSlot;
- (void)clearLastTriggeredSlot;
- (NSInteger)getLastTriggeredMelodyNote;
- (void)clearLastTriggeredMelodyNote;

- (NSInteger)getLastVoicedRecipeIndex;
- (NSInteger)getLastVoicedMelodyNote;
- (uint32_t)getVoicedEventCounter;
- (void)clearLastVoicedInfo;

// Audition triggering from UI buttons
- (void)triggerAuditionNotes:(const uint8_t *)notes count:(uint8_t)count;
- (void)stopAuditionNotes;

@end

NS_ASSUME_NONNULL_END
