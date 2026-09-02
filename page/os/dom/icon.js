import { element } from './element.js';

export const icon = (src, className, parent) => {
    const image = element('img', className, parent);
    image.src = src;
    image.alt = '';

    return image;
};
