const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

export const placeName = async (latitude, longitude) => {
    const url = new URL(ENDPOINT);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', latitude);
    url.searchParams.set('lon', longitude);
    url.searchParams.set('zoom', '10');
    url.searchParams.set('accept-language', 'en');

    const response = await fetch(url);

    if (!response.ok) return null;

    const { address = {} } = await response.json();
    const locality = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? address.state;

    return [locality, address.country].filter(Boolean).join(', ') || null;
};
