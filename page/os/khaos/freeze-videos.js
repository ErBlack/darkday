export const freezeVideos = root => {
    const live = [...root.querySelectorAll('video')].filter(video => video.srcObject);

    for (const video of live) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1;
        canvas.height = video.videoHeight || 1;

        if (video.videoWidth) canvas.getContext('2d').drawImage(video, 0, 0);

        video.poster = canvas.toDataURL('image/jpeg');
    }

    return () => {
        for (const video of live) video.removeAttribute('poster');
    };
};
