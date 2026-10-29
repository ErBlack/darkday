import { Item } from './item.js';
import { loadImage } from '../engine/load-image.js';
import { renderNote } from './note.js';

export const loadItems = async ({ state, renderer }) => {
    const [key, laptop, crowbar, flash, note] = await Promise.all([
        loadImage('assets/items/key.webp'),
        loadImage('assets/items/laptop.webp'),
        loadImage('assets/items/crowbar.webp'),
        loadImage('assets/items/flash.webp'),
        renderNote(),
    ]);

    return {
        key: new Item('key', key, state, renderer, { name: 'Key' }),
        laptop: new Item('laptop', laptop, state, renderer, { name: 'Old laptop' }),
        crowbar: new Item('crowbar', crowbar, state, renderer, { name: 'Crowbar' }),
        flash: new Item('flash', flash, state, renderer, { name: 'USB Stick' }),
        note: new Item('note', note, state, renderer, { name: 'Welcome note', openable: true }),
    };
};
