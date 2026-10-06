import { WINDOW_MIN } from './geometry/window-min.js';
import { element } from './dom/element.js';
import { icon } from './dom/icon.js';

const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const ANIMATION_MS = 180;

const titleButton = (name, parent) => {
    const node = element('button', `os-button os-button-${name}`, parent);
    node.type = 'button';
    node.dataset.action = name;

    return node;
};

export class OsWindow {
    #manager;
    #animation = null;
    #focused = null;
    #active = false;

    user = { x: 0, y: 0, w: 0, h: 0 };
    min = WINDOW_MIN;
    maximized = false;
    minimized = false;
    parent = null;
    modal = null;
    closed = false;
    locked = false;
    memory = null;
    onClose = null;
    onFocus = null;
    onBlur = null;

    constructor(manager, app, parent = null) {
        this.#manager = manager;
        this.app = app;
        this.parent = parent;
        this.title = app.title;

        this.root = element('div', 'os-window');
        this.root.tabIndex = -1;
        this.root.classList.toggle('os-window-dialog', Boolean(app.dialog));

        const title = element('div', 'os-title', this.root);
        if (app.icon) icon(app.icon, 'os-title-icon', title);
        this.titleText = element('span', 'os-title-text', title);
        this.titleText.textContent = app.title;

        const buttons = element('div', 'os-title-buttons', title);

        if (!app.dialog) {
            titleButton('minimize', buttons);
            this.maximizeButton = titleButton('maximize', buttons);
        }

        titleButton('close', buttons);

        this.content = element('div', 'os-content', this.root);

        if (!app.dialog) {
            for (const side of HANDLES) element('div', `os-resize os-resize-${side}`, this.root).dataset.side = side;
        }

        this.root.addEventListener('pointerdown', () => manager.focus(this), true);
        this.root.addEventListener('focusin', event => {
            this.#focused = event.target === this.root ? null : event.target;
        });
        title.addEventListener('pointerdown', this.#onTitleDown);
        title.addEventListener('dblclick', event => {
            if (!app.dialog && !event.target.closest('.os-button')) manager.toggleMaximize(this);
        });
        buttons.addEventListener('click', event => {
            if (this.locked) return;

            const action = event.target.closest('.os-button')?.dataset.action;

            if (action === 'minimize') manager.minimize(this);
            if (action === 'maximize') manager.toggleMaximize(this);
            if (action === 'close') manager.close(this);
        });
        this.root.addEventListener('pointerdown', this.#onResizeDown);
        this.root.addEventListener('keydown', event => {
            if (app.dialog && event.key === 'Escape') manager.close(this);
        });
    }

    get active() {
        return this.#active;
    }

    mount(shell) {
        this.app.mount?.(this.content, this, shell);
    }

    activate() {
        if (this.modal) return this.modal.activate();

        const target = this.root.contains(this.#focused) ? this.#focused : this.root;

        if (!this.root.contains(document.activeElement)) target.focus();
    }

    close() {
        this.#manager.close(this);
    }

    open(app) {
        return this.#manager.open(app, this);
    }

    setTitle(text) {
        this.title = text;
        this.titleText.textContent = text;
        this.#manager.layout();
    }

    measure() {
        this.root.style.width = '';
        this.root.style.height = '';
        this.min = { w: this.root.offsetWidth, h: this.root.offsetHeight };
        this.user = { ...this.user, ...this.min };
    }

    setGeometry(rect, opacity = 1) {
        this.root.style.left = `${rect.x}px`;
        this.root.style.top = `${rect.y}px`;
        this.root.style.width = `${rect.w}px`;
        this.root.style.height = `${rect.h}px`;
        this.root.style.opacity = opacity;
    }

    animate(run) {
        clearTimeout(this.#animation);
        this.root.classList.add('os-window-animating');
        run();
        this.#animation = setTimeout(() => this.root.classList.remove('os-window-animating'), ANIMATION_MS);
    }

    apply(rect, { focused, z }) {
        this.setGeometry(rect);

        if (this.app.dialog) {
            this.root.style.width = '';
            this.root.style.height = '';
        }

        this.root.style.zIndex = z;
        this.root.classList.toggle('os-window-focused', focused);
        this.root.classList.toggle('os-window-maximized', this.maximized);
        this.root.classList.toggle('os-window-minimized', this.minimized);
        this.root.classList.toggle('os-window-disabled', Boolean(this.modal));
        this.maximizeButton?.classList.toggle('os-button-restore', this.maximized);

        if (focused !== this.#active) {
            this.#active = focused;
            (focused ? this.onFocus : this.onBlur)?.();
        }
    }

    #drag(event, onMove) {
        const target = event.currentTarget;
        const start = { x: event.clientX, y: event.clientY, rect: { ...this.user } };

        const move = e => onMove(e.clientX - start.x, e.clientY - start.y, start.rect);
        const stop = () => {
            target.removeEventListener('pointermove', move);
            target.removeEventListener('pointerup', stop);
            target.removeEventListener('pointercancel', stop);
        };

        target.setPointerCapture(event.pointerId);
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', stop);
        target.addEventListener('pointercancel', stop);
        event.preventDefault();
    }

    #onTitleDown = event => {
        if (event.button !== 0 || this.maximized || this.locked || event.target.closest('.os-button')) return;

        this.#drag(event, (dx, dy, rect) => {
            this.#manager.move(this, { ...rect, x: rect.x + dx, y: rect.y + dy });
        });
    };

    #onResizeDown = event => {
        const side = event.target.dataset.side;

        if (!side || event.button !== 0 || this.maximized || this.locked) return;

        this.#drag(event, (dx, dy, rect) => {
            let { x, y, w, h } = rect;

            if (side.includes('e')) w = Math.max(this.min.w, rect.w + dx);
            if (side.includes('s')) h = Math.max(this.min.h, rect.h + dy);

            if (side.includes('w')) {
                w = Math.max(this.min.w, rect.w - dx);
                x = rect.x + rect.w - w;
            }

            if (side.includes('n')) {
                h = Math.max(this.min.h, rect.h - dy);
                y = rect.y + rect.h - h;
            }

            this.#manager.move(this, { x, y, w, h });
        });
    };
}
