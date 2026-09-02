import { connectMedia } from './audio/connect-media.js';

const SEEK_SOUND = 'assets/sounds/floppy-seek.mp3';
const MUSIC = 'assets/sounds/floppy-doom.mp3';
const ATTEMPTS = 3;

const play = (url, volume) => {
    const audio = new Audio(url);
    audio.volume = volume;

    return connectMedia(audio);
};

export class FloppyDrive {
    #attempts = 0;
    #seeking = false;
    #music = null;

    get playing() {
        return Boolean(this.#music);
    }

    async access() {
        if (this.#seeking) return null;

        this.#attempts += 1;

        if (this.#attempts > ATTEMPTS) {
            this.#music = play(MUSIC, 0.5);
            this.#music.addEventListener('ended', () => this.stop());
            this.#music.play().catch(() => {});

            return 'music';
        }

        this.#seeking = true;

        const seek = play(SEEK_SOUND, 0.7);

        await new Promise(resolve => {
            seek.addEventListener('ended', resolve);
            seek.addEventListener('error', resolve);
            seek.play().catch(resolve);
        });

        this.#seeking = false;

        return 'error';
    }

    toggle() {
        if (!this.#music) return;

        if (this.#music.paused) this.#music.play().catch(() => {});
        else this.#music.pause();
    }

    stop() {
        this.#music?.pause();
        this.#music = null;
        this.#attempts = 0;
    }
}
