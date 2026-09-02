const search = (time, query) => ({
    time,
    url: `https://www.google.com/search?q=${encodeURIComponent(query).replace(/%20/g, '+')}`,
    title: `${query} - Google Search`,
});

const page = (time, url, title) => ({ time, url, title });

export const storyHistory = [
    search('2026-09-10T19:48', 'shai-hulud'),
    search('2026-09-13T21:32', 'usb flash drive asks for password'),
    search('2026-09-14T19:52', 'shai-hulud npm worm'),
    search('2026-09-20T21:41', 'laptop camera light turns on by itself'),
    search('2026-09-20T21:47', 'laptop wakes up by itself at night'),
    search('2026-09-28T23:50', 'cryptool'),
];
