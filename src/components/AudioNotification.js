// Audio notification utility using Web Audio API (no external MP3 needed)
export const playQueueChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Standard hospital chime chord (Ding - Dong - Ding)
    playTone(523.25, 0, 0.4);      // C5
    playTone(659.25, 0.25, 0.4);   // E5
    playTone(783.99, 0.5, 0.7);    // G5
  } catch (err) {
    console.warn("Audio notification not supported or blocked by autoplay policy", err);
  }
};
