const images = new Map();

export const loadImage = url => {
    if (!images.has(url)) {
        const image = new Image();
        image.src = url;
        images.set(
            url,
            image.decode().then(() => image),
        );
    }

    return images.get(url);
};
