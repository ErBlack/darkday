export class Trash {
    #state;
    #changes;

    constructor(state, changes) {
        this.#state = state;
        this.#changes = changes;
    }

    get items() {
        return this.#state.deleted.filter(entry => !entry.purged);
    }

    isDeleted(path) {
        return this.#state.deleted.some(entry => entry.path === path);
    }

    remove(path, node) {
        this.#state.deleted.push({ path, name: node.name, icon: node.icon, purged: false });
        this.#changed();
    }

    restore(path) {
        this.#state.deleted = this.#state.deleted.filter(entry => entry.path !== path);
        this.#changed();
    }

    purge(path) {
        for (const entry of this.#state.deleted) {
            if (entry.path === path) entry.purged = true;
        }

        this.#changed();
    }

    empty() {
        for (const entry of this.#state.deleted) entry.purged = true;

        this.#changed();
    }

    #changed() {
        this.#changes.dispatchEvent(new Event('change'));
    }
}
