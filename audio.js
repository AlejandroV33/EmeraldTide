export const RetroAudio = {
    ctx: null,
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    play(type) {
        try {
            this.init();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(560, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.07);
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
                osc.start(now);
                osc.stop(now + 0.07);
            } else if (type === 'parry_swing') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
                gain.gain.setValueAtTime(0.11, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'parry_hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.setValueAtTime(920, now + 0.04);
                osc.frequency.exponentialRampToValueAtTime(1350, now + 0.22);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(170, now);
                osc.frequency.exponentialRampToValueAtTime(55, now + 0.11);
                gain.gain.setValueAtTime(0.13, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.11);
                osc.start(now);
                osc.stop(now + 0.11);
            } else if (type === 'shiny') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.setValueAtTime(880, now + 0.07);
                osc.frequency.setValueAtTime(1174.66, now + 0.14);
                gain.gain.setValueAtTime(0.11, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.32);
                osc.start(now);
                osc.stop(now + 0.32);
            } else if (type === 'powerup') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(330, now);
                osc.frequency.setValueAtTime(440, now + 0.06);
                osc.frequency.setValueAtTime(660, now + 0.13);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.26);
                osc.start(now);
                osc.stop(now + 0.26);
            }
        } catch (e) {}
    }
};