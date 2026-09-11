const FADE_MS = 300;

export class Background {
    constructor(image) {
        this.image = image;
    }

    draw(renderer) {
        renderer.drawCover(this.image);
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
        if (!this.#offset) return {};

        const { from, to } = this.#offset;
        const { currentTime, duration } = this.#video;
        const t = duration ? Math.min(1, currentTime / duration) : 0;

        return { dx: from.dx + (to.dx - from.dx) * t, dy: from.dy + (to.dy - from.dy) * t };
    }

    draw(renderer) {
        if (this.#alpha <= 0 || this.#video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

        renderer.drawCover(this.#video, { ...this.#currentOffset(), alpha: this.#alpha });
    }
}

export class Debug {
    constructor(getHotspots) {
        this.getHotspots = getHotspots;
    }

    draw(renderer) {
        for (const { rect } of this.getHotspots()) {
            renderer.fillRect(rect, [1, 0, 0, 0.15]);
            renderer.strokeRect(rect, [1, 0, 0, 0.8], 4);
        }
    }
}
