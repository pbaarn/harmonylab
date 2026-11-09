//
// HarmonyLabViewModel.swift
// HarmonyLab AUv3 MIDI FX
//

import Foundation
import SwiftUI
import Combine

public class HarmonyLabViewModel: ObservableObject {
    public weak var audioUnit: HarmonyLabAudioUnit? {
        didSet {
            syncAllToAudioUnit()
        }
    }

    // Filter controls
    @Published public var selectedPitchClass: String = "E" {
        didSet { refreshMatchingVoicings() }
    }
    @Published public var selectedOctave: Int = 5 {
        didSet { refreshMatchingVoicings() }
    }
    @Published public var selectedFamily: ChordFamily = .all {
        didSet {
            audioUnit?.setSelectedFamily(HarmonyLabViewModel.familyCode(for: selectedFamily))
            refreshMatchingVoicings()
            saveSettings()
        }
    }
    @Published public var searchQuery: String = "" {
        didSet { filterVoicings() }
    }

    // Matching voicings in narrow column
    @Published public var matchingVoicings: [NativeVoicing] = []
    @Published public var activeVoicing: NativeVoicing? = nil {
        didSet {
            syncActiveVoicingToAudioUnit()
        }
    }

    // History of last 12 chords
    @Published public var chordHistory: [ChordHistoryItem] = []

    // 10 Stored Chord Trigger Slots
    @Published public var chordSlots: [ChordSlot] = (0..<10).map { ChordSlot(id: $0) }

    // Controls
    @Published public var liveHarmonizerEnabled: Bool = true {
        didSet { audioUnit?.setLiveHarmonizerEnabled(liveHarmonizerEnabled) }
    }
    @Published public var addBass: Bool = true {
        didSet {
            audioUnit?.setAddBassEnabled(addBass)
            syncActiveVoicingToAudioUnit()
            saveSettings()
        }
    }
    @Published public var octaveOffset: Int = 0 {
        didSet {
            audioUnit?.setOctaveOffset(octaveOffset * 12)
            saveSettings()
        }
    }
    @Published public var triggerBaseNote: UInt8 = 36 { // 36 = C2, 24 = C1
        didSet {
            audioUnit?.setTriggerBaseNote(triggerBaseNote)
            saveSettings()
        }
    }

    // Real-time visual feedback for active incoming MIDI
    @Published public var lastTriggeredSlot: Int? = nil
    @Published public var lastTriggeredMelodyNote: Int? = nil

    private var cancellables = Set<AnyCancellable>()
    private var pollTimer: Timer?
    private var allFilteredVoicings: [NativeVoicing] = []
    private var lastRecordedEventCounter: UInt32 = 0

    public static func familyCode(for family: ChordFamily) -> UInt8 {
        switch family {
        case .all: return 0
        case .major: return 1
        case .minor: return 2
        case .dominant: return 3
        case .altered: return 4
        case .halfDiminished: return 5
        case .diminished: return 6
        case .suspended: return 7
        }
    }

    public init(audioUnit: HarmonyLabAudioUnit? = nil) {
        self.audioUnit = audioUnit
        loadSettings()
        loadSlots()
        loadHistory()
        refreshMatchingVoicings()

        // Default to first seed voicing if available
        if let first = VoicingsEngine.seedVoicings.first {
            self.activeVoicing = first
        }

        // CRITICAL: Synchronize all loaded slots and parameters to C++ AudioUnit engine!
        syncAllToAudioUnit()

        startPollingAudioUnit()
    }

    deinit {
        pollTimer?.invalidate()
    }

    private func startPollingAudioUnit() {
        pollTimer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
            guard let self = self, let au = self.audioUnit else { return }

            let slot = au.getLastTriggeredSlot()
            if slot >= 0 && slot < 10 {
                if self.lastTriggeredSlot != slot {
                    self.lastTriggeredSlot = slot
                    // Update activeVoicing and piano visualizer to the chord stored in this slot
                    if let slotChord = self.chordSlots[slot].chord {
                        self.activeVoicing = slotChord
                    }
                    // Auto-clear after 250ms
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        if self.lastTriggeredSlot == slot {
                            self.lastTriggeredSlot = nil
                        }
                    }
                }
            }

