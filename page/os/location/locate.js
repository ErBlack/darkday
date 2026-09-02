import { requestPosition } from './request-position.js';
import { storeLocation } from './store-location.js';

export const locate = async achievements => {
    const { coords } = await requestPosition();

    return storeLocation(achievements, coords.latitude, coords.longitude);
};
