import { DEAD_END_PATHS } from './dead-end-paths.js';

export const isDeadEnd = trash => DEAD_END_PATHS.every(path => trash.isDeleted(path) && !trash.items.some(entry => entry.path === path));
