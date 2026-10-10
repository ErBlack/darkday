import './browser.css';
import { element } from '../../dom/element.js';
import { push } from '../../dom/push.js';
import { toolButton } from '../../dom/tool-button.js';
import { History } from './history.js';
import { Tab } from './tab.js';
import { toUrl } from './to-url.js';
import { HOME_URL } from './home-url.js';
import { browserShortcut } from './shortcuts.js';
import { renderHistoryPage } from './pages/history-page.js';
import { renderUnsupportedPage } from './pages/unsupported-page.js';
import { localUrl } from './local-url.js';
import { pickFile } from './pick-file.js';
import { renderKhaosPage } from './pages/khaos-page.js';
import { playSystemSound } from '../../audio/play-system-sound.js';

const ERROR_SOUND = 'assets/sounds/error.mp3';
const BLOCKED = ['pointerdown', 'click', 'dblclick', 'contextmenu', 'keydown'];

const CIVIS_HOST = 'civisvector.com';

const isCivis = url => URL.canParse(url) && new URL(url).hostname.replace(/^www\./, '') === CIVIS_HOST;

const playError = () =>playSystemSound(ERROR_SOUND, { volume: 0.6 }).catch(() => {});

let navigate = null;
let pending = null;

export const browser = {
    id: 'browser',
    title: 'Browser',
    icon: 'assets/os/icons/browser.png',
    single: true,
    size: { w: 900, h: 620 },
    usage: { memory: [14000, 28000], cpu: [0, 6] },
    open(text) {
        const url = toUrl(text);

        if (navigate) navigate(url);
        else pending = url;
    },
    mount(content, win, shell) {
        const history = new History(shell.state);

        content.classList.add('os-pane', 'browser');

        const toolbar = element('div', 'os-toolbar', content);
        const back = toolButton('Back', 'os-tool-back', toolbar);
        const forward = toolButton('Forward', 'os-tool-forward', toolbar);
        const refresh = toolButton('Refresh', 'browser-refresh', toolbar);
        const home = toolButton('Home', 'browser-home', toolbar);
        const historyButton = toolButton('History', 'browser-history', toolbar);

        const addressRow = element('label', 'browser-address', content);
        addressRow.append('Address');
        const address = element('input', 'os-input', addressRow);
        address.spellcheck = false;
        const go = push('Go', addressRow);

        const tabBar = element('div', 'browser-tabs', content);
        const newTab = element('button', 'browser-tab-new', tabBar);
        newTab.type = 'button';
        newTab.title = 'New Tab';

        const views = element('div', 'browser-views', content);

        const statusBar = element('div', 'browser-status', content);
        const statusText = element('span', 'os-status browser-status-text', statusBar);
        element('span', 'os-status browser-status-zone', statusBar).textContent = 'Internet';

        let tabs = [];
        let active = null;
        let hovered = null;
        let hung = false;

        const memory = shell.appState('browser', { tabs: [], active: 0 });
        const civis = shell.appState('civis', { uploaded: false });
        let login = Promise.resolve();

        const remember = () => {
            memory.tabs = tabs.map(tab => ({ urls: [...tab.urls], index: tab.index }));
            memory.active = Math.max(0, tabs.indexOf(active));
        };

        const updateChrome = () => {
            remember();

            if (document.activeElement !== address) address.value = active.url;

            back.disabled = !active.canGoBack;
            forward.disabled = !active.canGoForward;
            refresh.lastChild.textContent = active.loading ? 'Stop' : 'Refresh';
            refresh.firstChild.className = `os-tool-icon ${active.loading ? 'browser-stop' : 'browser-refresh'}`;
            statusText.textContent = hovered ?? (active.loading ? `Opening page ${active.url}...` : 'Done');
            win.setTitle(`${active.title} - Browser`);
        };

        const onHover = href => {
            hovered = href;
            updateChrome();
        };

        const renderPage = (resolved, tab) => {
            if (resolved.kind === 'history') renderHistoryPage(tab.page, history.entries, { onOpen: url => visit(tab, url), onHover });
            else if (resolved.kind === 'unsupported') renderUnsupportedPage(tab.page, resolved.href);
            else tab.page.replaceChildren();
        };

        const activate = tab => {
            active = tab;
            for (const other of tabs) other.setActive(other === tab);
            tab.show();
            updateChrome();
        };

        const closeTab = tab => {
            tabs = tabs.filter(other => other !== tab);
            tab.remove();

            if (tabs.length === 0) return win.close();
            if (tab === active) activate(tabs.at(-1));

            remember();
        };

        const restoreTabs = () => {
            for (const saved of memory.tabs) {
                const tab = createTab();

                tab.urls = [...saved.urls];
                tab.index = saved.index;
            }

            activate(tabs[Math.min(memory.active, tabs.length - 1)]);
        };

        const visit = (tab, url) => {
            tab.navigate(url);
            history.visit(url, tab.title);
        };

        const followed = (tab, pathname) => {
            const url = localUrl(pathname);

            if (!url || url === tab.url) return;

            tab.follow(url);
            history.visit(url, tab.title);
        };

        const createTab = () => {
            const tab = new Tab(tabBar, newTab, views, {
                onChange: changed => changed === active && updateChrome(),
                onSelect: activate,
                onClose: closeTab,
                onNavigate: followed,
                onLoad: loaded => loaded === active && isCivis(loaded.url) && spring(),
                renderPage,
            });

            tabs.push(tab);

            return tab;
        };

        const openTab = url => {
            const tab = createTab();

            activate(tab);
            visit(tab, url);
        };

        const focusAddress = () => {
            address.focus();
            address.select();
        };

        const submit = () => {
            if (!address.value.trim()) return;

            visit(active, toUrl(address.value));
            address.blur();
        };

        const switchTab = delta => activate(tabs[(tabs.indexOf(active) + delta + tabs.length) % tabs.length]);

        const solve = async password => {
            const solved = await shell.khaos.solve(password);

            if (!solved) playError();

            return solved;
        };

        const hang = () => {
            if (hung) return;

            hung = true;
            win.locked = true;
            win.root.classList.add('browser-hung');
            address.value = active.url;
            renderKhaosPage(views, solve);
        };

        const userTab = url => {
            if (!hung) openTab(url);
        };

        const spring = () => {
            if (!hung && shell.khaos.trigger()) shell.khaos.attack(hang);
        };

        const block = event => {
            if (!hung || event.target.closest('.browser-khaos-form')) return;

            event.preventDefault();
            event.stopPropagation();

            if (event.type === 'pointerdown') playError();
        };

        for (const type of BLOCKED) win.root.addEventListener(type, block, true);

        const actions = {
            newTab: () => userTab(HOME_URL),
            closeTab: () => closeTab(active),
            focusAddress,
            reload: () => active.reload(),
            back: () => active.step(-1),
            forward: () => active.step(1),
            nextTab: () => switchTab(1),
            previousTab: () => switchTab(-1),
            stop: () => active.stop(),
        };

        win.root.addEventListener('keydown', event => {
            const action = browserShortcut(event);

            if (hung || !action || (action === 'stop' && event.target === address)) return;

            event.preventDefault();
            actions[action]();
        });

        back.addEventListener('click', actions.back);
        forward.addEventListener('click', actions.forward);
        refresh.addEventListener('click', () => (active.loading ? actions.stop() : actions.reload()));
        home.addEventListener('click', () => visit(active, HOME_URL));
        historyButton.addEventListener('click', () => userTab('about:history'));
        newTab.addEventListener('click', actions.newTab);
        go.addEventListener('click', submit);
        address.addEventListener('keydown', event => {
            if (event.key === 'Enter') submit();
            if (event.key === 'Escape') {
                address.value = active.url;
                address.blur();
            }
        });
        address.addEventListener('focus', () => address.select());

        const onBlocked = (tab, origin) => {
            if (!tab || !origin.startsWith('http')) return;
            if (tab.url && new URL(tab.url).origin === origin) return tab.fail();

            visit(tab, `${origin}/`);
        };

        const onViolation = event => {
            if (event.effectiveDirective === 'frame-src') onBlocked(active, event.blockedURI);
        };

        const onMessage = event => {
            if (event.origin !== location.origin) return;

            const tab = tabs.find(tab => tab.frameWindow === event.source);

            if (!tab) return;
            if (event.data?.type === 'frame-blocked') onBlocked(tab, event.data.origin);
            if (event.data?.type === 'frame-loaded') tab.setLoading(false);
            if (event.data?.type === 'frame-failed') tab.fail();
            if (event.data?.type === 'payload-crash') playError();
            if (event.data?.type === 'payload-run') shell.ending('good');
            if (event.data?.type === 'civis-password') {
                shell.khaos.arm();
                spring();
            }
            if (event.data?.type === 'civis-login') login = shell.openVault('ending', event.data.password).catch(() => {});
            if (event.data?.type === 'civis-logout') {
                delete shell.state.keys.ending;
                delete shell.vaults.ending;
            }
            if (event.data?.type === 'civis-uploaded') civis.uploaded = true;
            if (event.data?.type === 'civis-state') {
                login.then(() => {
                    const session = Boolean(shell.state.keys.ending);

                    tab.frameWindow?.postMessage({ type: 'civis-state', session, uploaded: civis.uploaded }, location.origin);
                });
            }
            if (event.data?.type === 'pick-file') {
                pickFile(win, shell, name => tab.frameWindow?.postMessage({ type: 'file-picked', name }, location.origin));
            }
        };

        document.addEventListener('securitypolicyviolation', onViolation);
        globalThis.addEventListener('message', onMessage);
        navigate = userTab;
        win.onClose = () => {
            document.removeEventListener('securitypolicyviolation', onViolation);
            globalThis.removeEventListener('message', onMessage);
            navigate = null;
            memory.tabs = [];
            memory.active = 0;
            shell.khaos.check();
        };

        if (memory.tabs.length) restoreTabs();
        if (pending || !tabs.length) openTab(pending ?? HOME_URL);

        pending = null;

        if (shell.khaos.active) hang();
    },
};
