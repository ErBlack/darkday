import { element } from './element.js';

export const push = (label, parent) => {
    const button = element('button', 'os-push', parent);
    button.type = 'button';
    button.textContent = label;

    return button;
};
