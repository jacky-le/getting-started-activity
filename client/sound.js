class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // Master volume
        this.enabled = false;
        this.lastShootTime = 0;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.enabled = true;
    }

    playTone(freq, type, duration, volume = 1, slideTo = null) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume = 1) {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Lowpass filter for explosion punch
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    // --- SFX ---

    shoot(type = 'pea') {
        const now = Date.now();
        if (now - this.lastShootTime < 80) return; // Debounce
        this.lastShootTime = now;

        if (type === 'heavy') {
            this.playTone(150, 'square', 0.1, 0.8, 50);
            this.playNoise(0.1, 0.5);
        } else if (type === 'sniper') {
            this.playTone(800, 'triangle', 0.3, 0.8, 100);
            this.playNoise(0.2, 0.5);
        } else if (type === 'shotgun') {
            this.playNoise(0.15, 0.7);
            this.playTone(200, 'sawtooth', 0.1, 0.6, 50);
        } else {
            // Default pew
            this.playTone(400 + Math.random() * 200, 'square', 0.1, 0.3, 200);
        }
    }

    hit() {
        this.playTone(200, 'sawtooth', 0.1, 0.4, 50);
    }

    explosion(size = 1) {
        const duration = 0.3 + (size / 100) * 0.5;
        
        // Noise layer (crunch)
        this.playNoise(duration, 0.8);
        
        // Sub-bass drop layer (impact)
        if (this.enabled) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        }
    }

    powerup() {
        this.playTone(440, 'sine', 0.1, 0.5);
        setTimeout(() => this.playTone(554, 'sine', 0.1, 0.5), 100);
        setTimeout(() => this.playTone(659, 'sine', 0.2, 0.5), 200);
    }

    warning() {
        this.playTone(800, 'square', 0.1, 0.5);
        setTimeout(() => this.playTone(0, 'square', 0.1, 0), 100);
        setTimeout(() => this.playTone(800, 'square', 0.1, 0.5), 200);
    }

    ability(name) {
        switch(name) {
            case 'BLINK': this.playTone(600, 'sine', 0.2, 0.6, 1200); break;
            case 'SLAM': this.playNoise(0.4, 1.0); this.playTone(100, 'square', 0.4, 0.8, 10); break;
            case 'HEAL': this.powerup(); break;
            case 'RAGE': this.playTone(100, 'sawtooth', 1.0, 0.8, 300); break;
            default: this.playTone(400, 'sine', 0.3, 0.5, 800); break;
        }
    }
}

export default SoundManager;

