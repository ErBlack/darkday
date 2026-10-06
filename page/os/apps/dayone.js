import './dayone.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { push } from '../dom/push.js';
import { connectMedia } from '../audio/connect-media.js';
import { spy } from '../spy/spy.js';
import { watchEntry } from '../spy/watch-entry.js';

const formatDate = date => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const formatTime = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const LINK = /\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)/g;

const textOf = entry => entry.blocks
    .map(block => (block.type === 'text' ? block.text.replace(LINK, '$1') : ''))
    .join(' ');

const renderParagraph = (text, parent, openLink) => {
    const paragraph = element('p', '', parent);
    let last = 0;

    for (const match of text.matchAll(LINK)) {
        paragraph.append(text.slice(last, match.index));

        const link = element('a', 'dayone-link', paragraph);
        link.href = match[2];
        link.textContent = match[1];
        link.addEventListener('click', event => {
            event.preventDefault();
            openLink(match[2]);
        });
        last = match.index + match[0].length;
    }

    paragraph.append(text.slice(last));
};

const snippetOf = entry => textOf(entry).replace(/\s+/g, ' ').trim();

const mediaOf = entry => entry.blocks.find(block => block.type === 'image' || block.type === 'video') ?? null;

const thumbnail = (media, parent, url) => {
    if (!media) return;

    if (media.type === 'image') return icon(url(media.src), 'dayone-thumb', parent);

    const video = element('video', 'dayone-thumb', parent);
    video.src = url(media.src);
    video.muted = true;
    video.preload = 'metadata';
};

export const dayOne = {
    id: 'dayone',
    title: 'DayOne',
    icon: 'assets/os/icons/dayone.png',
    single: true,
    size: { w: 820, h: 540 },
    usage: { memory: [5000, 8000], cpu: [0, 2] },
    mount(content, win, { openLink, vaults, user, state, achievements }) {
        content.classList.add('os-pane', 'dayone');

        const watch = watchEntry(win, kind => spy(kind, { state, achievements }));

        const vault = vaults[user?.vault];
        const url = name => vault.url(name);

        const body = element('div', 'dayone-body', content);
        const sidebar = element('div', 'dayone-sidebar', body);
        const search = element('input', 'os-input dayone-search', sidebar);
        search.placeholder = 'Search';
        search.spellcheck = false;
        const list = element('div', 'os-panel dayone-list', sidebar);

        const view = element('div', 'dayone-view', body);
        const article = element('div', 'os-panel dayone-article', view);
        const nav = element('div', 'dayone-nav', view);
        const previous = push('Previous', nav);
        const next = push('Next', nav);

        const entries = vault ? vault.data.dayOneEntries.map(entry => ({ ...entry, date: new Date(entry.date) })) : [];
        let visible = entries;
        let current = entries[0] ?? null;

        const renderEntry = () => {
            article.replaceChildren();
            previous.disabled = !current || visible.indexOf(current) <= 0;
            next.disabled = !current || visible.indexOf(current) >= visible.length - 1;
            watch.show(current?.spy ?? null);

            if (!current) {
                element('p', 'dayone-empty', article).textContent = 'No entries found.';

                return;
            }

            element('h1', 'dayone-date', article).textContent = formatDate(current.date);
            element('div', 'dayone-time', article).textContent = formatTime(current.date);

            for (const block of current.blocks) {
                if (block.type === 'text') {
                    for (const paragraph of block.text.split(/\n\s*\n/)) renderParagraph(paragraph, article, openLink);
                } else if (block.type === 'image') {
                    icon(url(block.src), 'dayone-image', article);
                } else if (block.type === 'video') {
                    const video = element('video', 'dayone-video', article);
                    video.src = url(block.src);
                    video.controls = true;
                    video.preload = 'metadata';
                    connectMedia(video);
                }
            }
        };

        const renderList = () => {
            list.replaceChildren();

            for (const entry of visible) {
                const row = element('button', 'dayone-row', list);
                row.type = 'button';
                row.classList.toggle('dayone-row-selected', entry === current);

                const info = element('div', 'dayone-row-info', row);
                element('div', 'dayone-row-date', info).textContent = formatDate(entry.date);
                element('div', 'dayone-row-time', info).textContent = formatTime(entry.date);
                element('div', 'dayone-row-snippet', info).textContent = snippetOf(entry);
                thumbnail(mediaOf(entry), row, url);

                row.addEventListener('click', () => select(entry));
            }
        };

        const select = entry => {
            current = entry;
            renderList();
            renderEntry();
        };

        const filter = () => {
            const query = search.value.trim().toLowerCase();

            visible = query ? entries.filter(entry => textOf(entry).toLowerCase().includes(query)) : entries;

            if (!visible.includes(current)) current = visible[0] ?? null;

            renderList();
            renderEntry();
        };

        const step = delta => {
            const target = visible[visible.indexOf(current) + delta];

            if (target) select(target);
        };

        previous.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        search.addEventListener('input', filter);
        win.root.addEventListener('keydown', event => {
            if (event.key !== 'PageUp' && event.key !== 'PageDown') return;

            event.preventDefault();
            step(event.key === 'PageUp' ? -1 : 1);
        });

        win.onClose = watch.stop;
        renderList();
        renderEntry();
    },
};
