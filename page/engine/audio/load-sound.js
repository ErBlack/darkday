import { audioContext } from './audio-context.js';

const sounds = new Map();

export const loadSound = url => {
    if (!sounds.has(url)) {
        sounds.set(
            url,
            fetch(url)
                .then(response => response.arrayBuffer())
                .then(data => audioContext().decodeAudioData(data)),
        );
    }

    return sounds.get(url);
};
