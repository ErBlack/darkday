let context = null;

export const audioContext = () => (context ??= new AudioContext());
