import { requestCamera } from './request-camera.js';
import { PHOTO_DELAY_MS, PHOTO_RETRY_MS, storePhoto } from './store-photo.js';
import { checkExposed } from '../achievements/check-exposed.js';
import { personal } from '../data/personal.js';

const ATTEMPTS = 10;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const takePhoto = async achievements => {
    const stream = await requestCamera();

    checkExposed(achievements, { camera: true, location: Boolean(personal.location) });

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    try {
        await video.play();
        await wait(PHOTO_DELAY_MS);

        for (let i = 0; i < ATTEMPTS && !storePhoto(video); i++) await wait(PHOTO_RETRY_MS);
    } finally {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
};
