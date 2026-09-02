const TIMEOUT_MS = 10000;

const withTimeout = promise => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DOMException('timeout', 'TimeoutError')), TIMEOUT_MS);

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
});

export const requestCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) return Promise.reject(new DOMException('unsupported', 'NotFoundError'));

    return withTimeout(navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
};
