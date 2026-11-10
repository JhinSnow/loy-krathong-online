// src/utils/soundEffects.ts
// ระบบสังเคราะห์เสียงดนตรีไทยบรรเลงเพลงลอยกระทง (Khim / Music Box) และเสียงสายน้ำไหลด้วย Web Audio API
// ทำงานได้ 100% บนเบราว์เซอร์โดยไม่ต้องพึ่งไฟล์ MP3 ภายนอก ไม่ติดลิขสิทธิ์ และรองรับระบบ LAN / Offline

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private melodyTimer: number | null = null;
  private waterGainNode: GainNode | null = null;
  private waterSourceNode: AudioBufferSourceNode | null = null;
  private noteIndex: number = 0;

  // โน้ตทำนองเพลงลอยกระทง (คีย์ C Pentatonic: C D E G A) จังหวะนุ่มนวลสไตล์ขิม/กล่องดนตรี
  private readonly loyKrathongMelody: { freq: number; dur: number; delay: number }[] = [
    // วรรค 1: วันเพ็ญเดือนสิบสอง น้ำนองเต็มตลิ่ง
    { freq: 392.00, dur: 0.45, delay: 420 }, // G4 (วัน)
    { freq: 392.00, dur: 0.45, delay: 420 }, // G4 (เพ็ญ)
    { freq: 440.00, dur: 0.55, delay: 480 }, // A4 (เดือน)
    { freq: 392.00, dur: 0.45, delay: 420 }, // G4 (สิบ)
    { freq: 329.63, dur: 0.90, delay: 850 }, // E4 (สอง)
    { freq: 261.63, dur: 0.45, delay: 420 }, // C4 (น้ำ)
    { freq: 293.66, dur: 0.45, delay: 420 }, // D4 (นอง)
    { freq: 329.63, dur: 0.50, delay: 450 }, // E4 (เต็ม)
    { freq: 392.00, dur: 0.45, delay: 420 }, // G4 (ตะ)
    { freq: 329.63, dur: 0.95, delay: 950 }, // E4 (ลิ่ง)

    // วรรค 2: เราทั้งหลายชายหญิง สนุกกันจริงวันลอยกระทง
    { freq: 293.66, dur: 0.45, delay: 420 }, // D4 (เรา)
    { freq: 329.63, dur: 0.45, delay: 420 }, // E4 (ทั้ง)
    { freq: 392.00, dur: 0.55, delay: 480 }, // G4 (หลาย)
    { freq: 329.63, dur: 0.45, delay: 420 }, // E4 (ชาย)
    { freq: 261.63, dur: 0.85, delay: 800 }, // C4 (หญิง)
    { freq: 293.66, dur: 0.40, delay: 380 }, // D4 (สะ)
    { freq: 329.63, dur: 0.45, delay: 420 }, // E4 (นุก)
    { freq: 392.00, dur: 0.45, delay: 420 }, // G4 (กัน)
    { freq: 440.00, dur: 0.55, delay: 500 }, // A4 (จริง)
    { freq: 392.00, dur: 0.40, delay: 380 }, // G4 (วัน)
    { freq: 329.63, dur: 0.45, delay: 420 }, // E4 (ลอย)
    { freq: 293.66, dur: 0.45, delay: 420 }, // D4 (กระ)
    { freq: 261.63, dur: 1.10, delay: 1100 }, // C4 (ทง)

    // วรรค 3: ลอย ลอยกระทง ลอย ลอยกระทง
    { freq: 392.00, dur: 0.65, delay: 620 }, // G4 (ลอย)
    { freq: 329.63, dur: 0.40, delay: 380 }, // E4 (ลอย)
    { freq: 392.00, dur: 0.40, delay: 380 }, // G4 (กระ)
    { freq: 440.00, dur: 0.85, delay: 820 }, // A4 (ทง)
    { freq: 392.00, dur: 0.65, delay: 620 }, // G4 (ลอย)
    { freq: 329.63, dur: 0.40, delay: 380 }, // E4 (ลอย)
    { freq: 392.00, dur: 0.40, delay: 380 }, // G4 (กระ)
    { freq: 440.00, dur: 0.95, delay: 920 }, // A4 (ทง)

    // วรรค 4: บุญจะส่งให้เราสุขใจ
    { freq: 523.25, dur: 0.50, delay: 460 }, // C5 (บุญ)
    { freq: 440.00, dur: 0.40, delay: 380 }, // A4 (จะ)
    { freq: 392.00, dur: 0.50, delay: 460 }, // G4 (ส่ง)
    { freq: 329.63, dur: 0.45, delay: 420 }, // E4 (ให้)
    { freq: 392.00, dur: 0.50, delay: 460 }, // G4 (เรา)
    { freq: 293.66, dur: 0.50, delay: 460 }, // D4 (สุข)
    { freq: 261.63, dur: 1.30, delay: 1400 }  // C4 (ใจ)
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
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
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isMuted = false;
    this.startWaterStream(ctx);
    this.scheduleNextMelodyNote();
  }

  public stopAmbientAudio(): void {
    this.isMuted = true;
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
      gain.gain.value = 0.035;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      this.waterSourceNode = noise;
      this.waterGainNode = gain;
    } catch {}
  }

  // เล่นโน้ตดนตรีไทย (เสียงขิม/ระฆังแก้ว)
  private playKhimNote(freq: number, duration: number, volume = 0.075): void {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      // Fundamental Tone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Harmonic Overtone (เพิ่มประกายเสียงขิม/กล่องดนตรี)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now);

      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(volume, now + 0.025);
      gain1.gain.exponentialRampToValueAtTime(0.0008, now + duration * 1.4);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(volume * 0.25, now + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0005, now + duration * 0.65);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration * 1.45);
      osc2.stop(now + duration * 0.7);
    } catch {}
  }

  private scheduleNextMelodyNote(): void {
    if (this.isMuted) return;
    const current = this.loyKrathongMelody[this.noteIndex];
    this.playKhimNote(current.freq, current.dur, 0.065);

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
