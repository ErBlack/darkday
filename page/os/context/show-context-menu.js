import './context-menu.css';
import { element } from '../dom/element.js';

let current = null;

const close = () => {
    current?.remove();
    current = null;
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

    const menu = element('div', 'os-context', container);

    for (const item of items) {
        if (!item) {
            element('div', 'os-context-separator', menu);
            continue;
        }

        const row = element('button', 'os-context-item', menu);
        row.type = 'button';
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
};
