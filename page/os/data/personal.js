const KEY = 'darkdayPersonal';

const read = () => {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? {};
    } catch {
        return {};
    }
};

const data = read();

const save = () => {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
};

export const personal = {
    get photo() {
        return data.photo ?? null;
    },
    set photo(value) {
        data.photo = value;
        save();
    },
    get location() {
        return data.location ?? null;
    },
    set location(value) {
        data.location = value;
        save();
    },
};
