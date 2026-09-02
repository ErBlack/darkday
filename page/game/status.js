const FADE_MS = 150;
const HOLD_MS = 1500;
const FONT = "500 96px 'Playwrite GB S'";
const HEIGHT = 48;
const MARGIN = 60;
const OPACITY = 0.85;
const PAD = 24;

const renderText = text => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = FONT;

    const metrics = ctx.measureText(text);
    canvas.width = Math.ceil(metrics.width) + PAD * 2;
    canvas.height = 144;

    ctx.font = FONT;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 14;
    ctx.fillText(text, PAD, canvas.height / 2);

    return canvas;
};

export class Status {
    #renderer;
    #texture = null;
    #phase = 'idle';
    #level = 0;
    #hold = 0;

    constructor(renderer) {
        this.#renderer = renderer;
    }

    show(text) {
        this.#texture = renderText(text);
        this.#hold = HOLD_MS;

        if (this.#phase === 'idle') this.#level = 0;
        if (this.#phase !== 'hold') this.#phase = 'in';

        this.#renderer.invalidate();
    }

    update(dt) {
        if (this.#phase === 'idle') return false;

        if (this.#phase === 'in') {
            this.#level = Math.min(1, this.#level + dt / FADE_MS);
            if (this.#level === 1) this.#phase = 'hold';
        } else if (this.#phase === 'hold') {
            this.#hold -= dt;
            if (this.#hold <= 0) this.#phase = 'out';
        } else {
            this.#level = Math.max(0, this.#level - dt / FADE_MS);
            if (this.#level === 0) this.#phase = 'idle';
        }

        return this.#phase !== 'idle';
    }

    draw(renderer) {
        if (this.#phase === 'idle' || !this.#texture) return;

        const { view } = renderer;
        const bottom = renderer.toRef(view.width / 2, view.height);
        const w = (this.#texture.width / this.#texture.height) * HEIGHT;

        renderer.drawImage(
            this.#texture,
            { x: bottom.x - w / 2, y: bottom.y - MARGIN - HEIGHT, w, h: HEIGHT },
            { alpha: this.#level * OPACITY },
        );
    }
}
