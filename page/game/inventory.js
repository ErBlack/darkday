const CELL = 130;
const GAP = 14;
const MARGIN = 28;
const ITEM_SCALE = 0.7;
const HELD_SCALE = 0.8;
const CELL_PAD = CELL * 0.08;
const CELL_ALPHA = 0.12;

const radialTexture = () => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return canvas;
};

export class Inventory {
    #renderer;
    #state;
    #items;
    #status;
    #cell = radialTexture();

    pointer = { x: 0, y: 0 };

    constructor({ renderer, state, items, status }) {
        this.#renderer = renderer;
        this.#state = state;
        this.#items = items;
        this.#status = status;
    }

    get held() {
        return this.#list.find(item => item.place === 'held') ?? null;
    }

    get #list() {
        return this.#state.inventory.map(id => this.#items[id]);
    }

    #cellRect(index) {
        const corner = this.#renderer.toRef(this.#renderer.view.width, 0);

        return { x: corner.x - MARGIN - CELL, y: corner.y + MARGIN + index * (CELL + GAP), w: CELL, h: CELL };
    }

    #itemRect(index, item) {
        const cell = this.#cellRect(index);
        const { w, h } = item.sizeFor(CELL * ITEM_SCALE);

        return { x: cell.x + (CELL - w) / 2, y: cell.y + (CELL - h) / 2, w, h };
    }

    heldRect(item, point = this.pointer) {
        const { w, h } = item.sizeFor(CELL * HELD_SCALE);

        return { x: point.x - w / 2, y: point.y - h / 2, w, h };
    }

    found(item) {
        this.#status.show(`${item.name} found`);
    }

    pickUp(item) {
        this.found(item);

        return this.take(item);
    }

    async take(item) {
        const index = this.#state.inventory.push(item.id) - 1;

        await item.flyTo(this.#itemRect(index, item), { place: 'incoming' });

        item.place = 'inventory';
        item.sprite.tint = [1, 1, 1];
        this.#renderer.invalidate();
    }

    pick(item) {
        item.place = 'held';
        this.#renderer.invalidate();
    }

    putBack() {
        const held = this.held;

        if (!held) return;

        held.place = 'inventory';
        this.#renderer.invalidate();
    }

    remove(item) {
        this.#state.inventory = this.#state.inventory.filter(id => id !== item.id);
        item.place = 'gone';
        this.#renderer.invalidate();
    }

    hotspots() {
        return this.#list.flatMap((item, index) =>
            item.place === 'incoming'
                ? []
                : {
                      rect: this.#cellRect(index),
                      action: () => {
                          if (!this.held) this.pick(item);
                          else if (this.held === item) this.putBack();
                      },
                  },
        );
    }

    draw(renderer) {
        this.#list.forEach((item, index) => {
            const incoming = item.place === 'incoming';
            const progress = incoming ? item.sprite.progress : 1;
            const cell = this.#cellRect(index);

            renderer.drawImage(
                this.#cell,
                { x: cell.x - CELL_PAD, y: cell.y - CELL_PAD, w: cell.w + CELL_PAD * 2, h: cell.h + CELL_PAD * 2 },
                { alpha: CELL_ALPHA * progress },
            );

            if (incoming) {
                item.sprite.draw(renderer, { alpha: progress, tint: [1, 1, 1] });
            } else if (item.place === 'held') {
                renderer.drawImage(item.image, this.heldRect(item));
            } else {
                item.rect = this.#itemRect(index, item);
                item.sprite.draw(renderer);
            }
        });
    }
}
