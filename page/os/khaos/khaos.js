import './khaos.css';
import { sha256 } from './sha256.js';
import { khaosAttack } from './khaos-attack.js';
import { khaosSolved } from './khaos-solved.js';
import { playGlitch } from './play-glitch.js';
import { coverFrames } from './cover-frames.js';
import { element } from '../dom/element.js';
import { personal } from '../data/personal.js';
import { loadSound } from '../../engine/audio/load-sound.js';
import { loadVideo } from '../../engine/load-video.js';

const PASSWORD = 'e39764959eb8b3435ca67436cf8ea66a19f00bdd94cd94b0b76e85075125f158';
const BROWSER = 'browser';
const MAX_SCALE = 2;

const loadCapturer = () => import('modern-screenshot');

const OVERLAYS = ['khaos-shield', 'khaos-glitch'];

const foreign = node => node instanceof HTMLImageElement && new URL(node.src, location.href).origin !== location.origin;

const captured = node => !OVERLAYS.some(name => node.classList?.contains(name)) && !foreign(node);

const swallow = event => {
    event.preventDefault();
    event.stopPropagation();
};

export class Khaos {
    #state;
    #windows;
    #root;
    #capturer = null;

    onSolved = null;

    constructor(state, windows, root) {
        this.#state = state;
        this.#windows = windows;
        this.#root = root;

        if (state.khaos === 'armed' || state.khaos === 'active') this.#preload();
    }

    #preload() {
        this.#capturer = loadCapturer();

        if (khaosAttack.voice) loadSound(khaosAttack.voice.src).catch(() => {});

        for (const url of [...khaosAttack.sounds.short, ...khaosAttack.sounds.long]) loadSound(url).catch(() => {});
        if (khaosAttack.video) loadVideo(khaosAttack.video.src).catch(() => {});
    }

    get active() {
        return this.#state.khaos === 'active';
    }

    get processAlive() {
        return this.active && this.#state.khaosProcess;
    }

    arm() {
        if (this.#state.khaos !== 'idle') return;

        this.#state.khaos = 'armed';
        this.#preload();
    }

    async #shielded(run, fallback) {
        const shield = element('div', 'khaos-shield', this.#root);

        document.addEventListener('keydown', swallow, true);

        try {
            const { domToCanvas } = await (this.#capturer ??= loadCapturer());
            const scale = Math.min(MAX_SCALE, devicePixelRatio);
            const capture = () => domToCanvas(this.#root, { scale, filter: captured });

            await run(capture, domToCanvas, scale);
        } catch {
            fallback?.();
        } finally {
            document.removeEventListener('keydown', swallow, true);
            shield.remove();
        }
    }

    attack(hang) {
        return this.#shielded(async (capture, domToCanvas, scale) => {
            const covers = await coverFrames(this.#root, domToCanvas, scale);
            const image = await capture();

            for (const cover of covers) cover.remove();

            hang();
            await playGlitch(this.#root, image, capture(), khaosAttack, personal);
        }, hang);
    }

    #aftershock() {
        return this.#shielded(async capture => {
            const image = await capture();

            for (const window of this.#windows.tasks.filter(task => task.app.id === BROWSER)) this.#windows.close(window);

            await playGlitch(this.#root, image, capture(), khaosSolved);
        });
    }

    trigger() {
        if (this.#state.khaos !== 'armed') return false;

        this.#state.khaos = 'active';
        this.#state.khaosProcess = true;

        return true;
    }

    hangs(app) {
        return this.active && app.id === BROWSER;
    }

    killProcess() {
        this.#state.khaosProcess = false;
        this.check();
    }

    check() {
        if (!this.active || this.#state.khaosProcess) return;
        if (this.#windows.tasks.some(window => window.app.id === BROWSER)) return;

        this.#state.khaos = 'defeated';
    }

    async solve(password) {
        if (await sha256(password) !== PASSWORD) return false;

        this.#state.khaos = 'solved';
        await this.#aftershock();
        this.onSolved?.(password);

        return true;
    }
}
