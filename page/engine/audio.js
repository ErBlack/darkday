let context;

export const unlock = () => {
    context ??= new AudioContext();

    return context.resume();
};
