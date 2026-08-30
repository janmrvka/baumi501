"use client";

// Short victory fanfare synthesized with the Web Audio API — no audio file needed.
export function playFanfare() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 }, // C5
      { freq: 659.25, start: 0.15, duration: 0.15 }, // E5
      { freq: 783.99, start: 0.3, duration: 0.15 }, // G5
      { freq: 1046.5, start: 0.45, duration: 0.4 }, // C6
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;

      const t0 = now + start;
      const t1 = t0 + duration;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t1);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.05);
    });

    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Web Audio unavailable — silently skip the fanfare.
  }
}
