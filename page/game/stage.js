import { REF } from '../engine/ref.js';

const OPEN_RECT = { x: 956, y: 298, w: 1000, h: 1037 };
const SCREEN_RECT = { x: 0, y: 0, w: REF.width, h: REF.height };

const enabled = entry => entry.when?.() !== false;

export class Stage {
    #state;
    #inventory;
    #items;

    scene = null;

    constructor({ state, inventory, items }) {
        this.#state = state;
        this.#inventory = inventory;
        this.#items = items;

        if (this.openItem) this.openItem.rect = OPEN_RECT;
    }

    get openItem() {
        return Object.values(this.#items).find(item => item.place === 'open') ?? null;
    }

    async open(item) {
        if (item.place === 'held') {
            item.rect = this.#inventory.heldRect(item);
            this.#inventory.remove(item);
        } else {
            this.#inventory.found(item);
        }

        await item.flyTo(OPEN_RECT);
        item.place = 'open';
    }

    takeOpen() {
        return this.#inventory.take(this.openItem);
    }

    miss(item) {
        if (item.openable) this.open(item);
    }

    hotspots() {
        if (Object.values(this.#items).some(item => item.openable && item.sprite.busy)) return [];
        if (this.openItem) return [{ rect: SCREEN_RECT, action: () => this.takeOpen() }];

        const scene = this.scene;
        const inventory = this.#inventory;
        const held = inventory.held;
        const hotspots = inventory.hotspots();

        if (!scene) return hotspots;

        if (held) {
            for (const target of scene.targets) {
                if (!enabled(target)) continue;

                const use = target.use?.[held.id];

                if (use) hotspots.push({ rect: target.rect, action: () => use(held) });
                else if (target.blocked) hotspots.push({ rect: target.rect, action: () => target.blocked(held) });
            }

            return hotspots;
        }

        for (const entry of scene.items) {
            if (entry.fixed || entry.item.place !== this.#state.scene || entry.item.sprite.busy || !enabled(entry)) continue;

            hotspots.push({ rect: entry.rect ?? entry.item.rect, quiet: entry.quiet, action: entry.click ?? (() => inventory.pickUp(entry.item)) });
        }

        for (const target of scene.targets) {
            if (!enabled(target)) continue;

            const action = target.click ?? target.blocked;

            if (action) hotspots.push({ rect: target.rect, quiet: target.quiet, action: () => action() });
        }

        return hotspots;
    }

    update(dt) {
        let alive = false;

        for (const item of Object.values(this.#items)) {
            if (item.sprite.update(dt)) alive = true;
        }

        return alive;
    }

    draw(renderer) {
        const scene = this.scene;

        if (!scene) return;

        renderer.drawCover(scene.background);

        for (const patch of scene.patches) {
            if (enabled(patch)) renderer.drawImage(patch.image, patch.rect, { alpha: patch.alpha?.() ?? 1 });
        }

        for (const entry of scene.items) {
            if (entry.item.place === this.#state.scene && enabled(entry)) entry.item.sprite.draw(renderer);
        }

        for (const region of scene.foreground) {
            if (enabled(region)) renderer.drawRegion(scene.background, region.rect);
        }
    }

    overlay = {
        draw: renderer => {
            for (const item of Object.values(this.#items)) {
                if (item.place === 'flying') item.sprite.draw(renderer);
                if (item.place === 'incoming') item.sprite.draw(renderer, { alpha: 1 - item.sprite.progress });
            }

            this.openItem?.sprite.draw(renderer);
        },
    };
}
