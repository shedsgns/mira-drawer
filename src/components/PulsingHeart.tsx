import heartSource from '../../Icons/Heart.svg';

type PulsingHeartProps = {
  active: boolean;
};

const HEART_PATH =
  'M53.9996 16.3294C53.9064 10.0012 50.3236 3.76913 44.8112 1.20053C42.01 -0.104861 38.7612 -0.429977 35.3733 0.645451C32.5514 1.54117 29.7252 3.37697 27 6.26329C24.2747 3.37697 21.4485 1.54117 18.6266 0.645451C15.2387 -0.429977 11.9899 -0.104861 9.18856 1.20053C3.6764 3.76913 0.0937639 10.0012 0.000219941 16.3294L0 16.359C0 25.5889 5.48916 33.766 11.3025 39.5052C14.237 42.402 17.3346 44.76 20.0367 46.4064C21.3869 47.2288 22.6652 47.8904 23.7978 48.3524C24.8798 48.794 26.0087 49.1297 27 49.1297C27.9912 49.1297 29.1201 48.794 30.2021 48.3524C31.3347 47.8904 32.613 47.2288 33.9632 46.4064C36.6653 44.76 39.7628 42.402 42.6976 39.5052C48.5108 33.766 54 25.5889 54 16.359L53.9996 16.3294Z';

function HeartWave({ className }: { className: string }) {
  return (
    <svg
      className={`pulsing-heart__wave ${className}`}
      viewBox="0 0 54 49.13"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="pulsing-heart__wave-glow"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-edge"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-far"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-soft"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-mid"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-near"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--glint"
        d={HEART_PATH}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function PulsingHeart({ active }: PulsingHeartProps) {
  return (
    <div
      className="pulsing-heart"
      data-active={active}
      data-node-id="4658:56817"
      role="img"
      aria-label="Pulsing heart"
    >
      <span className="pulsing-heart__ambient" aria-hidden="true" />
      <span className="pulsing-heart__dust pulsing-heart__dust--near" aria-hidden="true" />
      <span className="pulsing-heart__dust pulsing-heart__dust--far" aria-hidden="true" />
      <HeartWave className="pulsing-heart__wave--early" />
      <HeartWave className="pulsing-heart__wave--late" />
      <span className="pulsing-heart__sparkle pulsing-heart__sparkle--one" aria-hidden="true" />
      <span className="pulsing-heart__sparkle pulsing-heart__sparkle--two" aria-hidden="true" />
      <span className="pulsing-heart__sparkle pulsing-heart__sparkle--three" aria-hidden="true" />
      <span className="pulsing-heart__core">
        <img
          className="pulsing-heart__image"
          src={heartSource}
          alt=""
          width="54"
          height="49.13"
          draggable={false}
        />
        <span className="pulsing-heart__glass-shell" aria-hidden="true" />
        <svg
          className="pulsing-heart__glass-rim"
          viewBox="0 0 54 49.13"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="heart-glass-rim" x1="9" y1="3" x2="45" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity="0.72" />
              <stop offset="0.42" stopColor="#fff" stopOpacity="0.12" />
              <stop offset="0.72" stopColor="#ffd9dd" stopOpacity="0.18" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.46" />
            </linearGradient>
          </defs>
          <path
            d={HEART_PATH}
            pathLength="1"
            vectorEffect="non-scaling-stroke"
            stroke="url(#heart-glass-rim)"
            strokeWidth="0.8"
          />
        </svg>
      </span>
    </div>
  );
}

export type { PulsingHeartProps };
