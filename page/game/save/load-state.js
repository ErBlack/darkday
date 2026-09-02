import { SAVE_KEY } from './save-key.js';
import { readState } from './read-state.js';

export const loadState = () => readState(SAVE_KEY);
