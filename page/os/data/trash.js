export class Trash {
    #state;
    #changes;

    constructor(state, changes) {
        this.#state = state;
        this.#changes = changes;
    }

    get items() {
        return this.#state.trash;
    }

    isDeleted(path) {
        return this.#state.deleted.includes(path);
    }

    remove(path, node) {
        this.#state.deleted.push(path);
        this.#state.trash.push({ path, name: node.name, icon: node.icon });
        this.#changed();
    }

    restore(path) {
        this.#state.deleted = this.#state.deleted.filter(entry => entry !== path);
        this.#state.trash = this.#state.trash.filter(entry => entry.path !== path);
        this.#changed();
    }

    purge(path) {
        this.#state.trash = this.#state.trash.filter(entry => entry.path !== path);
        this.#changed();
    }

    empty() {
        this.#state.trash = [];
        this.#changed();
    }

    #changed() {
        this.#changes.dispatchEvent(new Event('change'));
    }
}
