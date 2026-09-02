import { SAVE_KEY } from './save-key.js';
import { writeState } from './write-state.js';

export const saveState = state => writeState(SAVE_KEY, state);
