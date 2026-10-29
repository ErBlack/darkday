const CITIES = 'assets/cities.tsv';
const RADIANS = Math.PI / 180;

let cities = null;

const parse = text => {
    const [header, ...lines] = text.split('\n');
    const countries = header.split('\t');

    return lines.map(line => {
        const [name, country, latitude, longitude] = line.split('\t');

        return { name, country: countries[country], latitude: Number(latitude), longitude: Number(longitude) };
    });
};

const load = () => {
    cities ??= fetch(CITIES)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${CITIES}: ${response.status}`);

            return response.text();
        })
        .then(parse);

    cities.catch(() => {
        cities = null;
    });

    return cities;
};

const distance = (city, latitude, longitude) => {
    const dx = (((city.longitude - longitude + 540) % 360) - 180) * Math.cos(latitude * RADIANS);
    const dy = city.latitude - latitude;

    return dx * dx + dy * dy;
};

export const placeName = async (latitude, longitude) => {
    let nearest = null;
    let best = Infinity;

    for (const city of await load()) {
        const value = distance(city, latitude, longitude);

        if (value < best) {
            best = value;
            nearest = city;
        }
    }

    return nearest ? [nearest.name, nearest.country].filter(Boolean).join(', ') : null;
};
