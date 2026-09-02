const SEARCH = 'https://www.google.com/search?q=';

export const toUrl = text => {
    const input = text.trim();

    try {
        if (/^about:/i.test(input)) return input.toLowerCase();
        if (/^https?:\/\//i.test(input)) return new URL(input).href;
        if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(input)) return new URL(`https://${input}`).href;
    } catch {
        return `${SEARCH}${encodeURIComponent(input)}`;
    }

    return `${SEARCH}${encodeURIComponent(input)}`;
};
