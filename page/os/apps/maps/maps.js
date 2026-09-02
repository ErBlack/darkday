import './maps.css';
import { element } from '../../dom/element.js';
import { icon } from '../../dom/icon.js';
import { projectOnMap } from './projection.js';
import { placeName } from './place-name.js';
import { checkExposed } from '../../achievements/check-exposed.js';
import { personal } from '../../data/personal.js';

const TIMEOUT_MS = 10000;

const formatCoordinate = (value, positive, negative) => `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

export const maps = {
    id: 'maps',
    title: 'Maps',
    icon: 'assets/os/icons/maps.png',
    single: true,
    size: { w: 760, h: 480 },
    usage: { memory: [6000, 9000], cpu: [0, 3] },
    mount(content, win, { achievements }) {
        content.classList.add('os-pane', 'maps');

        const view = element('div', 'maps-view', content);
        const frame = element('div', 'maps-frame', view);
        icon('assets/os/map.webp', 'maps-image', frame);
        const pin = element('span', 'maps-pin', frame);
        pin.textContent = '📍';
        pin.hidden = true;
        const label = element('span', 'maps-label', frame);
        label.hidden = true;

        const status = element('div', 'os-status', content);
        status.textContent = 'Locating...';

        const located = async ({ coords: { latitude, longitude } }) => {
            const { x, y } = projectOnMap(latitude, longitude);
            const coordinates = `${formatCoordinate(latitude, 'N', 'S')}, ${formatCoordinate(longitude, 'E', 'W')}`;

            pin.style.left = `${x * 100}%`;
            pin.style.top = `${y * 100}%`;
            pin.hidden = false;
            label.style.left = `${x * 100}%`;
            label.style.top = `${y * 100}%`;
            status.textContent = coordinates;
            personal.location = { latitude, longitude, place: null };
            checkExposed(achievements, { camera: Boolean(personal.photo), location: true });

            const place = await placeName(latitude, longitude).catch(() => null);

            if (!place) return;

            personal.location = { latitude, longitude, place };

            label.textContent = place;
            label.hidden = false;
            status.textContent = `${place} (${coordinates})`;
        };

        const unavailable = () => {
            status.textContent = 'Location unavailable';
        };

        if (!navigator.geolocation) return unavailable();

        navigator.geolocation.getCurrentPosition(located, unavailable, { timeout: TIMEOUT_MS, maximumAge: 600000 });
    },
};
