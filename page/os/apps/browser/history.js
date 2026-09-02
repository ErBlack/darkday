import { storyHistory } from '../../data/story-history.js';

const LIMIT = 20;

export class History {
    #state;

    constructor(state) {
        this.#state = state;
    }

    get entries() {
        return [...storyHistory, ...this.#state.history];
    }

    visit(url, title) {
        if (url.startsWith('about:')) return;
        if (this.#state.history.at(-1)?.url === url) return;

        this.#state.history.push({ time: new Date().toISOString(), url, title });

        while (this.#state.history.length > LIMIT) this.#state.history.shift();
    }
}
