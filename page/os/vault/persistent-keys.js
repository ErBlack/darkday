const PERSISTENT = ['ending'];

export const persistentKeys = keys => Object.fromEntries(Object.entries(keys).filter(([name]) => PERSISTENT.includes(name)));
