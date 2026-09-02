const WIDTH = 1920;
const HEIGHT = 995;
const CENTER_X = 908;
const PX_PER_DEGREE = 5.247;
const MIN_LON = -170;

const LATITUDES = [
    [83.6, 19],
    [80.8, 62],
    [77.0, 95],
    [70.5, 159],
    [66.5, 193],
    [63.4, 219],
    [59.8, 248],
    [50.0, 320],
    [41.5, 351],
    [31.0, 445],
    [23.3, 492],
    [17.5, 526],
    [7.0, 585],
    [0, 628],
    [-5.9, 662],
    [-10.7, 689],
    [-25.6, 778],
    [-34.83, 835],
    [-39.1, 863],
    [-43.6, 893],
    [-46.6, 913],
    [-55.98, 977],
];

const latitudeToY = latitude => {
    const clamped = Math.max(LATITUDES.at(-1)[0], Math.min(LATITUDES[0][0], latitude));
    const index = LATITUDES.findIndex(([lat]) => lat <= clamped);
    const [lat1, y1] = LATITUDES[Math.max(0, index - 1)];
    const [lat0, y0] = LATITUDES[Math.max(0, index)];

    if (lat1 === lat0) return y0;

    return y0 + ((clamped - lat0) / (lat1 - lat0)) * (y1 - y0);
};

export const projectOnMap = (latitude, longitude) => {
    const lon = longitude < MIN_LON ? longitude + 360 : longitude;

    return {
        x: (CENTER_X + lon * PX_PER_DEGREE) / WIDTH,
        y: latitudeToY(latitude) / HEIGHT,
    };
};
