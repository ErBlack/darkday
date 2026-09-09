import { drawCover } from './renderer.js';

const FADE_MS = 300;

export class Background {
    constructor(image) {
        this.image = image;
    }

    draw(ctx) {
        drawCover(ctx, this.image);
    }
}

export class VideoLayer {
    #video;
    #offset;
    #rate;
    #time = 0;
    #alpha = 0;
    #swapped = false;
    #done = false;
    #resolve;
    #onSwap;

    promise;

    constructor(video, { onSwap, rate = 1, offset } = {}) {
        this.#video = video;
        this.#onSwap = onSwap;
        this.#offset = offset;
        this.#rate = rate;
        this.promise = new Promise(resolve => (this.#resolve = resolve));

        video.pause();
        video.currentTime = 0;
        video.playbackRate = rate;
        video.addEventListener('ended', this.#finish, { once: true });
        video.play().catch(() => this.#finish());
    }

    #swap() {
        if (this.#swapped) return;

        this.#swapped = true;
        this.#onSwap?.();
    }

    #finish = () => {
        if (this.#done) return;

        this.#swap();
        this.#done = true;
        this.#resolve();
    };

    #remainingMs() {
        const { currentTime, duration } = this.#video;

        return duration ? ((duration - currentTime) / this.#rate) * 1000 : Infinity;
    }

    update(dt) {
        if (this.#done) return false;

        this.#time += dt;

        const remaining = this.#remainingMs();

        if (remaining <= FADE_MS) this.#swap();

        this.#alpha = Math.min(1, this.#time / FADE_MS, Math.max(0, remaining / FADE_MS));

        return true;
    }

    #currentOffset() {
        if (!this.#offset) return undefined;

        const { from, to } = this.#offset;
        const { currentTime, duration } = this.#video;
        const t = duration ? Math.min(1, currentTime / duration) : 0;

        return { dx: from.dx + (to.dx - from.dx) * t, dy: from.dy + (to.dy - from.dy) * t };
    }

    draw(ctx) {
        if (this.#alpha <= 0 || this.#video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

        ctx.globalAlpha = this.#alpha;
        drawCover(ctx, this.#video, this.#currentOffset());
        ctx.globalAlpha = 1;
    }
}

export class Debug {
    constructor(getHotspots) {
        this.getHotspots = getHotspots;
    }

    draw(ctx) {
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';

        for (const { rect } of this.getHotspots()) {
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }

        ctx.restore();
    }
}
