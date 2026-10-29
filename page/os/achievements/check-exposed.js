import { granted } from '../spy/granted.js';

export const checkExposed = async (achievements, known) => {
    const [camera, location] = await Promise.all([granted('camera'), granted('geolocation')]);

    if ((camera ?? known.camera) && (location ?? known.location)) achievements.unlock('exposed');
};
