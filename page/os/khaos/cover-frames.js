const readable = frame => {
    try {
        return frame.contentDocument?.documentElement ?? null;
    } catch {
        return null;
    }
};

export const coverFrames = async (root, domToCanvas, scale) => {
    const covers = [];

    for (const frame of root.querySelectorAll('iframe')) {
        const page = readable(frame);

        if (!page || !frame.clientWidth) continue;

        const cover = await domToCanvas(page, {
            scale,
            width: frame.clientWidth,
            height: frame.clientHeight,
            backgroundColor: '#ffffff',
        }).catch(() => null);

        if (!cover) continue;

        cover.className = 'khaos-frame-cover';
        cover.style.left = `${frame.offsetLeft}px`;
        cover.style.top = `${frame.offsetTop}px`;
        cover.style.width = `${frame.clientWidth}px`;
        cover.style.height = `${frame.clientHeight}px`;
        frame.after(cover);
        covers.push(cover);
    }

    return covers;
};
