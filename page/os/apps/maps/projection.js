const WIDTH = 1920;
const HEIGHT = 995;
const CENTER_X = 908;
const PX_PER_DEGREE = 5.247;
const MIN_LON = -170;
const EQUATOR_Y = 627.05;
const PX_PER_GALL = 389.84;
const GALL = 1 + Math.SQRT1_2;

const latitudeToY = latitude => EQUATOR_Y - PX_PER_GALL * GALL * Math.tan((latitude * Math.PI) / 360);

export const projectOnMap = (latitude, longitude) => {
    const lon = longitude < MIN_LON ? longitude + 360 : longitude;

    return {
        x: (CENTER_X + lon * PX_PER_DEGREE) / WIDTH,
        y: latitudeToY(latitude) / HEIGHT,
    };
};
