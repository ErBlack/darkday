const TIMEOUT_MS = 10000;
const MAX_AGE_MS = 600000;

export const requestPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported'));

    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: TIMEOUT_MS, maximumAge: MAX_AGE_MS });
});
