//
// SimpleSynth.swift
// HarmonyLab Standalone App
//
// Lightweight polyphonic sound generator for standalone app audition
//

import AVFoundation

public class SimpleSynth {
    public static let shared = SimpleSynth()

    private var audioEngine = AVAudioEngine()
    private var sourceNode: AVAudioSourceNode?
    private var activeFrequencies: [Float] = []
    private var phases: [Float] = []
    private let lock = NSLock()

    private init() {
        setupAudio()
    }

    private func setupAudio() {
        let sampleRate: Double = 44100.0
        let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 2)!

        sourceNode = AVAudioSourceNode { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
            guard let self = self else { return noErr }
            let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)

            self.lock.lock()
            let freqs = self.activeFrequencies
            var phs = self.phases
            self.lock.unlock()

            if freqs.isEmpty {
                for buffer in ablPointer {
                    memset(buffer.mData, 0, Int(buffer.mDataByteSize))
                }
                return noErr
            }

            for frame in 0..<Int(frameCount) {
                var sample: Float = 0.0
                for i in 0..<freqs.count {
                    let freq = freqs[i]
                    let phase = phs[i]
                    // Warm harmonic EP-style synth (fundamental + subtle 2nd & 3rd harmonic)
                    let wave = sin(phase * 2.0 * Float.pi) * 0.6 + sin(phase * 4.0 * Float.pi) * 0.25 + sin(phase * 6.0 * Float.pi) * 0.15
                    sample += wave * 0.15

                    let phaseInc = freq / Float(sampleRate)
                    phs[i] = (phase + phaseInc).truncatingRemainder(dividingBy: 1.0)
                }

                for buffer in ablPointer {
                    let ptr = buffer.mData!.assumingMemoryBound(to: Float.self)
                    ptr[frame] = sample
                }
            }

            self.lock.lock()
            self.phases = phs
            self.lock.unlock()

            return noErr
        }

        if let node = sourceNode {
            audioEngine.attach(node)
            audioEngine.connect(node, to: audioEngine.mainMixerNode, format: format)
            try? audioEngine.start()
        }
    }

    public func playNotes(_ notes: [UInt8]) {
        lock.lock()
        activeFrequencies = notes.map { midiToFreq($0) }
        phases = [Float](repeating: 0.0, count: activeFrequencies.count)
        lock.unlock()
    }

    public func stopNotes() {
        lock.lock()
        activeFrequencies.removeAll()
        phases.removeAll()
        lock.unlock()
    }

    private func midiToFreq(_ midi: UInt8) -> Float {
        return 440.0 * pow(2.0, (Float(midi) - 69.0) / 12.0)
    }
}