            let melody = au.getLastTriggeredMelodyNote()
            if melody >= 0 && melody <= 127 {
                if self.lastTriggeredMelodyNote != melody {
                    self.lastTriggeredMelodyNote = melody
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        if self.lastTriggeredMelodyNote == melody {
                            self.lastTriggeredMelodyNote = nil
                        }
                    }
                }
            }

            // Real-time synchronization of Live Surprise Chord on EVERY key press
            let currentEventCounter = au.getVoicedEventCounter()
            if self.lastRecordedEventCounter != currentEventCounter {
                self.lastRecordedEventCounter = currentEventCounter

                let recipeIdx = Int(au.getLastVoicedRecipeIndex())
                let voicedMelody = au.getLastVoicedMelodyNote()

                if recipeIdx >= 0 && voicedMelody >= 0 && voicedMelody <= 127 {
                    let targetTopMidi = UInt8(voicedMelody)

                    // Guard: Ensure slot trigger keys are NEVER treated as melody surprise chords!
                    let baseTrigger = self.triggerBaseNote
                    if targetTopMidi >= baseTrigger && targetTopMidi < baseTrigger + 10 {
                        return
                    }

                    if let exactChord = VoicingsEngine.shared.voicingForRecipe(index: recipeIdx, targetTopMidi: targetTopMidi) {
                        let melodyPc = VoicingsEngine.sharpNames[Int(targetTopMidi) % 12]
                        let melodyOct = (Int(targetTopMidi) / 12) - 1

                        if self.selectedPitchClass != melodyPc || self.selectedOctave != melodyOct {
                            self.selectedPitchClass = melodyPc
                            self.selectedOctave = melodyOct
                        }

                        // Immediately update the displayed active voicing on this exact key press
                        if let matching = self.matchingVoicings.first(where: {
                            $0.id == exactChord.id || ($0.chordSymbol == exactChord.chordSymbol && $0.midiNotes == exactChord.midiNotes)
                        }) {
                            self.activeVoicing = matching
                            self.addToHistory(matching)
                        } else {
                            self.activeVoicing = exactChord
                            self.addToHistory(exactChord)
                        }
                    }
                }
            }
        }
    }

    public func refreshMatchingVoicings() {
        allFilteredVoicings = VoicingsEngine.shared.getVoicings(
            topPitchClass: selectedPitchClass,
            topOctave: selectedOctave,
            family: selectedFamily
        )
        filterVoicings()
    }

    private func filterVoicings() {
        let q = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if q.isEmpty {
            matchingVoicings = allFilteredVoicings
        } else {
            matchingVoicings = allFilteredVoicings.filter {
                $0.chordSymbol.lowercased().contains(q) ||
                $0.name.lowercased().contains(q) ||
                $0.root.lowercased().contains(q) ||
                $0.styleTags.contains(where: { $0.lowercased().contains(q) })
            }
        }
    }

    public func surpriseMe() {
        let pool = matchingVoicings.isEmpty ? allFilteredVoicings : matchingVoicings
        guard let choice = pool.randomElement() else { return }
        self.activeVoicing = choice
        triggerAudition(choice)
        self.addToHistory(choice)
    }

    public func selectVoicing(_ voicing: NativeVoicing) {
        self.activeVoicing = voicing
        triggerAudition(voicing)
        self.addToHistory(voicing)
    }

    public func storeCurrentVoicing(inSlot slotIndex: Int) {
        guard let chord = activeVoicing else { return }
        storeVoicing(chord, inSlot: slotIndex)
    }

    public func storeVoicing(_ voicing: NativeVoicing, inSlot slotIndex: Int) {
        guard slotIndex >= 0 && slotIndex < 10 else { return }
        chordSlots[slotIndex].chord = voicing
        chordSlots[slotIndex].customName = voicing.chordSymbol
        syncSlotToAudioUnit(slotIndex)
        saveSlots()
    }

    // MARK: - History Management (Last 12 Chords)

    public func addToHistory(_ chord: NativeVoicing) {
        // Prevent duplicate at top
        if let first = chordHistory.first,
           first.chord.chordSymbol == chord.chordSymbol && first.chord.midiNotes == chord.midiNotes {
            return
        }
        let item = ChordHistoryItem(chord: chord)
        chordHistory.insert(item, at: 0)
        if chordHistory.count > 12 {
            chordHistory = Array(chordHistory.prefix(12))
        }
        saveHistory()
    }

    public func clearHistory() {
        chordHistory.removeAll()
        saveHistory()
    }

    public func selectHistoryChord(_ historyItem: ChordHistoryItem) {
        let chord = historyItem.chord
        let (pc, oct) = VoicingsEngine.parseNoteName(chord.topNote)
        if selectedPitchClass != pc || selectedOctave != oct {
            selectedPitchClass = pc
            selectedOctave = oct
        }
        self.activeVoicing = chord
        triggerAudition(chord)
    }

    public func isVoicingSelected(_ voicing: NativeVoicing) -> Bool {
        guard let active = activeVoicing else { return false }
        return active.id == voicing.id || (active.chordSymbol == voicing.chordSymbol && active.midiNotes == voicing.midiNotes)
    }

    public func clearSlot(_ slotIndex: Int) {
        guard slotIndex >= 0 && slotIndex < 10 else { return }
        chordSlots[slotIndex].chord = nil
        chordSlots[slotIndex].customName = nil
        audioUnit?.clearSlot(slotIndex)
        saveSlots()
    }

    public func triggerAudition(_ voicing: NativeVoicing) {
        var notes = voicing.midiNotes
        if addBass, let bass = voicing.bassNoteMidi {
            if !notes.contains(bass) {
                notes.insert(bass, at: 0)
            }
        }

        // 1. Instant audio preview via polyphonic synth engine (works in Standalone & AUv3)
        ChordPreviewPlayer.shared.playChord(notes)

        // 2. Transmit MIDI notes through AudioUnit (for Logic Pro track instrument)
        audioUnit?.triggerAuditionNotes(notes, count: UInt8(notes.count))

        // Auto release MIDI notes after 1.0s
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.audioUnit?.stopAuditionNotes()
        }
    }

    public func stopAudition() {
        ChordPreviewPlayer.shared.stopChord()
        audioUnit?.stopAuditionNotes()
    }

    public func getTriggerKeyName(forSlot slotIndex: Int) -> String {
        let midi = triggerBaseNote + UInt8(slotIndex)
        return VoicingsEngine.midiToNoteName(midi)
    }

    // Sync all state to C++ AudioUnit engine
    public func syncAllToAudioUnit() {
        guard let au = audioUnit else { return }
        au.setLiveHarmonizerEnabled(liveHarmonizerEnabled)
        au.setSelectedFamily(HarmonyLabViewModel.familyCode(for: selectedFamily))
        au.setAddBassEnabled(addBass)
        au.setOctaveOffset(octaveOffset * 12)
        au.setTriggerBaseNote(triggerBaseNote)
        syncActiveVoicingToAudioUnit()
        for i in 0..<10 {
            syncSlotToAudioUnit(i)
        }
    }

    private func syncActiveVoicingToAudioUnit() {
        guard let au = audioUnit, let v = activeVoicing else { return }
        var notes = v.midiNotes
        if addBass, let bass = v.bassNoteMidi {
            if !notes.contains(bass) {
                notes.insert(bass, at: 0)
            }
        }
        au.setActiveVoicingNotes(notes, count: UInt8(notes.count))
    }

    private func syncSlotToAudioUnit(_ slotIndex: Int) {
        guard let au = audioUnit, slotIndex >= 0 && slotIndex < 10 else { return }
        if let chord = chordSlots[slotIndex].chord {
            var notes = chord.midiNotes
            if addBass, let bass = chord.bassNoteMidi {
                if !notes.contains(bass) {
                    notes.insert(bass, at: 0)
                }
            }
            au.setSlot(slotIndex, notes: notes, count: UInt8(notes.count), name: chord.chordSymbol)
        } else {
            au.clearSlot(slotIndex)
        }
    }

    // Persistence in UserDefaults
    private func saveSlots() {
        if let encoded = try? JSONEncoder().encode(chordSlots) {
            UserDefaults.standard.set(encoded, forKey: "HarmonyLab_ChordSlots_v1")
        }
    }

    private func loadSlots() {
        if let data = UserDefaults.standard.data(forKey: "HarmonyLab_ChordSlots_v1"),
           let decoded = try? JSONDecoder().decode([ChordSlot].self, from: data),
           decoded.count == 10 {
            self.chordSlots = decoded
            for i in 0..<10 {
                syncSlotToAudioUnit(i)
            }
        }
    }

    // Settings persistence
    private func saveSettings() {
        UserDefaults.standard.set(triggerBaseNote, forKey: "HarmonyLab_TriggerBaseNote_v1")
        UserDefaults.standard.set(addBass, forKey: "HarmonyLab_AddBass_v1")
        UserDefaults.standard.set(octaveOffset, forKey: "HarmonyLab_OctaveOffset_v1")
        UserDefaults.standard.set(selectedFamily.rawValue, forKey: "HarmonyLab_SelectedFamily_v1")
    }

    private func loadSettings() {
        if let savedBase = UserDefaults.standard.object(forKey: "HarmonyLab_TriggerBaseNote_v1") as? UInt8 {
            self.triggerBaseNote = savedBase
        }
        if let savedBass = UserDefaults.standard.object(forKey: "HarmonyLab_AddBass_v1") as? Bool {
            self.addBass = savedBass
        }
        if let savedOct = UserDefaults.standard.object(forKey: "HarmonyLab_OctaveOffset_v1") as? Int {
            self.octaveOffset = savedOct
        }
        if let savedFamStr = UserDefaults.standard.string(forKey: "HarmonyLab_SelectedFamily_v1"),
           let fam = ChordFamily(rawValue: savedFamStr) {
            self.selectedFamily = fam
        }
    }

    private func saveHistory() {
        if let encoded = try? JSONEncoder().encode(chordHistory) {
            UserDefaults.standard.set(encoded, forKey: "HarmonyLab_ChordHistory_v1")
        }
    }

    private func loadHistory() {
        if let data = UserDefaults.standard.data(forKey: "HarmonyLab_ChordHistory_v1"),
           let decoded = try? JSONDecoder().decode([ChordHistoryItem].self, from: data) {
            self.chordHistory = Array(decoded.prefix(12))
        }
    }
}
