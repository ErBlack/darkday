import { sites } from './sites.js';

export const localUrl = pathname => {
    const base = new URL('.', document.baseURI).pathname;
    const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
    const site = sites.find(site => site.root && relative.startsWith(`${site.root}/`));

    if (!site) return null;

    const path = relative.slice(site.root.length).replace(/\/index\.html$/, '/').replace(/\.html$/, '');

    return `https://${site.host}${path}`;
};
