const TILE = 256;

const fitGrain = () => {
    const dpr = devicePixelRatio || 1;
    const size = (TILE * Math.max(1, Math.round(dpr))) / dpr;

    document.documentElement.style.setProperty('--grain-size', `${size}px`);
};

fitGrain();
addEventListener('resize', fitGrain);
