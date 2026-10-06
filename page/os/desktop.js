import './os.css';
import { WindowManager } from './window-manager.js';
import { Taskbar } from './taskbar.js';
import { StartMenu } from './start-menu.js';
import { DesktopIcons } from './desktop-icons.js';
import { Processes } from './processes.js';
import { Khaos } from './khaos/khaos.js';
import { FloppyDrive } from './floppy-drive.js';
import { Logon } from './logon/logon.js';
import { startItemsFor } from './start-items.js';
import { desktopItems } from './desktop-items.js';
import { users } from './data/users.js';
import { fileSystem } from './data/fs.js';
import { run } from './apps/run.js';
import { explorer } from './apps/explorer.js';
import { mirror } from './apps/mirror.js';
import { maps } from './apps/maps/maps.js';
import { browser } from './apps/browser/browser.js';
import { dayOne } from './apps/dayone.js';
import { taskManager } from './apps/task-manager.js';
import { crypTool } from './apps/cryptool/cryptool.js';
import { playSystemSound } from './audio/play-system-sound.js';
import { openVault } from './vault/open-vault.js';
import { Trash } from './data/trash.js';
import { emptyTrash } from './data/empty-trash.js';
import { showContextMenu } from './context/show-context-menu.js';
import { onContext } from './context/on-context.js';
import { registerVaultPages } from './apps/browser/register-vault-pages.js';
import { isDeadEnd } from './dead-end/is-dead-end.js';
import { playDeadEnd } from './dead-end/play-dead-end.js';
import { DEAD_END_PATHS } from './dead-end/dead-end-paths.js';
import { cancelSpies } from './spy/spy.js';
import { persistentKeys } from './vault/persistent-keys.js';

const APPS = [run, explorer, mirror, maps, browser, dayOne, crypTool, taskManager];
const RECYCLE_BIN = 'Recycle Bin';
const DESKTOP_MENU = [
    { label: 'Arrange Icons By' },
    { label: 'Refresh' },
    null,
    { label: 'Paste', disabled: true },
    { label: 'Paste Shortcut', disabled: true },
    null,
    { label: 'New' },
    null,
    { label: 'Properties' },
];
const STARTUP_SOUND = 'assets/sounds/startup.mp3';
const LOGON_SOUND = 'assets/sounds/logon.mp3';
const LOGOFF_SOUND = 'assets/sounds/logoff.mp3';

export class Desktop {
    #observer;
    #area;
    #deadEnd = false;

    onShutDown = null;
    onStandBy = null;
    onTurnOff = null;
    onEnding = null;
    onEndingStart = null;
    startMenu = null;

    get user() {
        return users.find(user => user.name === this.state.user) ?? null;
    }

    constructor(game, parent, achievements) {
        const state = game.os;
        const saved = [...state.windows];

        this.state = state;
        this.root = document.createElement('div');
        this.root.className = 'os-desktop';

        const area = document.createElement('div');
        area.className = 'os-area';
        this.#area = area;

        const bar = document.createElement('div');
        bar.className = 'os-taskbar';

        this.root.append(area, bar);
        parent.append(this.root);

        const desktop = this;
        const vaults = {};
        const changes = new EventTarget();

        this.shell = {
            state,
            flags: {
                get flashInserted() {
                    return game.items.flash === 'laptop';
                },
            },
            fileSystem,
            processes: null,
            khaos: null,
            floppy: new FloppyDrive(),
            changes,
            trash: new Trash(state, changes),
            achievements,
            vaults,
            get user() {
                return desktop.user;
            },
            unlock: (name, password, vault) => {
                state.keys[name] = password;
                vaults[name] = vault;

                return registerVaultPages(vault).catch(() => {});
            },
            openVault: async (name, password) => {
                const vault = await openVault(name, password);

                if (vault) await desktop.shell.unlock(name, password, vault);

                return vault;
            },
            appState: (id, defaults) => (state.apps[id] ??= structuredClone(defaults)),
            allowed: app => !this.user?.apps || this.user.apps.includes(app.id),
            open: app => this.open(app),
            openLink: url => this.openLink(url),
            shutDown: () => this.onShutDown?.(),
            standBy: () => this.onStandBy?.(),
            logOff: () => this.logOff(),
            ending: kind => this.onEnding?.(kind),
        };
        this.taskbar = new Taskbar(bar, window => this.windows.toggle(window));
        this.windows = new WindowManager(area, this.taskbar, state, this.shell);
        this.shell.khaos = new Khaos(state, this.windows, this.root);
        this.shell.khaos.onSolve = () => this.onEndingStart?.();
        this.shell.khaos.onSolved = async password => {
            await this.shell.openVault('ending', password);
            this.onEnding?.('bad');
        };
        this.shell.processes = new Processes(this.windows, state, this.shell.khaos);
        this.icons = new DesktopIcons(area, desktopItems, this.shell, item => this.select(item), (item, event) => this.#iconMenu(item, event));

        onContext(area, event => {
            if (event.target.closest('.os-window')) return;

            showContextMenu(this.root, event.clientX, event.clientY, DESKTOP_MENU);
        });

        this.#observer = new ResizeObserver(() => this.windows.resize({ w: area.clientWidth, h: area.clientHeight }));
        this.#observer.observe(area);
        this.windows.resize({ w: area.clientWidth, h: area.clientHeight });

        changes.addEventListener('change', () => {
            this.icons.refresh();
            this.#checkDeadEnd();
        });
        this.#checkDeadEnd();

        if (this.user) this.#resume(saved);
        else this.#showLogon(saved);
    }

    #checkDeadEnd() {
        const { trash, achievements } = this.shell;

        if (this.#deadEnd || !isDeadEnd(trash)) return;

        this.#deadEnd = true;
        achievements.unlock('dead-end');
        playDeadEnd(() => {
            for (const path of DEAD_END_PATHS) trash.restore(path);

            this.#deadEnd = false;
        });
    }

    async #resume(saved) {
        for (const [name, password] of Object.entries(this.state.keys)) {
            const vault = await openVault(name, password);

            if (vault) this.shell.unlock(name, password, vault);
        }

        this.#enter(saved);
    }

