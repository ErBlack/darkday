import { element } from './dom/element.js';
import { icon } from './dom/icon.js';

const CLOCK_MS = 10000;

export class Taskbar {
    #buttons = new Map();
    #tasks;
    #clock;
    #timer;

    constructor(root, onToggle) {
        this.root = root;
        this.onToggle = onToggle;

        this.start = element('button', 'os-start', root);
        this.start.type = 'button';
        icon('assets/os/icons/start.png', '', this.start);
        element('span', '', this.start).textContent = 'Start';

        this.#tasks = element('div', 'os-tasks', root);

        const tray = element('div', 'os-tray', root);
        this.#clock = element('span', 'os-clock', tray);

        this.#tick();
        this.#timer = setInterval(() => this.#tick(), CLOCK_MS);
    }

    destroy() {
        clearInterval(this.#timer);
    }

    #tick() {
        this.#clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    add(window) {
        const button = element('button', 'os-task', this.#tasks);
        button.type = 'button';
        icon(window.app.icon, '', button);
        element('span', 'os-task-text', button).textContent = window.title;
        button.addEventListener('click', () => this.onToggle(window));

        this.#buttons.set(window, button);
    }

    remove(window) {
        this.#buttons.get(window)?.remove();
        this.#buttons.delete(window);
    }

    rectOf(window) {
        return this.#buttons.get(window).getBoundingClientRect();
    }

    update(windows, focused) {
        for (const window of windows) {
            const button = this.#buttons.get(window);
            button.classList.toggle('os-task-active', window === focused);
            button.querySelector('.os-task-text').textContent = window.title;
        }
    }
}
