import './context-menu.css';
import { element } from '../dom/element.js';

let current = null;
let opener = null;

const close = () => {
    const focused = current?.contains(document.activeElement);

    current?.remove();
    current = null;
    if (focused) opener?.focus();
    opener = null;
};

const onKey = event => {
    const rows = [...current.querySelectorAll('.os-context-item:not(:disabled)')];
    const index = rows.indexOf(document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        rows[(index + step + rows.length) % rows.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
        rows.at(event.key === 'Home' ? 0 : -1)?.focus();
    } else if (event.key === 'Tab') {
        close();
        return;
    } else {
        return;
    }

    event.preventDefault();
};

addEventListener('pointerdown', event => {
    if (current && !current.contains(event.target)) close();
}, true);
addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
});
addEventListener('blur', close);

export const showContextMenu = (container, x, y, items) => {
    close();

    const active = container.contains(document.activeElement) ? document.activeElement : null;

    const menu = element('div', 'os-context', container);
    menu.setAttribute('role', 'menu');
    menu.addEventListener('keydown', onKey);

    for (const item of items) {
        if (!item) {
            element('div', 'os-context-separator', menu).setAttribute('role', 'separator');
            continue;
        }

        const row = element('button', 'os-context-item', menu);
        row.type = 'button';
        row.tabIndex = -1;
        row.setAttribute('role', 'menuitem');
        row.textContent = item.label;
        row.disabled = Boolean(item.disabled);
        row.classList.toggle('os-context-default', Boolean(item.default));
        row.addEventListener('click', () => {
            close();
            item.action?.();
        });
    }

    const bounds = container.getBoundingClientRect();
    const scale = bounds.width / container.offsetWidth || 1;
    const left = (x - bounds.left) / scale;
    const top = (y - bounds.top) / scale;

    menu.style.left = `${Math.max(0, Math.min(left, container.clientWidth - menu.offsetWidth))}px`;
    menu.style.top = `${Math.max(0, Math.min(top, container.clientHeight - menu.offsetHeight))}px`;
    current = menu;
    opener = active;
    menu.querySelector('.os-context-item:not(:disabled)')?.focus();
};
