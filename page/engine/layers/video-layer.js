const FADE_MS = 10;

export class VideoLayer {
    #video;
    #rate;
    #time = 0;
    #alpha = 0;
    #swapped = false;
    #done = false;
    #resolve;
    #onSwap;

    promise;

    constructor(video, { onSwap, rate = 1 } = {}) {
        this.#video = video;
        this.#onSwap = onSwap;
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

    draw(renderer) {
        if (this.#alpha <= 0 || this.#video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

        renderer.drawCover(this.#video, { alpha: this.#alpha });
    }
}
