import { Sprite } from '../engine/layers/sprite.js';

export class Item {
    #state;

    constructor(id, image, state, renderer, { name, openable = false }) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.openable = openable;
        this.sprite = new Sprite(image);
        this.renderer = renderer;
        this.#state = state;
    }

    get place() {
        return this.#state.items[this.id];
    }

    set place(place) {
        this.#state.items[this.id] = place;
    }

    get rect() {
        return this.sprite.rect;
    }

    set rect(rect) {
        this.sprite.rect = { ...rect };
    }

    sizeFor(width) {
        return { w: width, h: (width * this.image.height) / this.image.width };
    }

    async animate(to, { place = 'flying', ...options } = {}) {
        const from = this.place;
        this.place = place;

        const motion = this.sprite.animate(to, options);
        this.renderer.invalidate();
        await motion;

        if (this.place === place) this.place = from;
    }

    flyTo(rect, { tint, ...options } = {}) {
        return this.animate({ ...rect, rotation: 0, squash: 1, ...(tint && { tint }) }, options);
    }
}
