const granted = async name => {
    try {
        return (await navigator.permissions.query({ name })).state === 'granted';
    } catch {
        return null;
    }
};

export const checkExposed = async (achievements, known) => {
    const [camera, location] = await Promise.all([granted('camera'), granted('geolocation')]);

    if ((camera ?? known.camera) && (location ?? known.location)) achievements.unlock('exposed');
};
