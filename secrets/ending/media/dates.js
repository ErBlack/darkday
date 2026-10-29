const DAY_MS = 86400000;
const OPENING = new Date('2026-10-10T12:00:00');

const now = new Date();
now.setHours(12, 0, 0, 0);

const today = now < OPENING ? OPENING : now;

const shifted = offset => new Date(today.getTime() + offset * DAY_MS);

const formats = {
    long: date => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    day: date => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    weekday: date => date.toLocaleDateString('en-US', { weekday: 'long' }),
};

for (const node of document.querySelectorAll('[data-offset]')) {
    node.textContent = formats[node.dataset.format ?? 'long'](shifted(Number(node.dataset.offset)));
}

for (const node of document.querySelectorAll('[data-since]')) {
    const since = new Date(`${node.dataset.since}T12:00:00`);
    const until = shifted(Number(node.dataset.until ?? 0));

    node.textContent = String(Math.round((until - since) / DAY_MS));
}
