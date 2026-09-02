import { element } from './dom/element.js';
import { icon } from './dom/icon.js';
import { onContext } from './context/on-context.js';

const srcOf = (item, shell) => (typeof item.icon === 'function' ? item.icon(shell) : item.icon);

export class DesktopIcons {
    #shell;
    #images = new Map();

    constructor(parent, items, shell, onOpen, onMenu) {
        this.root = element('div', 'os-icons', parent);
        this.#shell = shell;

        for (const item of items) {
            const entry = element('div', 'os-icon', this.root);
            this.#images.set(item, icon(srcOf(item, shell), '', entry));
            element('span', '', entry).textContent = item.label;

            entry.addEventListener('click', () => this.#select(entry));
            entry.addEventListener('dblclick', () => onOpen(item));
            onContext(entry, event => {
                this.#select(entry);
                onMenu(item, event);
            });
        }

        parent.addEventListener('pointerdown', event => {
            if (!this.root.contains(event.target)) this.#select(null);
        });
    }

    refresh() {
        for (const [item, image] of this.#images) image.src = srcOf(item, this.#shell);
    }

    #select(target) {
        for (const entry of this.root.children) entry.classList.toggle('os-icon-selected', entry === target);
    }
}
