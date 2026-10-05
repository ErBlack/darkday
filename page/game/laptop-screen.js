import './laptop-screen.css';
import { Desktop } from '../os/desktop.js';
import { element } from '../os/dom/element.js';
import { REF } from '../engine/ref.js';
import { easeInOut } from '../engine/ease/ease-in-out.js';
import { runBios } from './boot/bios-screen.js';
import { playSystemSound } from '../os/audio/play-system-sound.js';
import { muffleSystem } from '../os/audio/muffle-system.js';
import { audioContext } from '../engine/audio/audio-context.js';

const SCREEN = { x: 1007, y: 217, w: 1003, h: 754 };
const PANEL = [{ x: 1011, y: 217 }, { x: 2001, y: 217 }, { x: 2010, y: 971 }, { x: 1007, y: 971 }];
const FULL = { x: 0, y: 0, w: REF.width, h: REF.height };
const RATIO = SCREEN.h / SCREEN.w;
const EXPAND_MS = 1100;
const FADE_MS = 500;
const BACKLIGHT_MS = 1200;
const BLACK_MS = 700;
const SHUTDOWN_MS = 1800;
const LED_OFF_MS = 100;
const LED_BLINK = [[0.9, 160], [0.35, 220], [0.8, 180], [0.45, 300], [1, 400]];
const GLASS = 0.55;
const SHUTDOWN_SOUND = 'assets/sounds/shutdown.mp3';
const FAN_SOUND = 'assets/sounds/fan.mp3';
const FAN_VOLUME = 0.4;
const FAN_SPIN_UP_MS = 2500;
const FAN_TAIL_MS = 1500;
const FAN_SPIN_DOWN_MS = 2500;
const FAN_IDLE_RATE = 0.3;

