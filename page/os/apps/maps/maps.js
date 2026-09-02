import './maps.css';
import { element } from '../../dom/element.js';
import { icon } from '../../dom/icon.js';
import { projectOnMap } from './projection.js';
import { requestPosition } from '../../location/request-position.js';
import { storeLocation } from '../../location/store-location.js';

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

            const place = await storeLocation(achievements, latitude, longitude);

            if (!place) return;

            label.textContent = place;
            label.hidden = false;
            status.textContent = `${place} (${coordinates})`;
        };

        const unavailable = () => {
            status.textContent = 'Location unavailable';
        };

        requestPosition().then(located, unavailable);
    },
};
