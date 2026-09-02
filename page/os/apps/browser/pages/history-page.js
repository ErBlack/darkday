import { element } from '../../../dom/element.js';

const formatTime = iso => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export const renderHistoryPage = (page, entries, { onOpen, onHover }) => {
    page.replaceChildren();
    element('h1', '', page).textContent = 'History';

    const list = element('div', 'browser-history-list', page);

    for (const entry of [...entries].reverse()) {
        const row = element('div', 'browser-history-entry', list);
        element('span', 'browser-history-time', row).textContent = formatTime(entry.time);

        const link = element('a', 'browser-link', row);
        link.href = entry.url;
        link.textContent = entry.title;
        link.addEventListener('click', event => {
            event.preventDefault();
            onOpen(entry.url);
        });
        link.addEventListener('mouseenter', () => onHover(entry.url));
        link.addEventListener('mouseleave', () => onHover(null));

        element('span', 'browser-history-url', row).textContent = entry.url;
    }
};
