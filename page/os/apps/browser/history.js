const LIMIT = 20;

export class History {
    #state;
    #user;

    constructor(state, user) {
        this.#state = state;
        this.#user = user;
    }

    get #visits() {
        return (this.#state.histories[this.#user.name] ??= []);
    }

    get entries() {
        return [...(this.#user.history ?? []), ...this.#visits];
    }

    visit(url, title) {
        if (url.startsWith('about:')) return;
        if (this.#visits.at(-1)?.url === url) return;

        this.#visits.push({ time: new Date().toISOString(), url, title });

        while (this.#visits.length > LIMIT) this.#visits.shift();
    }
}
