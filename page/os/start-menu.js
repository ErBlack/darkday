import { element } from './dom/element.js';
import { icon } from './dom/icon.js';

const itemsOf = list => [...list.children].map(holder => holder.firstChild).filter(row => row?.matches?.('.os-start-item'));

export class StartMenu {
    #button;
    #onSelect;

    constructor(parent, button, items, onSelect) {
        this.#button = button;
        this.#onSelect = onSelect;

        this.root = element('div', 'os-start-menu os-start-menu-closed', parent);
        this.#list(items, this.root);
        this.root.addEventListener('keydown', this.#onMenuKey);

        button.addEventListener('click', this.#onToggle);
        document.addEventListener('pointerdown', this.#onPointerDown, true);
        document.addEventListener('keydown', this.#onKey);
    }

    #onToggle = () => this.toggle();

    #onPointerDown = event => {
        if (!this.root.contains(event.target) && !this.#button.contains(event.target)) this.close();
    };

    #onKey = event => {
        if (event.key !== 'Escape' || !this.opened) return;

        const focused = this.root.contains(document.activeElement);

        this.close();
        if (focused) this.#button.focus();
    };

    #onMenuKey = event => {
        const row = event.target.closest('.os-start-item');

        if (!row) return;

        const list = row.closest('.os-start-menu-items');
        const rows = itemsOf(list);
        const index = rows.indexOf(row);
        const submenu = row.nextElementSibling;
        const parentRow = list.parentElement.classList.contains('os-start-submenu') ? list.parentElement.previousElementSibling : null;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const step = event.key === 'ArrowDown' ? 1 : -1;
            rows[(index + step + rows.length) % rows.length].focus();
        } else if (event.key === 'Home' || event.key === 'End') {
            rows.at(event.key === 'Home' ? 0 : -1).focus();
        } else if (event.key === 'ArrowRight' && submenu) {
            this.#openSubmenu(row, true);
        } else if ((event.key === 'ArrowLeft' || event.key === 'Escape') && parentRow) {
            this.#closeSubmenu(parentRow);
            parentRow.focus();
        } else {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    };

    #openSubmenu(row, focus) {
        const holder = row.parentElement;
        const submenu = row.nextElementSibling;
        const limit = this.root.getBoundingClientRect().bottom;
        const top = holder.getBoundingClientRect().top - 3;

        holder.classList.add('os-start-entry-open');
        row.setAttribute('aria-expanded', 'true');
        submenu.classList.toggle('os-start-submenu-up', top + submenu.offsetHeight > limit);
        if (focus) itemsOf(submenu.firstChild)[0]?.focus();
    }

    #closeSubmenu(row) {
        row.parentElement.classList.remove('os-start-entry-open');
        row.setAttribute('aria-expanded', 'false');
    }

    #list(items, parent) {
        const list = element('div', 'os-start-menu-items', parent);
        list.setAttribute('role', 'menu');

        for (const item of items) {
            if (!item) {
                element('div', 'os-start-separator', list).setAttribute('role', 'separator');
                continue;
            }

            const holder = element('div', 'os-start-entry', list);
            const row = element('button', 'os-start-item', holder);
            row.type = 'button';
            row.tabIndex = -1;
            holder.setAttribute('role', 'none');
            row.setAttribute('role', 'menuitem');
            if (item.icon) icon(item.icon, '', row);
            else element('span', 'os-start-blank', row);
            element('span', '', row).textContent = item.label;

            if (item.items) {
                const submenu = element('div', 'os-start-submenu', holder);

                row.classList.add('os-start-item-parent');
                row.setAttribute('aria-haspopup', 'menu');
                row.setAttribute('aria-expanded', 'false');
                this.#list(item.items, submenu);
                holder.addEventListener('pointerenter', () => this.#openSubmenu(row, false));
                holder.addEventListener('pointerleave', () => this.#closeSubmenu(row));
                row.addEventListener('click', () => this.#openSubmenu(row, true));
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
        this.#button.setAttribute('aria-expanded', 'true');
        itemsOf(this.root.firstChild)[0]?.focus();
    }

    close() {
        this.root.classList.add('os-start-menu-closed');
        this.#button.classList.remove('os-start-pressed');
        this.#button.setAttribute('aria-expanded', 'false');

        for (const row of this.root.querySelectorAll('.os-start-item-parent')) this.#closeSubmenu(row);
    }

    toggle() {
        if (this.opened) this.close();
        else this.open();
    }

    destroy() {
        this.close();
        this.#button.removeEventListener('click', this.#onToggle);
        document.removeEventListener('pointerdown', this.#onPointerDown, true);
        document.removeEventListener('keydown', this.#onKey);
        this.root.remove();
    }
}
