import { easeInOut } from '../ease/ease-in-out.js';

const mix = (from, to, t) => (Array.isArray(from) ? from.map((value, i) => value + (to[i] - value) * t) : from + (to - from) * t);

export class Sprite {
    #tween = null;

    alpha = 1;
    tint = [1, 1, 1];
    rotation = 0;
    squash = 1;
    edge = null;

    constructor(source, rect = { x: 0, y: 0, w: 0, h: 0 }) {
        this.source = source;
        this.rect = { ...rect };
    }

    get progress() {
        return this.#tween ? this.#tween.progress : 1;
    }

    get busy() {
        return Boolean(this.#tween);
    }

    get state() {
        return { ...this.rect, rotation: this.rotation, squash: this.squash, tint: this.tint };
    }

    set state({ rotation, squash, tint, ...rect }) {
        Object.assign(this.rect, rect);

        if (rotation !== undefined) this.rotation = rotation;
        if (squash !== undefined) this.squash = squash;
        if (tint !== undefined) this.tint = tint;
    }

    animate(to, { duration = 600, ease = easeInOut } = {}) {
        this.#tween?.resolve();

        return new Promise(resolve => {
            const from = this.state;
            this.#tween = { from, to: { ...from, ...to }, duration, ease, time: 0, progress: 0, resolve };
        });
    }

    update(dt) {
        const tween = this.#tween;

        if (!tween) return false;

        tween.time += dt;
        tween.progress = tween.ease(Math.min(1, tween.time / tween.duration));

        const state = {};

        for (const key in tween.to) {
            state[key] = mix(tween.from[key], tween.to[key], tween.progress);
        }

        this.state = state;

        if (tween.time >= tween.duration) {
            this.#tween = null;
            tween.resolve();
            return false;
        }

        return true;
    }

    draw(renderer, { alpha = this.alpha, tint = this.tint } = {}) {
        renderer.drawImage(this.source, this.rect, {
            alpha,
            tint,
            rotation: this.rotation,
            squash: this.squash,
            edge: this.edge,
        });
    }
}
