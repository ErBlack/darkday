const isObject = value => value !== null && typeof value === 'object';

export const observe = (target, onChange) => {
    const proxies = new WeakMap();
    const raws = new WeakMap();

    const wrap = object => {
        if (!isObject(object) || raws.has(object)) return object;

        let proxy = proxies.get(object);

        if (proxy) return proxy;

        proxy = new Proxy(object, {
            get: (obj, key) => wrap(Reflect.get(obj, key)),
            set: (obj, key, value) => {
                const done = Reflect.set(obj, key, raws.get(value) ?? value);

                onChange();

                return done;
            },
            deleteProperty: (obj, key) => {
                const done = Reflect.deleteProperty(obj, key);

                onChange();

                return done;
            },
        });
        proxies.set(object, proxy);
        raws.set(proxy, object);

        return proxy;
    };

    return wrap(target);
};
