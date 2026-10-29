const DESIGN_WIDTH = 1440;

const fit = () => {
    document.documentElement.style.zoom = innerWidth / DESIGN_WIDTH;
};

fit();
addEventListener('resize', fit);
