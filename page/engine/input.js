const inRect = ({ x, y }, rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

export class Input {
    #renderer;
    #hotspots = [];

    enabled = false;

    constructor(renderer) {
        this.#renderer = renderer;

        const canvas = renderer.canvas;

        canvas.addEventListener('pointerup', this.#onPointerUp);
        canvas.addEventListener('pointermove', this.#onPointerMove);
    }

    get hotspots() {
        return this.#hotspots;
    }

    setHotspots(hotspots) {
        this.#hotspots = hotspots;
        this.#renderer.invalidate();
    }

    #hit(event) {
        if (!this.enabled) return null;

        const point = this.#renderer.toRef(event.clientX, event.clientY);

        return this.#hotspots.find(({ rect }) => inRect(point, rect)) ?? null;
    }

    #onPointerUp = event => {
        if (!event.isPrimary) return;

        const hotspot = this.#hit(event);

        if (hotspot) hotspot.action(hotspot);
    };

    #onPointerMove = event => {
        this.#renderer.canvas.style.cursor = this.#hit(event) ? 'pointer' : '';
    };
}