const lerp = (from, to, t) => from + (to - from) * t;
const lerpRect = (from, to, t) => ({
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    w: lerp(from.w, to.w, t),
    h: lerp(from.h, to.h, t),
});
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export class LaptopScreen {
    #renderer;
    #state;
    #input;
    #achievements;
    #host;
    #desktop = null;
    #progress;
    #tween = null;
    #visible = false;
    #glow = null;
    #fan = null;
    #ledTimer = null;

    led = 0;
    busy = false;
    onEnding = null;
    onEndingStart = null;

    constructor(renderer, state, input, achievements) {
        this.#renderer = renderer;
        this.#state = state;
        this.#input = input;
        this.#achievements = achievements;
        this.#host = element('div', 'laptop-screen laptop-screen-hidden', document.body);
        element('div', 'laptop-backlight', this.#host);
        element('div', 'laptop-glass', this.#host);
        this.#progress = state.flags.laptopExpanded ? 1 : 0;
        this.led = state.flags.laptopOn ? 1 : 0;

        if (state.flags.laptopOn) {
            this.#boot();
            this.#startFan(false);
        }

        this.#host.classList.toggle('laptop-screen-full', state.flags.laptopExpanded);
        addEventListener('resize', this.#onResize);
        this.#apply();
    }

    #onResize = () => this.#apply();

    destroy() {
        removeEventListener('resize', this.#onResize);
        clearTimeout(this.#ledTimer);
        this.#stopFan();
        this.#desktop?.destroy();
        this.#desktop = null;
        this.#host.remove();
    }

    get expanded() {
        return this.#state.flags.laptopExpanded;
    }

    get zooming() {
        return this.#tween !== null;
    }

    show(visible) {
        this.#visible = visible;
        this.#update();
    }

    async powerOn() {
        const { flags } = this.#state;

        if (flags.laptopOn) return;

        flags.laptopOn = true;
        this.busy = true;
        this.#startFan();
        this.#blink();
        this.#host.classList.add('laptop-screen-off');
        this.#update();
        this.#host.getBoundingClientRect();
        this.#host.classList.add('laptop-screen-fading');
        this.#host.classList.remove('laptop-screen-off');
        await wait(BACKLIGHT_MS);
        this.#host.classList.remove('laptop-screen-fading');

        const bios = await runBios(this.#host, flags);

        bios.replaceChildren();
        await wait(BLACK_MS);
        this.#boot();
        bios.remove();
        this.busy = false;
    }

    #startFan(spinUp = true) {
        const volume = spinUp ? { volume: 0, fadeTo: FAN_VOLUME, fadeMs: FAN_SPIN_UP_MS } : { volume: FAN_VOLUME };

        this.#fan = playSystemSound(FAN_SOUND, { ...volume, loop: true }).catch(() => null);

        if (!spinUp) return;

        this.#fan.then(sound => {
            if (!sound) return;

            const at = audioContext().currentTime;

            sound.source.playbackRate.setValueAtTime(FAN_IDLE_RATE, at);
            sound.source.playbackRate.setTargetAtTime(1, at, FAN_SPIN_UP_MS / 1000 / 3);
        });
    }

    #stopFan(delay = 0, spinDown = 0) {
        this.#fan?.then(sound => {
            if (!sound) return;

            const at = audioContext().currentTime + delay / 1000;
            const duration = spinDown / 1000;

            sound.source.playbackRate.setTargetAtTime(FAN_IDLE_RATE, at, duration / 3);
            sound.gain.gain.setTargetAtTime(0, at, duration / 4);
            sound.source.stop(at + duration);
        });
        this.#fan = null;
    }

    async #blink() {
        for (const [level, ms] of LED_BLINK) await this.#light(level, ms);
    }

    expand() {
        return this.#run(1);
    }

    get element() {
        return this.#host;
    }

    vault(name) {
        return this.#desktop?.shell.vaults[name] ?? null;
    }

    devicesChanged() {
        this.#desktop?.shell.changes.dispatchEvent(new Event('change'));
    }

    showArticle(url) {
        this.#desktop?.showArticle(url);
    }

    collapse() {
        return this.#run(0);
    }

    #update() {
        this.#host.classList.toggle('laptop-screen-hidden', !this.#visible || !this.#state.flags.laptopOn);
    }

    #boot() {
        this.#desktop = new Desktop(this.#state, this.#host, this.#achievements);
        this.#desktop.onShutDown = () => this.#shutDown();
        this.#desktop.onStandBy = () => this.collapse();
        this.#desktop.onTurnOff = () => this.#shutDown();
        this.#desktop.onEnding = kind => this.onEnding?.(kind);
        this.#desktop.onEndingStart = () => this.onEndingStart?.();
    }


    async #shutDown() {
        this.busy = true;
        playSystemSound(SHUTDOWN_SOUND, { volume: 0.6 }).catch(() => {});

        const shutdown = element('div', 'laptop-shutdown', this.#host);
        element('span', '', shutdown).textContent = 'Windows is shutting down...';

        const collapsing = this.#state.flags.laptopExpanded ? this.collapse() : Promise.resolve();

        await wait(SHUTDOWN_MS);
        shutdown.classList.add('laptop-shutdown-black');
        this.#desktop.destroy();
        this.#desktop = null;
        await wait(BLACK_MS);
        this.#host.classList.add('laptop-screen-fading', 'laptop-screen-off');
        this.#stopFan(FAN_TAIL_MS, FAN_SPIN_DOWN_MS);
        this.#ledTimer = setTimeout(() => {
            if (!this.#state.flags.laptopOn) this.#light(0, LED_OFF_MS);
        }, FAN_TAIL_MS);
        await wait(FADE_MS);
        await collapsing;
        shutdown.remove();
        this.#host.classList.remove('laptop-screen-fading', 'laptop-screen-off');
        this.#state.flags.laptopOn = false;
        this.#state.os.windows = [];
        this.#state.os.hung = [];
        this.#state.os.user = null;
        this.#state.os.keys = {};
        this.#state.os.started = false;
        this.#state.os.usage = {};
        delete this.#state.os.apps.browser;

        if (this.#state.os.apps.civis) this.#state.os.apps.civis.session = false;
        this.#update();
        this.busy = false;
        this.#input.enabled = true;
    }

    #light(to, duration) {
        const from = this.led;
        const start = performance.now();

        return new Promise(resolve => {
            const step = now => {
                if (this.#glow !== step) return resolve();

                const t = Math.min(1, (now - start) / duration);

                this.led = lerp(from, to, easeInOut(t));
                this.#renderer.invalidate();

                if (t < 1) return requestAnimationFrame(step);

                this.#glow = null;
                resolve();
            };

            this.#glow = step;
            requestAnimationFrame(step);
        });
    }

    #run(to) {
        if (this.#tween) return this.#tween.promise;

        this.#input.enabled = false;
        this.#host.classList.remove('laptop-screen-full');
        this.#host.classList.add('laptop-screen-zooming');

        const promise = new Promise(resolve => {
            this.#tween = { from: this.#progress, to, time: 0, resolve };
        });
        this.#tween.promise = promise;
        this.#renderer.invalidate();

        return promise;
    }

    update(dt) {
        const tween = this.#tween;

        if (!tween) return false;

        tween.time += dt;

        const t = Math.min(1, tween.time / EXPAND_MS);

        this.#progress = lerp(tween.from, tween.to, easeInOut(t));
        this.#apply();

        if (t < 1) return true;

        this.#tween = null;
        this.#state.flags.laptopExpanded = tween.to === 1;
        this.#host.classList.toggle('laptop-screen-full', tween.to === 1);
        this.#host.classList.remove('laptop-screen-zooming');
        this.#input.enabled = tween.to === 0;
        tween.resolve();

        return false;
    }

    #target() {
        const { width, height } = this.#renderer.view;
        const scale = Math.max(width / SCREEN.w, height / SCREEN.h);
        const w = width / scale;
        const h = height / scale;

        return { x: SCREEN.x, y: SCREEN.y, w, h };
    }

    #camera(p) {
        return lerpRect(FULL, this.#target(), p);
    }

    #quad(camera) {
        const { width, height } = this.#renderer.view;
        const scale = Math.max(width / camera.w, height / camera.h);

        return {
            x: width / 2 + (SCREEN.x - camera.x - camera.w / 2) * scale,
            y: height / 2 + (SCREEN.y - camera.y - camera.h / 2) * scale,
            w: SCREEN.w * scale,
            h: SCREEN.h * scale,
        };
    }

    #apply() {
        const { width, height } = this.#renderer.view;
        const camera = this.#camera(this.#progress);

        this.#renderer.setCamera(camera);
        this.#host.style.setProperty('--glass', GLASS * (1 - this.#progress));
        muffleSystem(1 - this.#progress);

        if (this.#progress === 1) {
            this.#host.style.removeProperty('width');
            this.#host.style.removeProperty('height');
            this.#host.style.removeProperty('transform');
            this.#host.style.removeProperty('clip-path');
            this.#host.style.inset = '0';

            return;
        }

        const quad = this.#quad(camera);
        const scale = quad.w / Math.max(width, height / RATIO);
        const x = Math.max(0, quad.x);
        const y = Math.max(0, quad.y);
        const visible = {
            w: Math.min(quad.x + quad.w, width) - x,
            h: Math.min(quad.y + quad.h, height) - y,
        };

        this.#host.style.removeProperty('inset');
        this.#host.style.width = `${visible.w / scale}px`;
        this.#host.style.height = `${visible.h / scale}px`;
        this.#host.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

        const ref = quad.w / SCREEN.w;
        const points = PANEL.map(point => {
            const px = (quad.x + (point.x - SCREEN.x) * ref - x) / scale;
            const py = (quad.y + (point.y - SCREEN.y) * ref - y) / scale;

            return `${px}px ${py}px`;
        });

        this.#host.style.clipPath = `polygon(${points.join(', ')})`;
    }
}
