import './mirror.css';
import { element } from '../dom/element.js';
import { push } from '../dom/push.js';
import { checkExposed } from '../achievements/check-exposed.js';
import { personal } from '../data/personal.js';

const TIMEOUT_MS = 10000;
const PHOTO_WIDTH = 480;
const PHOTO_QUALITY = 0.8;
const PHOTO_DELAY_MS = 1500;
const PHOTO_RETRY_MS = 500;
const PROBE_SIZE = 16;
const MIN_BRIGHTNESS = 16;

const REASONS = {
    NotAllowedError: 'Camera access was not granted. Press Retry and allow access.',
    NotFoundError: 'No camera was found on this computer.',
    NotReadableError: 'The camera is in use by another application.',
    TimeoutError: 'The camera is not responding.',
};
const BLOCKED = 'Camera access is blocked. Allow the camera in the address bar of your browser, then press Retry.';

const permissionState = async () => {
    try {
        return (await navigator.permissions.query({ name: 'camera' })).state;
    } catch {
        return 'prompt';
    }
};

const reasonOf = async error => {
    if (error.name === 'NotAllowedError' && (await permissionState()) === 'denied') return BLOCKED;

    return REASONS[error.name] ?? 'The camera could not be started.';
};

const withTimeout = promise => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DOMException('timeout', 'TimeoutError')), TIMEOUT_MS);

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
});

const requestCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) return Promise.reject(new DOMException('unsupported', 'NotFoundError'));

    return withTimeout(navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
};

export const mirror = {
    id: 'mirror',
    title: 'Mirror',
    icon: 'assets/os/icons/mirror.png',
    single: true,
    size: { w: 520, h: 420 },
    usage: { memory: [9000, 14000], cpu: [3, 9] },
    mount(content, win, { achievements }) {
        content.classList.add('os-pane', 'mirror');

        const view = element('div', 'mirror-view', content);
        const video = element('video', 'mirror-video', view);
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        const message = element('div', 'mirror-message', view);
        element('h1', '', message).textContent = 'Mirror cannot display the camera';
        const reason = element('p', '', message);
        const retry = push('Retry', message);

        const status = element('div', 'os-status', content);

        let stream = null;

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

        const snapshot = () => {
            if (!stream || !video.videoWidth) return;

            const scale = Math.min(1, PHOTO_WIDTH / video.videoWidth);
            const canvas = document.createElement('canvas');

            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            personal.photo = canvas.toDataURL('image/jpeg', PHOTO_QUALITY);

            if (brightness(canvas) < MIN_BRIGHTNESS) setTimeout(snapshot, PHOTO_RETRY_MS);
        };

        video.addEventListener('playing', () => setTimeout(snapshot, PHOTO_DELAY_MS));

        const stop = () => {
            stream?.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        };

        const fail = async error => {
            reason.textContent = await reasonOf(error);
            view.classList.add('mirror-view-broken');
            status.textContent = 'Status: Not working';
        };

        const request = async () => {
            stop();
            view.classList.remove('mirror-view-broken');
            status.textContent = 'Status: Starting...';

            try {
                const media = await requestCamera();

                if (win.closed) return media.getTracks().forEach(track => track.stop());

                stream = media;
                video.srcObject = media;
                status.textContent = 'Status: Working';
                checkExposed(achievements, { camera: true, location: Boolean(personal.location) });
            } catch (error) {
                await fail(error);
            }
        };

        retry.addEventListener('click', request);
        win.onClose = stop;
        request();
    },
};
