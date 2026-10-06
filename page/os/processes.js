import { khaosProcess } from './khaos/khaos-process.js';

const DEFAULT_USAGE = { memory: [1800, 2800], cpu: [0, 2] };
const DRIFT = 0.15;

const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

const drift = (value, [lo, hi]) => {
    const step = (hi - lo) * DRIFT;

    return Math.min(hi, Math.max(lo, value + (Math.random() * 2 - 1) * step));
};

export class Processes {
    #windows;
    #state;
    #khaos;
    #usage = new Map();

    constructor(windows, state, khaos) {
        this.#windows = windows;
        this.#state = state;
        this.#khaos = khaos;
    }

    #usageOf(app) {
        const ranges = app.usage ?? DEFAULT_USAGE;

        if (!this.#usage.has(app.id)) this.#usage.set(app.id, { memory: between(ranges.memory), cpu: between(ranges.cpu) });

        return this.#usage.get(app.id);
    }

    get apps() {
        const apps = new Set(this.#windows.tasks.map(window => window.app));

        if (this.#khaos.processAlive) apps.add(khaosProcess);

        return [...apps].sort((a, b) => a.title.localeCompare(b.title));
    }

    list() {
        const apps = this.apps;
        const running = apps.map(app => app.id);

        for (const id of this.#usage.keys()) {
            if (!running.includes(id)) this.#usage.delete(id);
        }

        return apps.map(app => {
            const usage = this.#usageOf(app);

            return {
                app,
                memory: Math.round(usage.memory),
                cpu: Math.round(usage.cpu),
                responding: !this.#state.hung.includes(app.id) && !this.#khaos.hangs(app),
            };
        });
    }

    tick() {
        for (const app of this.apps) {
            const usage = this.#usageOf(app);
            const ranges = app.usage ?? DEFAULT_USAGE;
            usage.memory = drift(usage.memory, ranges.memory);
            usage.cpu = drift(usage.cpu, ranges.cpu);
        }
    }

    hang(app) {
        if (!this.#state.hung.includes(app.id)) this.#state.hung.push(app.id);
    }

    wake(app) {
        this.#state.hung = this.#state.hung.filter(id => id !== app.id);
    }

    kill(app) {
        if (app === khaosProcess) return this.#khaos.killProcess();

        for (const window of this.#windows.tasks.filter(window => window.app === app)) {
            this.#windows.close(window);
        }
    }
}
