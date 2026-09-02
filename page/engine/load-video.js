const videos = new Map();

export const loadVideo = url => {
    if (!videos.has(url)) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.load();

        videos.set(
            url,
            new Promise((resolve, reject) => {
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return resolve(video);

                video.addEventListener('loadeddata', () => resolve(video), { once: true });
                video.addEventListener('error', () => reject(video.error), { once: true });
            }),
        );
    }

    return videos.get(url);
};
