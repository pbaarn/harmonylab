import { Voicing } from '@/types/harmonylab';
import { midiToFrequency } from './theory';

class HarmonyAudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private isMuted: boolean = false;
  private activeVoices: Map<number, { osc: OscillatorNode; gain: GainNode }[]> = new Map();

  constructor() {
    // Lazily initialize in browser
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Master output
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);

      // Create warm algorithmic impulse reverb for studio acoustic ambience
      this.reverbNode = this.createStudioReverb(this.audioCtx);

      // Reverb wet/dry mix
      const wetGain = this.audioCtx.createGain();
      wetGain.gain.setValueAtTime(0.28, this.audioCtx.currentTime);

      const dryGain = this.audioCtx.createGain();
      dryGain.gain.setValueAtTime(0.72, this.audioCtx.currentTime);

      this.reverbNode.connect(wetGain);
      wetGain.connect(this.masterGain);

      dryGain.connect(this.masterGain);

      // Limiter / compressor to prevent clipping
      const compressor = this.audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
      compressor.knee.setValueAtTime(8, this.audioCtx.currentTime);
      compressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      compressor.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Generates a warm, lush studio acoustic impulse response
   */
  private createStudioReverb(ctx: AudioContext): ConvolverNode {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 1.8; // 1.8 seconds decay
    const decay = 2.4;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Play a realistic warm piano tone using additive harmonic synthesis with dampening
   */
  playNote(midi: number, durationSeconds: number = 2.0, velocity: number = 0.8, isTopNote: boolean = false, delaySeconds: number = 0) {
    this.initContext();
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;

    const ctx = this.audioCtx;
    const startTime = ctx.currentTime + Math.max(0, delaySeconds);
    const baseFreq = midiToFrequency(midi);

    // Filter to simulate piano soundboard & hammer stiffness
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Higher velocity = brighter hammer strike
    const cutoff = Math.min(8000, baseFreq * (isTopNote ? 6.5 : 4.5) * (0.6 + velocity * 0.6));
    filter.frequency.setValueAtTime(cutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, baseFreq * 1.5), startTime + durationSeconds);

    const noteGain = ctx.createGain();
    const peakGain = (isTopNote ? 0.32 : 0.22) * velocity;

    // Piano attack and natural logarithmic decay
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008); // 8ms hammer transient
    // Decay stage
    noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.45, startTime + 0.3);
    // Release stage
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);

    // Multi-oscillator harmonic structure: Fundamental + 2nd harmonic + slight detune
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, startTime);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.001, startTime); // Subtle string unison stretch

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.28, startTime);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 0.999, startTime); // subtle detune
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.15, startTime);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);

    filter.connect(noteGain);
    noteGain.connect(this.masterGain);
    if (this.reverbNode) {
      noteGain.connect(this.reverbNode);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);

    osc1.stop(startTime + durationSeconds);
    osc2.stop(startTime + durationSeconds);
    osc3.stop(startTime + durationSeconds);
  }

  /**
   * Play an entire chord voicing with subtle upward strumming so top note shines
   */
  playVoicing(
    voicing: Voicing,
    options: {
      durationSeconds?: number;
      addBass?: boolean;
      octaveOffset?: number;
      strumMs?: number;
    } = {}
  ) {
    const {
      durationSeconds = 2.4,
      addBass = true,
      octaveOffset = 0,
      strumMs = 28, // Humanized slight roll
    } = options;

    let notes = voicing.midiNotes.map((n) => n + octaveOffset);

    // Deep bass note if requested
    if (addBass) {
      const bassMidi = (voicing.bassNoteMidi ?? notes[0] - 12) + octaveOffset;
      // Ensure bass note is deep (between 28 and 46)
      const adjustedBass = bassMidi > 46 ? bassMidi - 12 : bassMidi;
      notes = [adjustedBass, ...notes];
    }

    const totalNotes = notes.length;
    notes.forEach((midi, index) => {
      const isTop = index === totalNotes - 1;
      const isBass = index === 0 && addBass;
      // Strum upward with gentle delay
      const delay = (index * (strumMs / 1000));
      const velocity = isTop ? 0.95 : isBass ? 0.85 : 0.7 + (index / totalNotes) * 0.15;
      this.playNote(midi, durationSeconds, velocity, isTop, delay);
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.audioCtx.currentTime);
    }
  }

  isAudioMuted() {
    return this.isMuted;
  }
}

// Singleton audio engine instance
export const audioEngine = new HarmonyAudioEngine();
