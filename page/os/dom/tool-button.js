import { element } from './element.js';

export const toolButton = (label, className, parent) => {
    const button = element('button', 'os-tool', parent);
    button.type = 'button';
    element('span', `os-tool-icon ${className}`, button);
    element('span', '', button).textContent = label;

    return button;
};
