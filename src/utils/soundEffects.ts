// src/utils/soundEffects.ts
// ระบบเสียงประกอบเว็บ: เล่นเพลงลอยกระทงเวอร์ชันเปียโน (/loy-krathong-piano.mp3) คู่กับเสียงสายน้ำไหล
// พร้อมระบบสังเคราะห์เสียงเปียโนคอร์ดประสานด้วย Web Audio API เป็นตัวสำรองเมื่อใช้งานออฟไลน์

interface PianoStep {
  freq: number;
  dur: number;
  delay: number;
  chord?: number[];
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private melodyTimer: number | null = null;
  private waterGainNode: GainNode | null = null;
  private waterSourceNode: AudioBufferSourceNode | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private mp3Failed: boolean = false;
  private noteIndex: number = 0;

  // โน้ตทำนองเพลงลอยกระทงพร้อมคอร์ดประสานมือซ้าย (ใช้สำรองเมื่อโหลด MP3 ไม่ได้)
  private readonly loyKrathongMelody: PianoStep[] = [
    // วรรค 1: วันเพ็ญเดือนสิบสอง น้ำนองเต็มตลิ่ง
    { freq: 392.00, dur: 0.55, delay: 440, chord: [130.81, 196.00, 261.63] }, // C major
    { freq: 392.00, dur: 0.50, delay: 440 },
    { freq: 440.00, dur: 0.65, delay: 500 },
    { freq: 392.00, dur: 0.50, delay: 440 },
    { freq: 329.63, dur: 1.05, delay: 860, chord: [164.81, 196.00, 261.63] },
    { freq: 261.63, dur: 0.50, delay: 440, chord: [174.61, 220.00] }, // F
    { freq: 293.66, dur: 0.50, delay: 440 },
    { freq: 329.63, dur: 0.55, delay: 460 },
    { freq: 392.00, dur: 0.50, delay: 440, chord: [130.81, 196.00] },
    { freq: 329.63, dur: 1.15, delay: 960 },

    // วรรค 2: เราทั้งหลายชายหญิง สนุกกันจริงวันลอยกระทง
    { freq: 293.66, dur: 0.50, delay: 440, chord: [196.00, 246.94] }, // G
    { freq: 329.63, dur: 0.50, delay: 440 },
    { freq: 392.00, dur: 0.60, delay: 500 },
    { freq: 329.63, dur: 0.50, delay: 440 },
    { freq: 261.63, dur: 1.00, delay: 820, chord: [130.81, 164.81, 196.00] }, // C
    { freq: 293.66, dur: 0.45, delay: 400 },
    { freq: 329.63, dur: 0.50, delay: 440 },
    { freq: 392.00, dur: 0.50, delay: 440, chord: [110.00, 164.81, 220.00] }, // Am
    { freq: 440.00, dur: 0.65, delay: 520 },
    { freq: 392.00, dur: 0.45, delay: 400, chord: [196.00, 246.94] }, // G
    { freq: 329.63, dur: 0.50, delay: 440 },
    { freq: 293.66, dur: 0.50, delay: 440 },
    { freq: 261.63, dur: 1.35, delay: 1120, chord: [130.81, 164.81, 196.00] }, // C

    // วรรค 3: ลอย ลอยกระทง ลอย ลอยกระทง
    { freq: 392.00, dur: 0.75, delay: 640, chord: [130.81, 196.00, 261.63] },
    { freq: 329.63, dur: 0.45, delay: 400 },
    { freq: 392.00, dur: 0.45, delay: 400 },
    { freq: 440.00, dur: 0.95, delay: 840, chord: [174.61, 220.00, 261.63] }, // F
    { freq: 392.00, dur: 0.75, delay: 640, chord: [130.81, 196.00] },
    { freq: 329.63, dur: 0.45, delay: 400 },
    { freq: 392.00, dur: 0.45, delay: 400 },
    { freq: 440.00, dur: 1.05, delay: 940, chord: [174.61, 220.00] },

    // วรรค 4: บุญจะส่งให้เราสุขใจ
    { freq: 523.25, dur: 0.60, delay: 480, chord: [130.81, 196.00, 261.63] },
    { freq: 440.00, dur: 0.45, delay: 400 },
    { freq: 392.00, dur: 0.55, delay: 480 },
    { freq: 329.63, dur: 0.50, delay: 440, chord: [110.00, 164.81] },
    { freq: 392.00, dur: 0.55, delay: 480, chord: [196.00, 246.94] },
    { freq: 293.66, dur: 0.55, delay: 480 },
    { freq: 261.63, dur: 1.50, delay: 1420, chord: [130.81, 164.81, 196.00, 261.63] }
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureBgmAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.bgmAudio) {
      const audio = new Audio('/loy-krathong-piano.mp3');
      audio.loop = true;
      audio.volume = 0.6;
      audio.preload = 'none';
      audio.addEventListener('error', () => {
        if (!this.isMuted && !this.mp3Failed) {
          this.mp3Failed = true;
          this.scheduleNextMelodyNote();
        }
      });
      this.bgmAudio = audio;
    }
    return this.bgmAudio;
  }

  public isAudioEnabled(): boolean {
    return !this.isMuted;
  }

  public toggleAudio(): boolean {
    if (this.isMuted) {
      this.startAmbientAudio();
    } else {
      this.stopAmbientAudio();
    }
    return !this.isMuted;
  }

  public startAmbientAudio(): void {
    this.isMuted = false;
    const ctx = this.ensureContext();
    if (ctx) {
      this.startWaterStream(ctx);
    }

    const audio = this.ensureBgmAudio();
    if (audio && !this.mp3Failed) {
      audio.play().catch(() => {
        if (!this.isMuted) {
          this.mp3Failed = true;
          this.scheduleNextMelodyNote();
        }
      });
      return;
    }

    if (ctx) {
      this.scheduleNextMelodyNote();
    }
  }

  public stopAmbientAudio(): void {
    this.isMuted = true;
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
      } catch {}
    }
    if (this.melodyTimer !== null) {
      window.clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (this.waterSourceNode) {
      try {
        this.waterSourceNode.stop();
        this.waterSourceNode.disconnect();
      } catch {}
      this.waterSourceNode = null;
    }
    if (this.waterGainNode) {
      try {
        this.waterGainNode.disconnect();
      } catch {}
      this.waterGainNode = null;
    }
  }

  // สร้างเสียงคลื่นน้ำไหลเบาๆ ผ่อนคลาย
  private startWaterStream(ctx: AudioContext): void {
    if (this.waterSourceNode) return;
    try {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.15;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.value = 0.028;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      this.waterSourceNode = noise;
      this.waterGainNode = gain;
    } catch {}
  }

  // สังเคราะห์เสียงเปียโนอะคูสติกแบบนุ่มนวล (ตัวสำรองเมื่อใช้งานออฟไลน์)
  private playPianoNote(freq: number, duration: number, volume = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      const oscFundamental = ctx.createOscillator();
      oscFundamental.type = 'triangle';
      oscFundamental.frequency.setValueAtTime(freq, now);

      const oscWarmth = ctx.createOscillator();
      oscWarmth.type = 'sine';
      oscWarmth.frequency.setValueAtTime(freq * 2, now);

      const oscPresence = ctx.createOscillator();
      oscPresence.type = 'sine';
      oscPresence.frequency.setValueAtTime(freq * 3, now);

      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(Math.min(4800, freq * 6), now);
      lpFilter.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.8), now + duration * 1.1);

      const gainFund = ctx.createGain();
      gainFund.gain.setValueAtTime(0.0008, now);
      gainFund.gain.linearRampToValueAtTime(volume, now + 0.012);
      gainFund.gain.exponentialRampToValueAtTime(volume * 0.35, now + duration * 0.45);
      gainFund.gain.exponentialRampToValueAtTime(0.0005, now + duration * 1.5);

      const gainHarm = ctx.createGain();
      gainHarm.gain.setValueAtTime(0.0005, now);
      gainHarm.gain.linearRampToValueAtTime(volume * 0.28, now + 0.01);
      gainHarm.gain.exponentialRampToValueAtTime(0.0004, now + duration * 0.7);

      const gainThird = ctx.createGain();
      gainThird.gain.setValueAtTime(0.0003, now);
      gainThird.gain.linearRampToValueAtTime(volume * 0.1, now + 0.008);
      gainThird.gain.exponentialRampToValueAtTime(0.0003, now + duration * 0.35);

      oscFundamental.connect(gainFund);
      oscWarmth.connect(gainHarm);
      oscPresence.connect(gainThird);
      gainFund.connect(lpFilter);
      gainHarm.connect(lpFilter);
      gainThird.connect(lpFilter);
      lpFilter.connect(ctx.destination);

      oscFundamental.start(now);
      oscWarmth.start(now);
      oscPresence.start(now);
      oscFundamental.stop(now + duration * 1.55);
      oscWarmth.stop(now + duration * 0.75);
      oscPresence.stop(now + duration * 0.4);
    } catch {}
  }

  private scheduleNextMelodyNote(): void {
    if (this.isMuted) return;
    if (this.melodyTimer !== null) {
      window.clearTimeout(this.melodyTimer);
    }
    const current = this.loyKrathongMelody[this.noteIndex];
    this.playPianoNote(current.freq, current.dur, 0.08);
    if (current.chord) {
      current.chord.forEach((chordFreq, idx) => {
        this.playPianoNote(chordFreq, current.dur * 1.5, 0.032 - idx * 0.004);
      });
    }

    this.noteIndex = (this.noteIndex + 1) % this.loyKrathongMelody.length;
    this.melodyTimer = window.setTimeout(() => {
      this.scheduleNextMelodyNote();
    }, current.delay);
  }

  // เสียงระฆังมงคลและละอองน้ำเมื่อกดปล่อยกระทงสำเร็จ (ทำงานเสมอเมื่อผู้ใช้กดปุ่มปล่อยกระทง)
  public playFloatSuccessChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.15);
      });
    } catch {}
  }

  // เสียงพลุดอกไม้ไฟแตกตัวเบาๆ บนท้องฟ้า (เล่นเฉพาะเมื่อเปิดเสียงบรรยากาศไว้)
  public playFireworkSparkle(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }
}

export const soundManager = new SoundManager();
