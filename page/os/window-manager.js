import { OsWindow } from './window.js';
import { clampToArea } from './geometry/clamp-to-area.js';
import { cascade } from './geometry/cascade.js';
import { center } from './geometry/center.js';
import { nudge } from './geometry/nudge.js';
import { playSystemSound } from './audio/play-system-sound.js';

const DEFAULT_SIZE = { w: 640, h: 440 };
const ANIMATION_MS = 180;
const MINIMIZE_SOUND = 'assets/sounds/minimize.mp3';
const RESTORE_SOUND = 'assets/sounds/restore.mp3';

const rootOf = window => (window.parent ? rootOf(window.parent) : window);

export class WindowManager {
    #container;
    #taskbar;
    #state;
    #shell;
    #windows = [];

    area = { w: 0, h: 0 };

    constructor(container, taskbar, state, shell) {
        this.#container = container;
        this.#taskbar = taskbar;
        this.#state = state;
        this.#shell = shell;
    }

    get windows() {
        return this.#windows;
    }

    get tasks() {
        return this.#windows.filter(window => !window.parent);
    }

    get focused() {
        return this.#windows.findLast(window => !window.minimized) ?? null;
    }

    #rectOf(window) {
        if (window.maximized) return { x: 0, y: 0, ...this.area };
        if (window.app.dialog) window.measure();

        return clampToArea(window.user, this.area, window.min);
    }

    #taskRect(window) {
        const button = this.#taskbar.rectOf(rootOf(window));
        const area = this.#container.getBoundingClientRect();

        return { x: button.left - area.left, y: button.top - area.top, w: button.width, h: button.height };
    }

    #place(window, parent) {
        const area = { x: 0, y: 0, ...this.area };
        const taken = this.#windows.filter(other => other !== window && !other.minimized).map(other => other.user);

        if (parent) return center(window.user, this.#rectOf(parent));
        if (window.app.dialog) return nudge(center(window.user, area), area, taken);

        return cascade(window.app.size ?? DEFAULT_SIZE, area, taken);
    }

    open(app, parent = null) {
        const existing = app.single && this.tasks.find(window => window.app === app);

        if (existing) {
            this.focus(existing);

            return existing;
        }

        const window = new OsWindow(this, app, parent);

        this.#windows.push(window);
        this.#container.append(window.root);

        if (parent) parent.modal = window;
        else this.#taskbar.add(window);

        if (!app.dialog) window.user = this.#place(window, parent);

        window.mount(this.#shell);

        if (app.dialog) {
            window.measure();
            window.user = this.#place(window, parent);
        }
        this.focus(window);
        window.activate();

        return window;
    }

    close(window) {
        if (!this.#windows.includes(window)) return;
        if (window.modal) this.close(window.modal);

        this.#windows = this.#windows.filter(other => other !== window);
        window.root.remove();
        window.closed = true;

        const { parent } = window;

        if (parent?.modal === window) parent.modal = null;

        window.onClose?.();

        if (parent) {
            if (!parent.modal) {
                this.focus(parent);
                parent.activate();
            }

            return;
        }

        this.#taskbar.remove(window);
        this.layout();
    }

    focus(window) {
        if (window.modal) return this.focus(window.modal);

        const chain = [];

        for (let current = window; current; current = current.parent) chain.unshift(current);

        const restoring = chain.some(current => current.minimized);

        if (restoring) {
            playSystemSound(RESTORE_SOUND, { volume: 0.6 }).catch(() => {});

            for (const current of chain) {
                current.minimized = false;
                current.root.classList.remove('os-window-minimized');
            }

            window.setGeometry(this.#taskRect(window), 0);
            window.root.getBoundingClientRect();
        }

        this.#windows = [...this.#windows.filter(other => !chain.includes(other)), ...chain];

        if (restoring) window.animate(() => this.layout());
        else this.layout();
    }

    minimize(window) {
        if (window.locked) return;

        playSystemSound(MINIMIZE_SOUND, { volume: 0.6 }).catch(() => {});
        window.animate(() => window.setGeometry(this.#taskRect(window), 0));

        setTimeout(() => {
            for (const other of this.#windows) {
                if (rootOf(other) === window) other.minimized = true;
            }

            this.layout();
        }, ANIMATION_MS);
    }

    toggleMaximize(window) {
        if (window.locked) return;

        window.animate(() => {
            window.maximized = !window.maximized;
            this.focus(window);
        });
    }

    toggle(window) {
        if (window.minimized) this.focus(window);
        else if (this.focused && rootOf(this.focused) === window) this.minimize(window);
        else this.focus(window);
    }

    move(window, rect) {
        window.user = clampToArea(rect, this.area, window.min);
        this.layout();
    }

    resize(area) {
        this.area = area;
        this.layout();
    }

    layout() {
        const focused = this.focused;
        const active = focused && rootOf(focused);

        this.#windows.forEach((window, z) => {
            window.apply(this.#rectOf(window), { focused: window === focused, z: z + 1 });
        });

        this.#taskbar.update(this.tasks, active);
        this.#state.windows = this.tasks.map(window => ({
            app: window.app.id,
            rect: { ...window.user },
            maximized: window.maximized,
            minimized: window.minimized,
            memory: window.memory,
        }));
    }
}
