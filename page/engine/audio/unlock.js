import { audioContext } from './audio-context.js';

export const unlock = () => audioContext().resume();
