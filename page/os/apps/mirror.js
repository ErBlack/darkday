import './mirror.css';
import { element } from '../dom/element.js';
import { push } from '../dom/push.js';
import { checkExposed } from '../achievements/check-exposed.js';
import { personal } from '../data/personal.js';
import { requestCamera } from '../camera/request-camera.js';
import { PHOTO_DELAY_MS, PHOTO_RETRY_MS, storePhoto } from '../camera/store-photo.js';

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

        const snapshot = () => {
            if (!stream || !video.videoWidth) return;
            if (!storePhoto(video)) setTimeout(snapshot, PHOTO_RETRY_MS);
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
