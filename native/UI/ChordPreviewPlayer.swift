//
// ChordPreviewPlayer.swift
// HarmonyLab AUv3 MIDI FX
//
// Polyphonic audio preview synthesizer for instant chord audition in Standalone & AUv3 modes.
//

import AVFoundation

public class ChordPreviewPlayer {
    public static let shared = ChordPreviewPlayer()

    private struct Voice {
        var note: UInt8
        var freq: Float
        var phase: Float
        var phaseInc: Float
        var envelope: Float
        var decayCoeff: Float
        var attackFrames: Int
        var ageFrames: Int
        var leftGain: Float
        var rightGain: Float
    }

    private var engine = AVAudioEngine()
    private var sourceNode: AVAudioSourceNode?
    private var voices: [Voice] = []
    private let lock = NSLock()
    private var sampleRate: Double = 44100.0

    private init() {
        setupAudio()
    }

    private func setupAudio() {
        let hwFormat = engine.outputNode.outputFormat(forBus: 0)
        sampleRate = hwFormat.sampleRate > 0 ? hwFormat.sampleRate : 44100.0
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 2)!

        sourceNode = AVAudioSourceNode { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
            guard let self = self else { return noErr }
            let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)

            self.lock.lock()
            var currentVoices = self.voices
            self.lock.unlock()

            if currentVoices.isEmpty {
                for buffer in ablPointer {
                    memset(buffer.mData, 0, Int(buffer.mDataByteSize))
                }
                return noErr
            }

            let leftPtr = ablPointer[0].mData!.assumingMemoryBound(to: Float.self)
            let rightPtr = (ablPointer.count > 1 ? ablPointer[1] : ablPointer[0]).mData!.assumingMemoryBound(to: Float.self)

            for frame in 0..<Int(frameCount) {
                var leftSample: Float = 0.0
                var rightSample: Float = 0.0

                var vIdx = 0
                while vIdx < currentVoices.count {
                    var v = currentVoices[vIdx]
                    let attackGain: Float = v.ageFrames < v.attackFrames ? (Float(v.ageFrames) / Float(v.attackFrames)) : 1.0
                    let amp = v.envelope * attackGain

                    let p = v.phase
                    // Warm Acoustic / Rhodes Harmonic Spectrum
                    let wave = sin(p * 2.0 * Float.pi) * 0.65 +
                               sin(p * 4.0 * Float.pi) * 0.22 +
                               sin(p * 6.0 * Float.pi) * 0.10 +
                               sin(p * 8.0 * Float.pi) * 0.03

                    leftSample += wave * amp * v.leftGain
                    rightSample += wave * amp * v.rightGain

                    v.phase = (p + v.phaseInc).truncatingRemainder(dividingBy: 1.0)
                    v.envelope *= v.decayCoeff
                    v.ageFrames += 1

                    if v.envelope < 0.0005 {
                        currentVoices.remove(at: vIdx)
                    } else {
                        currentVoices[vIdx] = v
                        vIdx += 1
                    }
                }

                leftPtr[frame] = leftSample
                rightPtr[frame] = rightSample
            }

            self.lock.lock()
            self.voices = currentVoices
            self.lock.unlock()

            return noErr
        }

        if let node = sourceNode {
            engine.attach(node)
            engine.connect(node, to: engine.mainMixerNode, format: format)
            do {
                try engine.start()
            } catch {
                print("HarmonyLab: Error starting ChordPreviewPlayer engine: \(error)")
            }
        }
    }

    public func playChord(_ notes: [UInt8]) {
        guard !notes.isEmpty else { return }
        if !engine.isRunning {
            try? engine.start()
        }

        let baseVolume: Float = 0.28 / sqrt(Float(notes.count))
        let minNote = Float(notes.min() ?? 60)
        let maxNote = Float(notes.max() ?? 72)
        let noteRange = max(12.0, maxNote - minNote)

        var newVoices: [Voice] = []
        for note in notes {
            let freq = 440.0 * pow(2.0, (Float(note) - 69.0) / 12.0)
            let phaseInc = freq / Float(sampleRate)

            // Stereo Pan: lower notes slightly left (-0.25), higher notes slightly right (+0.25)
            let panNorm = (Float(note) - minNote) / noteRange
            let pan = (panNorm - 0.5) * 0.5
            let leftGain = baseVolume * (1.0 - pan) * 0.5
            let rightGain = baseVolume * (1.0 + pan) * 0.5

            // Higher notes decay slightly faster (1.3s), bass notes sustain longer (2.2s)
            let decaySeconds: Float = 2.2 - 0.9 * (Float(note) / 127.0)
            let decayCoeff = pow(0.001, Float(1.0 / (sampleRate * Double(decaySeconds))))

            let v = Voice(
                note: note,
                freq: freq,
                phase: 0.0,
                phaseInc: phaseInc,
                envelope: 1.0,
                decayCoeff: Float(decayCoeff),
                attackFrames: Int(sampleRate * 0.005), // 5ms soft attack
                ageFrames: 0,
                leftGain: leftGain,
                rightGain: rightGain
            )
            newVoices.append(v)
        }

        lock.lock()
        // Keep up to 6 older decaying voices for musical chord transitions across progressions
        if voices.count > 6 {
            voices = Array(voices.suffix(6))
        }
        voices.append(contentsOf: newVoices)
        lock.unlock()
    }

    public func playSingleNote(_ note: UInt8) {
        playChord([note])
    }

    public func stopChord() {
        lock.lock()
        // Smooth 40ms fade-out on all active voices (prevents clicks)
        let fadeOutCoeff = pow(0.01, Float(1.0 / (sampleRate * 0.04)))
        for i in 0..<voices.count {
            voices[i].decayCoeff = Float(fadeOutCoeff)
        }
        lock.unlock()
    }
}
