import { personal } from '../data/personal.js';

const PHOTO_WIDTH = 480;
const PHOTO_QUALITY = 0.8;
const PROBE_SIZE = 16;
const MIN_BRIGHTNESS = 16;

export const PHOTO_DELAY_MS = 1500;
export const PHOTO_RETRY_MS = 500;

const brightness = canvas => {
    const probe = document.createElement('canvas').getContext('2d');

    probe.canvas.width = PROBE_SIZE;
    probe.canvas.height = PROBE_SIZE;
    probe.drawImage(canvas, 0, 0, PROBE_SIZE, PROBE_SIZE);

    const { data } = probe.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE);
    let sum = 0;

    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;

    return sum / (data.length / 4);
};

export const storePhoto = video => {
    if (!video.videoWidth) return false;

    const scale = Math.min(1, PHOTO_WIDTH / video.videoWidth);
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    personal.photo = canvas.toDataURL('image/jpeg', PHOTO_QUALITY);

    return brightness(canvas) >= MIN_BRIGHTNESS;
};
