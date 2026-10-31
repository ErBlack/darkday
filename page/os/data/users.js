import { raster } from '../../engine/raster.js';
import { storyHistory } from './story-history.js';

export const users = [
    {
        name: 'drifter_ana',
        picture: 'assets/os/users/drifter_ana.jpg',
        wallpaper: raster('assets/os/wallpapers/drifter_ana', 'webp'),
        vault: 'ana',
        hint: 'my date of birth',
        history: storyHistory,
    },
    { name: 'Guest', picture: 'assets/os/users/guest.png', apps: ['browser'] },
];
