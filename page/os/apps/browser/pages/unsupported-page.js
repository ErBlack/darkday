import { element } from '../../../dom/element.js';
import { icon } from '../../../dom/icon.js';

export const renderUnsupportedPage = (page, href) => {
    page.replaceChildren();

    const box = element('div', 'browser-error', page);
    icon('assets/os/dino.png', 'browser-error-image', box);
    element('h1', '', box).textContent = 'Your browser could not display this page';

    const open = element('button', 'browser-link browser-link-button', box);
    open.type = 'button';
    open.textContent = 'Try another one';
    open.addEventListener('click', () => globalThis.open(href, '_blank', 'noopener'));
};
