const PROBE =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAcAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAAIAAAACAAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAkbWRhdAoKAgAABUi/Gr5AEDIOEADcAPPHnhAAEAG5dk0=';

let avif = false;
let detecting = null;

export const detectRaster = () => {
    if (!detecting) {
        const image = new Image();
        image.src = PROBE;
        detecting = image.decode().then(
            () => {
                avif = true;
            },
            () => {},
        );
    }

    return detecting;
};

export const raster = (base, fallback) => `${base}.${avif ? 'avif' : fallback}`;
