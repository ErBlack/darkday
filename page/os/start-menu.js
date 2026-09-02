import { element } from './dom/element.js';
import { icon } from './dom/icon.js';

export class StartMenu {
    #button;
    #onSelect;

    constructor(parent, button, items, onSelect) {
        this.#button = button;
        this.#onSelect = onSelect;

        this.root = element('div', 'os-start-menu os-start-menu-closed', parent);
        this.#list(items, this.root);

        button.addEventListener('click', () => this.toggle());
        document.addEventListener('pointerdown', event => {
            if (!this.root.contains(event.target) && !button.contains(event.target)) this.close();
        }, true);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') this.close();
        });
    }

    #list(items, parent) {
        const list = element('div', 'os-start-menu-items', parent);

        for (const item of items) {
            if (!item) {
                element('div', 'os-start-separator', list);
                continue;
            }

            const holder = element('div', 'os-start-entry', list);
            const row = element('button', 'os-start-item', holder);
            row.type = 'button';
            if (item.icon) icon(item.icon, '', row);
            else element('span', 'os-start-blank', row);
            element('span', '', row).textContent = item.label;

            if (item.items) {
                const submenu = element('div', 'os-start-submenu', holder);

                row.classList.add('os-start-item-parent');
                this.#list(item.items, submenu);
                holder.addEventListener('pointerenter', () => {
                    const limit = this.root.getBoundingClientRect().bottom;
                    const top = holder.getBoundingClientRect().top - 3;

                    submenu.classList.toggle('os-start-submenu-up', top + submenu.offsetHeight > limit);
                });
                continue;
            }

            row.addEventListener('click', () => {
                this.close();
                this.#onSelect(item);
            });
        }
    }

    get opened() {
        return !this.root.classList.contains('os-start-menu-closed');
    }

    open() {
        this.root.classList.remove('os-start-menu-closed');
        this.#button.classList.add('os-start-pressed');
    }

    close() {
        this.root.classList.add('os-start-menu-closed');
        this.#button.classList.remove('os-start-pressed');
    }

    toggle() {
        if (this.opened) this.close();
        else this.open();
    }

    destroy() {
        this.close();
        this.root.remove();
    }
}
