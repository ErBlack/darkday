import { sites } from './sites.js';
import { vaultPages } from './vault-pages.js';

const PAGE_ICON = 'assets/os/icons/file.png';

const matches = (url, site) => {
    if (site.href) return site.href === url.href;

    const host = url.hostname.replace(/^www\./, '');

    return host === site.host || (site.subdomains && host.endsWith(`.${site.host}`));
};

const titleOf = (site, url) => (typeof site?.title === 'function' ? site.title(url) : site?.title ?? url.host);

const faviconsOf = (site, url) => {
    if (site?.favicon) return [site.favicon];

    return [`https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`, `${url.origin}/favicon.ico`, PAGE_ICON];
};

const wrapped = href => `frame.html?url=${encodeURIComponent(href)}`;

const localPage = pathname => (pathname === '/' ? '/index.html' : `${pathname.replace(/\/$/, '')}.html`);

export const resolveSite = href => {
    const url = new URL(href);
    const site = sites.find(site => matches(url, site));
    const base = { href, title: titleOf(site, url), favicon: faviconsOf(site, url) };

    if (site?.kind) return { ...base, kind: site.kind };

    if (site?.vault) {
        const page = vaultPages.get(`${site.host}${url.pathname.replace(/\/$/, '')}`);

        return page ? { ...base, kind: 'frame', src: page, wrapped: false } : { ...base, kind: 'unsupported' };
    }

    if (site?.root) return { ...base, kind: 'frame', src: `${site.root}${localPage(url.pathname)}`, wrapped: false };

    const target = site?.embed ? site.embed(url) : url.href;

    return { ...base, kind: 'frame', src: site?.direct ? target : wrapped(target), wrapped: !site?.direct };
};
