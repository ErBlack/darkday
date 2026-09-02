import { AUTOSAVE_KEY } from './autosave-key.js';
import { writeState } from './write-state.js';

export const writeAutosave = state => writeState(AUTOSAVE_KEY, state);
