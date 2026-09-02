import { placeName } from '../apps/maps/place-name.js';
import { checkExposed } from '../achievements/check-exposed.js';
import { personal } from '../data/personal.js';

export const storeLocation = async (achievements, latitude, longitude) => {
    personal.location = { latitude, longitude, place: null };
    checkExposed(achievements, { camera: Boolean(personal.photo), location: true });

    const place = await placeName(latitude, longitude).catch(() => null);

    if (place) personal.location = { latitude, longitude, place };

    return place;
};
