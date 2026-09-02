import { AUTOSAVE_KEY } from './autosave-key.js';
import { readState } from './read-state.js';

export const readAutosave = () => readState(AUTOSAVE_KEY);
