import './explorer.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { toolButton } from '../dom/tool-button.js';
import { fileSystem } from '../data/fs.js';
import { alert } from '../dialogs/alert.js';
import { password } from '../dialogs/password.js';
import { cannotOpen } from '../data/cannot-open.js';
import { openVault } from '../vault/open-vault.js';
import { pathOf } from '../data/path-of.js';
import { confirm } from '../dialogs/confirm.js';
import { emptyTrash } from '../data/empty-trash.js';
import { trashIcon } from '../data/trash-icon.js';
import { showContextMenu } from '../context/show-context-menu.js';
import { onContext } from '../context/on-context.js';

const RECYCLE_BIN = 'Recycle Bin';
const ACCESS_DENIED = 'Access is denied.\n\nMake sure the disk is not full or write-protected and that the file is not currently in use.';

const iconUrl = name => `assets/os/icons/${name}.png`;

const isFolder = node => Boolean(node.children || node.path || node.device) || node.icon === 'folder';

let pending = null;

export const explorer = {
    open(name) {
        pending = name;
    },
    id: 'explorer',
    title: 'My Computer',
    icon: 'assets/os/icons/computer.png',
    size: { w: 560, h: 400 },
    usage: { memory: [3200, 4600], cpu: [0, 3] },
    mount(content, window, shell) {
        content.classList.add('os-pane', 'explorer');

        const toolbar = element('div', 'os-toolbar', content);
        const back = toolButton('Back', 'os-tool-back', toolbar);
        const up = toolButton('Up', 'os-tool-up', toolbar);

        const address = element('label', 'explorer-address', content);
        address.append('Address');
        const path = element('input', 'os-input', address);
        path.readOnly = true;

        const view = element('div', 'os-panel explorer-items', content);

        const start = pending && fileSystem.children.find(node => node.name === pending);
        let trail = start ? [fileSystem, start] : [fileSystem];

        pending = null;
        let history = [];
        let selected = null;

        const inBin = () => trail.at(-1).path === RECYCLE_BIN;

        const childrenOf = () => {
            if (inBin()) return shell.trash.items.map(entry => ({ name: entry.name, icon: entry.icon, trashed: entry.path }));

            return trail.at(-1).children
                .filter(node => (node.when?.(shell.flags) ?? true) && !shell.trash.isDeleted(pathOf([...trail, node])));
        };

        const isSelected = node => node === selected || Boolean(node.trashed && node.trashed === selected?.trashed);

        const menuAt = (event, items) => showContextMenu(content.closest('.os-desktop') ?? content, event.clientX, event.clientY, items);

        const itemMenu = node => {
            if (node.trashed) {
                return [
                    { label: 'Restore', action: () => shell.trash.restore(node.trashed) },
                    null,
                    { label: 'Cut' },
                    null,
                    { label: 'Delete', action: () => remove(node) },
                    null,
                    { label: 'Properties' },
                ];
            }

            if (isFolder(node)) {
                return [
                    { label: 'Open', default: true, action: () => open(node) },
                    { label: 'Explore', action: () => open(node) },
                    null,
                    { label: 'Properties' },
                ];
            }

            return [
                { label: 'Open', default: true, action: () => open(node) },
                null,
                { label: 'Cut' },
                { label: 'Copy' },
                null,
                { label: 'Delete', action: () => remove(node) },
                { label: 'Rename' },
                null,
                { label: 'Properties' },
            ];
        };

        const backgroundMenu = () => [
            ...(inBin() ? [{ label: 'Empty Recycle Bin', disabled: !shell.trash.items.length, action: () => emptyTrash(window.open.bind(window), shell.trash) }, null] : []),
            { label: 'View' },
            { label: 'Arrange Icons By' },
            null,
            { label: 'Refresh', action: () => render() },
            null,
            { label: 'Paste', disabled: true },
            { label: 'Paste Shortcut', disabled: true },
            null,
            { label: 'New' },
            null,
            { label: 'Properties' },
        ];

        const render = () => {
            const current = trail.at(-1);

            window.setTitle(current.name);
            path.value = pathOf(trail);
            back.disabled = history.length === 0;
            up.disabled = trail.length === 1;
            view.replaceChildren();

            for (const node of childrenOf()) {
                const item = element('div', 'explorer-item', view);
                item.classList.toggle('explorer-selected', isSelected(node));
                icon(iconUrl(node.path === RECYCLE_BIN ? trashIcon(shell.trash) : node.icon), '', item);
                element('span', '', item).textContent = node.name;

                item.addEventListener('click', () => {
                    selected = node;

                    for (const other of view.children) other.classList.toggle('explorer-selected', other === item);

                    if (node.device && shell.floppy.playing) shell.floppy.toggle();
                });
                item.addEventListener('dblclick', () => node.trashed || open(node));
                onContext(item, event => {
                    selected = node;
                    render();
                    menuAt(event, itemMenu(node));
                });
            }
        };

        const navigate = next => {
            history.push(trail);
            trail = next;
            selected = null;
            render();
        };

        const fail = (node, target) => window.open(alert(node.error, { title: target, icon: 'error' }));

        const access = async (node, target) => {
            if (shell.floppy.playing) return shell.floppy.stop();

            const result = await shell.floppy.access();

            if (result === 'music') shell.achievements.unlock('e1m1');
            if (result === 'error' && !window.closed) fail(node, target);
        };

        const unlock = node => window.open(password('This drive is password protected.\nType the password to open it.', {
            title: node.name,
            onSubmit: async value => {
                const vault = await openVault(node.vault, value);

                if (vault) {
                    shell.unlock(node.vault, value, vault);
                    navigate([...trail, node]);

                    return;
                }

                const error = window.open(alert('The password you typed is incorrect.\nPlease try again.', { title: node.name, icon: 'error' }));
                error.onClose = () => unlock(node);
            },
        }));

        const open = node => {
            const target = pathOf([...trail, node]);

            if (node.device) return access(node, target);
            if (node.error) return fail(node, target);
            if (node.vault && !shell.vaults[node.vault]) return unlock(node);
            if (node.children) return navigate([...trail, node]);

            if (node.app) {
                if (!shell.allowed(node.app)) return window.open(alert(cannotOpen(node.name), { title: node.name, icon: 'error' }));

                node.app.open(target);

                return shell.open(node.app);
            }

            window.open(alert(`${target} is not accessible.\n\nAccess is denied.`, { title: target, icon: 'error' }));
        };

        const deleteError = (node, reason) => window.open(alert(`Cannot delete ${node.name}: ${reason}`, { title: 'Error Deleting File', icon: 'error' }));

        const remove = node => {
            if (node.trashed) {
                return window.open(confirm(`Are you sure you want to delete '${node.name}'?`, {
                    title: 'Confirm File Delete',
                    icon: 'question',
                    onConfirm: () => shell.trash.purge(node.trashed),
                }));
            }

            if (isFolder(node) || node.icon === 'system-file') return deleteError(node, ACCESS_DENIED);

            const target = pathOf([...trail, node]);

            window.open(confirm(`Are you sure you want to send '${node.name}' to the Recycle Bin?`, {
                title: 'Confirm File Delete',
                icon: 'question',
                onConfirm: () => shell.trash.remove(target, node),
            }));
        };

        onContext(view, event => {
            selected = null;
            render();
            menuAt(event, backgroundMenu());
        });
        window.root.addEventListener('keydown', event => {
            if (event.key === 'Delete' && selected && !event.target.closest('input')) remove(selected);
        });

        back.addEventListener('click', () => {
            trail = history.pop();
            selected = null;
            render();
        });
        up.addEventListener('click', () => navigate(trail.slice(0, -1)));
        view.addEventListener('click', event => {
            if (event.target !== view) return;

            selected = null;
            render();
        });

        shell.changes.addEventListener('change', render);

        window.onClose = () => {
            shell.changes.removeEventListener('change', render);

            if (!shell.processes.apps.includes(explorer)) shell.floppy.stop();
        };

        render();
    },
};
