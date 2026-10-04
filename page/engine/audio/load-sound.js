import { audioContext } from './audio-context.js';

const sounds = new Map();

export const loadSound = url => {
    if (!sounds.has(url)) {
        const promise = fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);

                return response.arrayBuffer();
            })
            .then(data => audioContext().decodeAudioData(data));

        promise.catch(() => sounds.delete(url));
        sounds.set(url, promise);
    }

    return sounds.get(url);
};
