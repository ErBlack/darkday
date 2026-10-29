export const granted = async name => {
    try {
        return (await navigator.permissions.query({ name })).state === 'granted';
    } catch {
        return null;
    }
};
