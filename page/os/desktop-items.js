import { browser } from './apps/browser/browser.js';
import { explorer } from './apps/explorer.js';
import { trashIcon } from './data/trash-icon.js';

export const desktopItems = [
    { label: 'Recycle Bin', icon: shell => `assets/os/icons/${trashIcon(shell.trash)}.png`, app: explorer, arg: 'Recycle Bin' },
    { label: 'Browser', icon: browser.icon, app: browser },
];
