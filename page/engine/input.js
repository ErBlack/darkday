const inRect = ({ x, y }, rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

export class Input {
    #renderer;
    #hotspots;
    #held;
    #miss;
    #release;

    enabled = false;

    constructor(renderer, { hotspots, held, miss, release }) {
        this.#renderer = renderer;
        this.#hotspots = hotspots;
        this.#held = held;
        this.#miss = miss;
        this.#release = release;

        renderer.canvas.addEventListener('pointerup', this.#onPointerUp);
        renderer.canvas.addEventListener('pointermove', this.#onPointerMove);
        renderer.canvas.addEventListener('contextmenu', this.#onContextMenu);
        addEventListener('keydown', this.#onKeyDown);
    }

    destroy() {
        removeEventListener('keydown', this.#onKeyDown);
    }

    get active() {
        return this.enabled ? this.#hotspots() : [];
    }

    #hit(event) {
        const point = this.#renderer.toRef(event.clientX, event.clientY);

        return this.active.find(hotspot => inRect(point, hotspot.rect)) ?? null;
    }

    #onContextMenu = event => {
        if (!this.enabled || !this.#held()) return;

        event.preventDefault();
        this.#release();
    };

    #onPointerUp = event => {
        if (!event.isPrimary || !this.enabled || event.button !== 0) return;

        const hotspot = this.#hit(event);
        const held = this.#held();

        if (hotspot) hotspot.action();
        else if (held) this.#miss(held);
    };

    #onKeyDown = event => {
        if (!this.enabled || event.repeat || event.altKey || event.ctrlKey || event.metaKey || !/^[1-9]$/.test(event.key)) return;
        if (event.target.closest?.('input, textarea, [contenteditable]')) return;

        const slot = Number(event.key) - 1;
        const find = () => this.active.find(hotspot => hotspot.slot === slot);
        const target = find();

        if (!target) return;

        if (this.#held() && this.#held() !== target.item) this.#release();

        find()?.action();
        this.#renderer.canvas.style.cursor = this.#held() ? 'none' : '';
    };

    #onPointerMove = event => {
        const canvas = this.#renderer.canvas;

        if (this.#held()) return (canvas.style.cursor = 'none');

        const hotspot = this.#hit(event);

        canvas.style.cursor = hotspot && !hotspot.quiet ? 'pointer' : '';
    };
}
