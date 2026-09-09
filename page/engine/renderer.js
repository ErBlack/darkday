const REF = { width: 2912, height: 1632 };
const MAX_DPR = 2;

export class Renderer {
    #canvas;
    #ctx;
    #layers = [];
    #frame = null;
    #last = 0;

    view = { dpr: 1, scale: 1, x: 0, y: 0 };

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');

        addEventListener('resize', () => this.resize());
        this.resize();
    }

    get canvas() {
        return this.#canvas;
    }

    resize() {
        const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
        const width = innerWidth;
        const height = innerHeight;

        this.#canvas.width = Math.round(width * dpr);
        this.#canvas.height = Math.round(height * dpr);
        this.#canvas.style.width = `${width}px`;
        this.#canvas.style.height = `${height}px`;

        const scale = Math.max(width / REF.width, height / REF.height);

        this.view = {
            dpr,
            scale,
            x: (width - REF.width * scale) / 2,
            y: (height - REF.height * scale) / 2,
        };

        this.invalidate();
    }

    toRef(clientX, clientY) {
        return {
            x: (clientX - this.view.x) / this.view.scale,
            y: (clientY - this.view.y) / this.view.scale,
        };
    }

    setLayers(layers) {
        this.#layers = [...layers];
        this.invalidate();
    }

    invalidate() {
        if (this.#frame === null) {
            this.#last = performance.now();
            this.#frame = requestAnimationFrame(this.#tick);
        }
    }

    #tick = now => {
        this.#frame = null;

        const dt = Math.min(now - this.#last, 100);
        this.#last = now;

        let alive = false;

        for (const layer of this.#layers) {
            if (layer.update?.(dt)) alive = true;
        }

        this.#draw();

        if (alive) this.#frame = requestAnimationFrame(this.#tick);
    };

    #draw() {
        const ctx = this.#ctx;
        const { dpr, scale, x, y } = this.view;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        ctx.setTransform(scale * dpr, 0, 0, scale * dpr, x * dpr, y * dpr);

        for (const layer of this.#layers) layer.draw(ctx);
    }
}

const sourceSize = source => ({
    width: source.videoWidth || source.naturalWidth,
    height: source.videoHeight || source.naturalHeight,
});

export const drawCover = (ctx, source, { dx = 0, dy = 0 } = {}) => {
    const { width, height } = sourceSize(source);

    if (!width || !height) return;

    const ratio = REF.width / REF.height;
    let sw = width;
    let sh = height;

    if (width / height > ratio) sw = height * ratio;
    else sh = width / ratio;

    ctx.drawImage(source, (width - sw) / 2, (height - sh) / 2, sw, sh, dx, dy, REF.width, REF.height);
};
