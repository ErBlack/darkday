import './cryptool.css';
import { element } from '../../dom/element.js';
import { alert } from '../../dialogs/alert.js';
import { openFile } from '../../dialogs/open-file.js';
import { ALPHABET, encrypt } from './cipher.js';
import { spy } from '../../spy/spy.js';
import { watchEntry } from '../../spy/watch-entry.js';

const KEYS_FILLER = ' ';

const normalize = path => path.trim().replace(/\//g, '\\').replace(/^"|"$/g, '').toLowerCase();

const letterOf = char => {
    const upper = char.toUpperCase();

    return ALPHABET.includes(upper) ? upper : null;
};

const TOKEN = /\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)|`([^`]+)`/g;

const LOCKED = '<svg viewBox="0 0 12 14" width="12" height="14"><path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="6" width="10" height="7" fill="currentColor"/></svg>';

const UNLOCKED = '<svg viewBox="0 0 12 14" width="12" height="14"><path d="M9 6V4a3 3 0 0 0-6 0" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="6" width="10" height="7" fill="currentColor"/></svg>';

const segments = text => {
    const result = [];
    let last = 0;

    for (const match of text.matchAll(TOKEN)) {
        if (match.index > last) result.push({ text: text.slice(last, match.index) });

        result.push(match[3] === undefined ? { text: match[1], href: match[2] } : { text: match[3], copy: true });
        last = match.index + match[0].length;
    }

    if (last < text.length) result.push({ text: text.slice(last) });

    return result;
};

const notFound = path => alert(
    `Cannot open '${path}'.\n\nThe file is not a CrypTool document or does not exist.`,
    { title: 'CrypTool', icon: 'error' },
);

let pending = null;
let load = null;

export const crypTool = {
    id: 'cryptool',
    title: 'CrypTool',
    icon: 'assets/os/icons/cryptool.png',
    single: true,
    size: { w: 720, h: 500 },
    usage: { memory: [4000, 6500], cpu: [0, 2] },
    open(path) {
        if (load) load(path);
        else pending = path;
    },
    mount(content, win, { state, flags, vaults, trash, changes, unlock, openLink, fileSystem, khaos, appState, achievements }) {
        content.classList.add('os-pane', 'cryptool');

        const watch = watchEntry(win, kind => spy(kind, { state, achievements }));

        const mapping = state.cipher;
        let entries = [];
        let key = '';
        const memory = appState('cryptool', { index: 0, path: null });
        let index = memory.index;
        let selected = null;
        let caret = null;

        const screen = element('div', 'cryptool-screen', content);
        const header = element('div', 'cryptool-header', screen);
        header.hidden = true;
        const headerLeft = element('span', '', header);
        const headerRight = element('span', 'cryptool-header-right', header);
        const keysLabel = element('span', '', headerRight);
        const lock = element('span', 'cryptool-lock', headerRight);
        const page = element('div', 'cryptool-page', screen);
        const top = element('div', 'cryptool-top', page);
        const date = element('div', 'cryptool-date', top);
        const body = element('div', 'cryptool-body', page);

        const keys = element('input', 'cryptool-keys', screen);
        keys.value = KEYS_FILLER;
        keys.autocomplete = 'off';
        keys.spellcheck = false;
        keys.setAttribute('autocapitalize', 'characters');
        keys.setAttribute('autocorrect', 'off');
        keys.setAttribute('aria-hidden', 'true');
        const nav = element('div', 'cryptool-nav', screen);
        nav.hidden = true;
        const navButton = (label, parent) => {
            const button = element('button', 'cryptool-nav-button', parent);
            button.type = 'button';
            button.textContent = label;

            return button;
        };
        const previous = navButton('[<]', nav);
        const dots = element('div', 'cryptool-dots', nav);
        const next = navButton('[>]', nav);

        const shown = char => {
            const letter = letterOf(char);
            const plain = letter && mapping[letter];

            if (!plain) return char;

            return char === letter ? plain : plain.toLowerCase();
        };

        const solvedText = text => [...text].every(char => !letterOf(char) || mapping[letterOf(char)]);

        const solvedEntry = entry => solvedText(entry.date) && entry.body.every(part => solvedText(part.text));

        const plainText = text => [...text].map(shown).join('');

        const deciphered = () => [...ALPHABET].every((plain, i) => mapping[key[i]] === plain);

        const correct = char => {
            const letter = letterOf(char);

            return !letter || mapping[letter] === ALPHABET[key.indexOf(letter)];
        };

        const credentialsSolved = () => entries
            .flatMap(entry => entry.body)
            .filter(part => part.copy)
            .every(part => [...part.text].every(correct));

        const copyButton = (text, parent) => {
            const button = element('button', 'cryptool-copy', parent);
            button.type = 'button';
            button.textContent = '[COPY]';

            let timer = null;

            button.addEventListener('click', () => {
                navigator.clipboard.writeText(text()).catch(() => {});
                button.textContent = '[COPIED]';
                clearTimeout(timer);
                timer = setTimeout(() => {
                    button.textContent = '[COPY]';
                }, 250);
            });

            return button;
        };

        const copy = copyButton(() => {
            const entry = entries[index];

            return `${plainText(entry.date)}\n\n${entry.body.map(part => plainText(part.text)).join('')}`;
        }, top);

        const renderText = (target, name, parts) => {
            target.replaceChildren();

            let position = 0;

            for (const part of parts) {
                const solvedLink = Boolean(part.href) && solvedText(part.text);
                const holder = part.href ? element('a', 'cryptool-link', target)
                    : part.copy ? element('span', 'cryptool-copyable', target)
                        : target;

                if (solvedLink) {
                    holder.classList.add('cryptool-link-solved');
                    holder.href = part.href;
                    holder.addEventListener('click', event => {
                        event.preventDefault();
                        event.stopPropagation();
                        openLink(part.href);
                    });
                }

                for (const char of part.text) {
                    const letter = letterOf(char);
                    const id = `${name}:${position}`;

                    position += 1;

                    if (!letter) {
                        holder.append(char);
                        continue;
                    }

                    const span = element('span', 'cryptool-letter', holder);
                    span.dataset.id = id;
                    span.dataset.letter = letter;
                    span.textContent = shown(char);
                    span.classList.toggle('cryptool-solved', Boolean(mapping[letter]));
                    span.classList.toggle('cryptool-unsolved', !mapping[letter]);
                    span.classList.toggle('cryptool-same', letter === selected);
                    span.classList.toggle('cryptool-caret', id === caret);

                    if (!solvedLink) {
                        span.addEventListener('click', event => {
                            event.stopPropagation();
                            select(letter, id);
                        });
                    }
                }

                if (part.copy && solvedText(part.text)) copyButton(() => plainText(part.text), holder);
            }
        };

        const render = () => {
            const entry = entries[index];

            const keys = Object.keys(mapping).length;
            const open = deciphered();

            if (entry.body.some(part => part.copy) && credentialsSolved()) khaos.arm();
            if (open) achievements.unlock('cipherpunk');

            renderText(date, 'date', [{ text: entry.date }]);
            renderText(body, 'body', entry.body);
            headerLeft.textContent = `NOTES.SEC · CIPHER ${open ? 'OPEN' : 'LOCKED'} · RECORD ${index + 1}/${entries.length}`;
            keysLabel.textContent = `KEYS ${keys}/${ALPHABET.length}`;
            lock.innerHTML = open ? UNLOCKED : LOCKED;
            lock.classList.toggle('cryptool-lock-open', open);
            copy.hidden = !solvedEntry(entry);
            watch.show(solvedEntry(entry) ? entry.spy ?? null : null);
            previous.disabled = index === 0;
            next.disabled = index === entries.length - 1;
            dots.replaceChildren();

            entries.forEach((_, i) => {
                const dot = element('button', 'cryptool-dot', dots);
                dot.type = 'button';
                dot.textContent = i === index ? '●' : '○';
                dot.classList.toggle('cryptool-dot-active', i === index);
                dot.addEventListener('click', () => go(i));
            });
        };

        const go = to => {
            index = Math.max(0, Math.min(entries.length - 1, to));
            memory.index = index;
            selected = null;
            caret = null;
            render();
            page.scrollTop = 0;
        };

        const select = (letter, id = null) => {
            selected = letter;
            caret = id;
            render();

            if (letter) keys.focus({ preventScroll: true });
            else if (document.activeElement === keys) win.root.focus({ preventScroll: true });
        };

        const letterSpans = () => [...page.querySelectorAll('.cryptool-letter')];

        const currentSpan = () => letterSpans().find(span => span.dataset.id === caret);

        const moveCaret = delta => {
            const spans = letterSpans();
            const position = spans.findIndex(span => span.dataset.id === caret);
            const target = spans[position + delta];

            if (target) select(target.dataset.letter, target.dataset.id);
        };

        const selectSpan = span => select(span.dataset.letter, span.dataset.id);

        const enter = delta => {
            const spans = letterSpans().map(span => ({ span, rect: span.getBoundingClientRect() }));

            if (!spans.length) return;

            if (delta > 0) return selectSpan(spans[0].span);

            const bottom = Math.max(...spans.map(({ rect }) => rect.top));
            const last = spans.filter(({ rect }) => rect.top === bottom);

            selectSpan(last.reduce((best, item) => (item.rect.left < best.rect.left ? item : best)).span);
        };

        const moveLine = delta => {
            const current = currentSpan()?.getBoundingClientRect();

            if (!current) return enter(delta);

            const middle = current.left + current.width / 2;
            const rows = letterSpans()
                .map(span => ({ span, rect: span.getBoundingClientRect() }))
                .filter(({ rect }) => (delta > 0 ? rect.top >= current.bottom - 1 : rect.bottom <= current.top + 1));

            if (!rows.length) return select(null);

            const edge = delta > 0 ? Math.min(...rows.map(({ rect }) => rect.top)) : Math.max(...rows.map(({ rect }) => rect.bottom));
            const line = rows.filter(({ rect }) => (delta > 0 ? rect.top === edge : rect.bottom === edge));
            const target = line.reduce((best, item) => (Math.abs(item.rect.left + item.rect.width / 2 - middle) < Math.abs(best.rect.left + best.rect.width / 2 - middle) ? item : best));

            selectSpan(target.span);
        };

        const taken = plain => Object.entries(mapping).some(([cipher, value]) => value === plain && cipher !== selected);

        const assign = plain => {
            if (!selected || (plain && taken(plain))) return;

            if (plain) mapping[selected] = plain;
            else delete mapping[selected];

            render();
        };

        let opened = false;

        const ask = () => win.open(openFile({
            icon: 'assets/os/icons/cryptool.png',
            root: fileSystem,
            flags,
            vaults,
            trash,
            onUnlock: unlock,
            types: [
                { label: 'CrypTool Documents (*.sec)', extensions: ['sec'] },
                { label: 'All Files (*.*)', extensions: null },
            ],
            onOpen: ({ path }) => show(path),
            onCancel: () => opened || win.close(),
        }));

        const available = () => flags.flashInserted && vaults.flash && !trash.isDeleted(vaults.flash.data.CRYPTOOL_PATH);

        const close = () => {
            opened = false;
            entries = [];
            memory.path = null;
            selected = null;
            caret = null;
            header.hidden = true;
            nav.hidden = true;
            copy.hidden = true;
            date.replaceChildren();
            body.replaceChildren();
            watch.show(null);
            win.setTitle(crypTool.title);
            ask();
        };

        const onChange = () => {
            if (opened && !available()) close();
        };

        const show = path => {
            const vault = vaults.flash;

            if (!available() || normalize(path) !== normalize(vault.data.CRYPTOOL_PATH)) {
                const error = win.open(notFound(path));
                const previousClose = error.onClose;
                error.onClose = () => {
                    previousClose?.();
                    if (!opened) ask();
                };

                return;
            }

            const { CRYPTOOL_PATH, CRYPTOOL_KEY, crypToolEntries } = vault.data;

            key = CRYPTOOL_KEY;
            entries = crypToolEntries.map(entry => ({
                date: encrypt(entry.date, CRYPTOOL_KEY),
                spy: entry.spy,
                body: segments(entry.text).map(part => ({ ...part, text: encrypt(part.text, CRYPTOOL_KEY) })),
            }));
            opened = true;
            memory.path = path;
            index = Math.min(index, entries.length - 1);
            header.hidden = false;
            nav.hidden = false;
            win.setTitle(`${CRYPTOOL_PATH} - CrypTool`);
            render();
            win.root.focus();
        };

        previous.addEventListener('click', () => go(index - 1));
        next.addEventListener('click', () => go(index + 1));
        screen.addEventListener('click', event => {
            if (!event.target.closest('button')) select(null);
        });
        keys.addEventListener('beforeinput', event => {
            event.preventDefault();

            if (!opened) return;
            if (event.inputType.startsWith('delete')) return assign(null);

            const letter = [...(event.data ?? '')].reverse().find(char => letterOf(char));

            if (letter) assign(letter.toUpperCase());
        });
        keys.addEventListener('input', () => {
            keys.value = KEYS_FILLER;
        });
        win.root.addEventListener('keydown', event => {
            if (!opened || event.ctrlKey || event.metaKey || event.altKey) return;

            if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault();
                assign(null);
            } else if (/^[a-z]$/i.test(event.key)) {
                event.preventDefault();
                assign(event.key.toUpperCase());
            } else if (event.key === 'Escape') {
                select(null);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (caret) moveCaret(-1);
                else go(index - 1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (caret) moveCaret(1);
                else go(index + 1);
            } else if (event.key === 'PageUp' || event.key === 'PageDown') {
                event.preventDefault();
                go(index + (event.key === 'PageUp' ? -1 : 1));
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveLine(event.key === 'ArrowDown' ? 1 : -1);
            }
        });

        load = show;
        changes.addEventListener('change', onChange);
        win.onClose = () => {
            load = null;
            changes.removeEventListener('change', onChange);
            watch.stop();
        };

        const path = pending ?? memory.path;

        if (path) show(path);
        else ask();

        pending = null;
    },
};
