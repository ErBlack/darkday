const google = url => {
    const embedded = new URL(url);
    embedded.searchParams.set('igu', '1');

    return embedded.href;
};

const googleTitle = url => {
    const query = url.searchParams.get('q');

    return query ? `${query} - Google Search` : 'Google';
};

export const sites = [
    { href: 'about:history', kind: 'history', title: 'History', favicon: 'assets/os/icons/history.png' },
    { href: 'about:blank', kind: 'blank', title: 'Blank Page', favicon: 'assets/os/icons/file.png' },
    { host: 'google.com', direct: true, embed: google, title: googleTitle },
    { host: 'civisvector.com', root: 'civis', title: 'Civis', favicon: 'civis/favicon.png' },
    { host: 'dnevnisignal.rs', vault: true, title: 'Dnevni Signal', favicon: 'assets/os/icons/file.png' },
];
