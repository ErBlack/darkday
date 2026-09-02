import './dialog.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { push } from '../dom/push.js';
import { toolButton } from '../dom/tool-button.js';
import { alert } from './alert.js';
import { password } from './password.js';
import { openVault } from '../vault/open-vault.js';
import { pathOf } from '../data/path-of.js';
import { findNode } from '../data/find-node.js';

const ALL_FILES = { label: 'All Files (*.*)', extensions: null };
const INDENT = '   ';

const iconUrl = name => `assets/os/icons/${name}.png`;

const isFolder = node => Boolean(node.children || node.path || node.device) || node.icon === 'folder';

const matches = (type, node) => !type.extensions || type.extensions.some(extension => node.name.toLowerCase().endsWith(`.${extension}`));

export const openFile = ({ title = 'Open', icon: windowIcon, root, flags, vaults, trash, onUnlock, types = [ALL_FILES], onOpen, onCancel }) => ({
    title,
    icon: windowIcon,
    dialog: true,
    mount(content, win) {
        content.classList.add('dialog', 'dialog-open');

        const top = element('div', 'dialog-open-top', content);
        const lookIn = element('label', 'dialog-field', top);
        lookIn.append('Look in:');
        const folders = element('select', 'os-input os-select', lookIn);
        const up = toolButton('', 'os-tool-up', top);
        up.title = 'Up One Level';

        const list = element('div', 'os-panel dialog-open-list', content);

        const bottom = element('div', 'dialog-open-bottom', content);
        element('span', '', bottom).textContent = 'File name:';
        const input = element('input', 'os-input', bottom);
        input.spellcheck = false;
        const ok = push('Open', bottom);
        element('span', '', bottom).textContent = 'Files of type:';
        const typeSelect = element('select', 'os-input os-select', bottom);
        const cancel = push('Cancel', bottom);

        for (const type of types) element('option', '', typeSelect).textContent = type.label;

        let trail = [root];
        let type = types[0];
        let entries = [];
        let selected = null;

        const visible = node => node.when?.(flags) ?? true;
        const listed = (parent, node) => visible(node) && !trash?.isDeleted(pathOf([...parent, node]));
        const fail = text => win.open(alert(text, { title, icon: 'error' }));

        const renderFolders = () => {
            entries = [[root]];

            for (const disk of root.children.filter(visible)) {
                entries.push([root, disk]);

                if (trail[1] === disk) {
                    for (let depth = 3; depth <= trail.length; depth += 1) entries.push(trail.slice(0, depth));
                }
            }

            folders.replaceChildren();

            entries.forEach((entry, index) => {
                const option = element('option', '', folders);
                option.value = index;
                option.textContent = INDENT.repeat(entry.length - 1) + entry.at(-1).name;
                option.selected = entry.length === trail.length && entry.every((node, depth) => node === trail[depth]);
            });
        };

        const render = () => {
            renderFolders();
            up.disabled = trail.length === 1;
            list.replaceChildren();

            const nodes = trail.at(-1).children.filter(node => listed(trail, node) && (isFolder(node) || matches(type, node)));

            for (const node of nodes) {
                const item = element('div', 'dialog-open-item', list);
                icon(iconUrl(node.icon), '', item);
                element('span', '', item).textContent = node.name;

                item.addEventListener('click', () => {
                    selected = node;
                    list.querySelector('.dialog-open-selected')?.classList.remove('dialog-open-selected');
                    item.classList.add('dialog-open-selected');

                    if (!isFolder(node)) input.value = node.name;
                });
                item.addEventListener('dblclick', () => enter(trail, node));
            }
        };

        const go = next => {
            trail = next;
            selected = null;
            input.value = '';
            render();
        };

        const unlock = (node, next) => win.open(password('This drive is password protected.\nType the password to open it.', {
            title: node.name,
            onSubmit: async value => {
                const vault = await openVault(node.vault, value);

                if (!vault) return fail('The password you typed is incorrect.\nPlease try again.');

                onUnlock(node.vault, value, vault);
                go(next);
            },
        }));

        const choose = target => {
            win.close();
            onOpen({ path: pathOf(target), node: target.at(-1) });
        };

        const enter = (parent, node) => {
            const next = [...parent, node];

            if (!isFolder(node)) return choose(next);
            if (node.error) return fail(node.error);
            if (node.vault && !vaults[node.vault]) return unlock(node, next);
            if (!node.children) return fail(`${pathOf(next)} is not accessible.\n\nAccess is denied.`);

            go(next);
        };

        const resolve = value => {
            if (/^[a-z]:/i.test(value)) {
                const found = findNode(root, value, flags);

                return found && !trash?.isDeleted(pathOf(found)) ? found : null;
            }

            const node = trail.at(-1).children.find(child => listed(trail, child) && child.name.toLowerCase() === value.toLowerCase());

            return node ? [...trail, node] : null;
        };

        const submit = () => {
            const value = input.value.trim();

            if (!value) return selected && enter(trail, selected);

            const target = resolve(value);

            if (!target) return fail(`${value}\nFile not found.\nPlease verify the correct file name was given.`);

            const locked = target.slice(0, -1).find(node => node.vault && !vaults[node.vault]);

            if (locked) return fail(`${locked.path} is not accessible.\n\nAccess is denied.`);

            enter(target.slice(0, -1), target.at(-1));
        };

        folders.addEventListener('change', () => {
            const entry = entries[folders.value];

            if (entry.length === 1) go(entry);
            else enter(entry.slice(0, -1), entry.at(-1));

            renderFolders();
        });
        typeSelect.addEventListener('change', () => {
            type = types[typeSelect.selectedIndex];
            render();
        });
        up.addEventListener('click', () => go(trail.slice(0, -1)));
        ok.addEventListener('click', submit);
        cancel.addEventListener('click', () => {
            win.close();
            onCancel?.();
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') submit();
        });
        win.root.addEventListener('keydown', event => {
            if (event.key === 'Escape') onCancel?.();
        });

        render();
        input.focus();
    },
});
