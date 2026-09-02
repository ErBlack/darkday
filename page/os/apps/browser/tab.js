import { element } from '../../dom/element.js';
import { icon } from '../../dom/icon.js';
import { resolveSite } from './resolve-site.js';

export class Tab {
    #onChange;
    #onNavigate;
    #onLoad;
    #renderPage;

    urls = [];
    index = -1;
    title = '';
    loading = false;
    frame = null;
    favicons = [];

    constructor(tabBar, before, views, { onChange, onSelect, onClose, onNavigate, onLoad, renderPage }) {
        this.#onChange = onChange;
        this.#onNavigate = onNavigate;
        this.#onLoad = onLoad;
        this.#renderPage = renderPage;

        this.button = element('div', 'browser-tab');
        tabBar.insertBefore(this.button, before);
        this.favicon = icon('', 'browser-tab-favicon', this.button);
        this.favicon.addEventListener('error', () => {
            const next = this.favicons.indexOf(this.favicon.getAttribute('src')) + 1;

            if (next > 0 && next < this.favicons.length) this.favicon.src = this.favicons[next];
        });
        this.label = element('span', 'browser-tab-label', this.button);
        const close = element('button', 'browser-tab-close', this.button);
        close.type = 'button';
        close.title = 'Close Tab';

        this.view = element('div', 'browser-view', views);
        this.#createFrame();
        this.page = element('div', 'browser-page', this.view);

        this.button.addEventListener('click', event => (event.target === close ? onClose(this) : onSelect(this)));
        this.button.addEventListener('auxclick', event => {
            if (event.button === 1) onClose(this);
        });
        this.button.addEventListener('pointerdown', event => {
            if (event.button === 1) event.preventDefault();
        });
    }

    get url() {
        return this.urls[this.index] ?? '';
    }

    get canGoBack() {
        return this.index > 0;
    }

    get canGoForward() {
        return this.index < this.urls.length - 1;
    }

    get frameWindow() {
        return this.frame.contentWindow;
    }

    #createFrame() {
        const frame = element('iframe', 'browser-frame');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
        frame.addEventListener('load', () => {
            if (frame.dataset.wrapped !== 'true') this.setLoading(false);

            try {
                const { pathname } = frame.contentWindow.location;

                if (pathname !== new URL(frame.dataset.src, document.baseURI).pathname) this.#onNavigate(this, pathname);

                const title = frame.contentDocument?.title;

                if (title) this.setTitle(title);
            } catch {
                return;
            }

            this.#onLoad?.(this);
        });
        if (this.frame) this.frame.replaceWith(frame);
        else this.view.append(frame);

        this.frame = frame;

        return frame;
    }

    setTitle(title) {
        this.title = title;
        this.label.textContent = title;
        this.button.title = title;
        this.#onChange(this);
    }

    setLoading(loading) {
        this.loading = loading;
        this.button.classList.toggle('browser-tab-loading', loading);
        this.#onChange(this);
    }

    setActive(active) {
        this.button.classList.toggle('browser-tab-active', active);
        this.view.hidden = !active;
    }

    render(resolved) {
        this.favicons = resolved.favicon;
        this.favicon.src = this.favicons[0];
        this.frame.style.display = resolved.kind === 'frame' ? '' : 'none';
        this.page.style.display = resolved.kind === 'frame' ? 'none' : '';
        this.setTitle(resolved.title);

        if (resolved.kind === 'frame') {
            if (this.frame.dataset.src !== resolved.src) {
                this.frame.dataset.src = resolved.src;
                this.frame.dataset.wrapped = String(resolved.wrapped);
                this.frame.src = resolved.src;
                this.setLoading(true);
            }

            return;
        }

        this.setLoading(false);
        this.#renderPage(resolved, this);
    }

    show() {
        if (this.index < 0) return;

        this.render(resolveSite(this.url));
    }

    navigate(url) {
        if (this.url === url) return this.reload();

        this.urls = [...this.urls.slice(0, this.index + 1), url];
        this.index = this.urls.length - 1;
        this.show();
    }

    follow(url) {
        this.urls = [...this.urls.slice(0, this.index + 1), url];
        this.index = this.urls.length - 1;
        this.frame.dataset.src = resolveSite(url).src;
        this.show();
    }

    step(delta) {
        const index = this.index + delta;

        if (index < 0 || index >= this.urls.length) return;

        this.index = index;
        this.show();
    }

    reload() {
        if (this.loading) return;

        delete this.frame.dataset.src;
        this.show();
    }

    stop() {
        if (!this.loading) return;

        const display = this.frame.style.display;
        this.#createFrame().style.display = display;
        this.setLoading(false);
    }

    fail() {
        delete this.frame.dataset.src;
        this.render({ ...resolveSite(this.url), kind: 'unsupported' });
    }

    remove() {
        this.button.remove();
        this.view.remove();
    }
}
