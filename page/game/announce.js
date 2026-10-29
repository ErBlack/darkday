import { element } from '../os/dom/element.js';

let region = null;

export const announce = text => {
    if (!region?.isConnected) {
        region = element('div', 'visually-hidden', document.body);
        region.setAttribute('role', 'status');
    }

    region.textContent = '';
    requestAnimationFrame(() => {
        region.textContent = text;
    });
};
