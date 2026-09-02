export const writeState = (key, state) => {
    try {
        localStorage.setItem(key, JSON.stringify(state));

        return true;
    } catch {
        return false;
    }
};
