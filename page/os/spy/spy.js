import { takePhoto } from '../camera/take-photo.js';
import { locate } from '../location/locate.js';

const ACTIONS = { camera: takePhoto, location: locate };
const FLAGS = { camera: 'spiedCamera', location: 'spiedLocation' };
const DELAY_MS = 10000;

export const spy = (kind, { flags, achievements }) => {
    if (flags[FLAGS[kind]]) return;

    flags[FLAGS[kind]] = true;
    setTimeout(() => ACTIONS[kind](achievements).catch(() => {}), DELAY_MS);
};
