import { loadSound } from '../../engine/audio/load-sound.js';
import { playSystemSound } from '../audio/play-system-sound.js';

const EFFECTS = [
    { name: 'flicker', rate: 12, chance: value => value, amount: () => 1, count: () => 1 },
    { name: 'tear', rate: 8, chance: value => Math.min(1, value * 2), amount: value => value * 0.6, count: value => 1 + Math.round(value * 4) },
    { name: 'blocks', rate: 10, chance: value => Math.min(1, value * 2), amount: value => value * 0.5, count: value => 1 + Math.round(value * 4) },
];

const pick = list => list[Math.floor(Math.random() * list.length)];

const load = async urls => {
    const buffers = await Promise.all(urls.map(url => loadSound(url).catch(() => null)));

    return urls.map((url, index) => ({ url, ms: (buffers[index]?.duration ?? 0) * 1000 })).filter(sound => sound.ms);
};

export const createGlitchSlots = async ({ short, long, volume, voices, longFrom }) => {
    const shorts = await load(short);
    const longs = await load(long);
    const slots = Object.fromEntries(EFFECTS.map(effect => [effect.name, { index: -1, on: 0, seed: 0, amount: 0 }]));
    let playing = [];
    let longUntil = 0;

    const play = (value, now, heavy) => {
        playing = playing.filter(end => end > now);

        if (playing.length >= voices) return;

        const useLong = heavy && value >= longFrom && longs.length && now >= longUntil;
        const sound = useLong ? pick(longs) : pick(shorts);

        if (!sound) return;
        if (useLong) longUntil = now + sound.ms;

        playing.push(now + sound.ms);
        playSystemSound(sound.url, { volume: volume * (0.1 + value * 0.9) }).catch(() => {});
    };

    let slamUntil = -1;

    const slam = (now, ms) => {
        slamUntil = now + ms;

        const sound = pick(longs) ?? pick(shorts);

        if (sound) playSystemSound(sound.url, { volume }).catch(() => {});
        for (let i = 0; i < 2; i += 1) play(1, now, false);
    };

    const update = (params, now) => {
        if (now < slamUntil) {
            for (const effect of EFFECTS) {
                const slot = slots[effect.name];

                slot.on = 1;
                slot.seed = Math.random() * 1000;
                slot.amount = effect.amount(1);
            }

            return slots;
        }

        for (const effect of EFFECTS) {
            const slot = slots[effect.name];
            const index = Math.floor(now / 1000 * effect.rate);

            if (index === slot.index) continue;

            const value = params[effect.name];

            slot.index = index;
            slot.on = value > 0 && Math.random() < effect.chance(value) ? 1 : 0;
            slot.seed = Math.random() * 1000;
            slot.amount = effect.amount(value);

            if (!slot.on) continue;

            for (let i = 0; i < effect.count(value); i += 1) play(value, now, effect.name === 'tear');
        }

        return slots;
    };

    return { update, slam };
};