    #showLogon(saved) {
        this.logon = new Logon(this.root, users, {
            onLogon: (user, vault, password) => this.#logon(user, saved, vault, password),
            onTurnOff: () => this.onTurnOff?.(),
        });
    }

    #logon(user, saved, vault, password) {
        this.state.user = user.name;

        if (vault) this.shell.unlock(user.vault, password, vault);

        playSystemSound(this.state.started ? LOGON_SOUND : STARTUP_SOUND, { volume: 0.6 }).catch(() => {});
        this.state.started = true;
        this.#enter(saved);
    }

    #enter(saved) {
        const user = this.user;

        this.#area.style.backgroundImage = user.wallpaper ? `url(${user.wallpaper})` : '';
        this.startMenu = new StartMenu(this.root, this.taskbar.start, startItemsFor(this.shell.allowed), item => this.select(item));
        this.#restore(saved);
    }

    logOff() {
        playSystemSound(LOGOFF_SOUND, { volume: 0.6 }).catch(() => {});

        for (const window of [...this.windows.tasks]) this.windows.close(window);

        this.shell.floppy.stop();
        this.startMenu.destroy();
        this.startMenu = null;
        this.state.user = null;
        this.state.keys = persistentKeys(this.state.keys);

        for (const name of Object.keys(this.shell.vaults)) {
            if (!this.state.keys[name]) delete this.shell.vaults[name];
        }

        this.#area.style.backgroundImage = '';
        this.state.hung = [];
        this.#showLogon([]);
    }

    #restore(records) {
        for (const record of records) {
            const app = APPS.find(app => app.id === record.app);

            if (!app) continue;

            app.restore?.(record.memory);

            const window = this.windows.open(app);

            window.user = { ...record.rect };
            window.maximized = record.maximized;
            window.minimized = record.minimized;
        }

        this.windows.layout();
    }

    #iconMenu(item, event) {
        const trash = this.shell.trash;
        const items = item.arg === RECYCLE_BIN
            ? [
                { label: 'Open', default: true, action: () => this.select(item) },
                { label: 'Explore', action: () => this.select(item) },
                null,
                { label: 'Empty Recycle Bin', disabled: !trash.items.length, action: () => emptyTrash(app => this.open(app), trash) },
                null,
                { label: 'Properties' },
            ]
            : [
                { label: 'Open', default: true, action: () => this.select(item) },
                null,
                { label: 'Cut' },
                { label: 'Copy' },
                null,
                { label: 'Create Shortcut' },
                { label: 'Delete' },
                { label: 'Rename' },
                null,
                { label: 'Properties' },
            ];

        showContextMenu(this.root, event.clientX, event.clientY, items);
    }

    open(app) {
        return this.windows.open(app);
    }

    select(item) {
        if (!item.app) return item.run?.(this.shell);
        if (item.arg !== undefined) item.app.open(item.arg);

        return this.open(item.app);
    }

    showArticle(url) {
        for (const window of [...this.windows.tasks]) this.windows.close(window);

        browser.open(url);

        const window = this.open(browser);

        window.maximized = true;
        this.windows.layout();
    }

    openLink(url) {
        browser.open(url);

        return this.open(browser);
    }

    destroy() {
        cancelSpies();
        this.#observer.disconnect();

        for (const window of [...this.windows.tasks]) this.windows.close(window);

        this.startMenu?.destroy();
        this.taskbar.destroy();
        this.shell.floppy.stop();
        this.root.remove();
    }
}
