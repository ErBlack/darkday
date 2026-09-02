import { vaultPages } from './vault-pages.js';

const REFERENCE = /(src|href)="(?:\.\.\/)?(?:img\/)?([\w.-]+)"/g;

const build = async (vault, file) => {
    const html = await (await fetch(vault.url(file))).text();
    const linked = html.replace(REFERENCE, (match, attribute, name) => (vault.has(name) ? `${attribute}="${vault.url(name)}"` : match));

    return URL.createObjectURL(new Blob([linked], { type: 'text/html' }));
};

export const registerVaultPages = async vault => {
    for (const [address, file] of Object.entries(vault.data.ending?.pages ?? {})) {
        if (!vaultPages.has(address)) vaultPages.set(address, await build(vault, file));
    }
};
