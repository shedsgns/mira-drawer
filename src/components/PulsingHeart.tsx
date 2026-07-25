import { useEffect, useRef } from 'react';

type PulsingHeartProps = {
  active: boolean;
};

const HEARTBEAT_CYCLE_MS = 2800;
const SHEEN_CYCLE_MS = HEARTBEAT_CYCLE_MS * 3;
const SHEEN_LAYER_OFFSETS = [0, -2.2, -4.4, -6.6, -8.8];

const HEART_PATH =
  'M53.9996 16.3294C53.9064 10.0012 50.3236 3.76913 44.8112 1.20053C42.01 -0.104861 38.7612 -0.429977 35.3733 0.645451C32.5514 1.54117 29.7252 3.37697 27 6.26329C24.2747 3.37697 21.4485 1.54117 18.6266 0.645451C15.2387 -0.429977 11.9899 -0.104861 9.18856 1.20053C3.6764 3.76913 0.0937639 10.0012 0.000219941 16.3294L0 16.359C0 25.5889 5.48916 33.766 11.3025 39.5052C14.237 42.402 17.3346 44.76 20.0367 46.4064C21.3869 47.2288 22.6652 47.8904 23.7978 48.3524C24.8798 48.794 26.0087 49.1297 27 49.1297C27.9912 49.1297 29.1201 48.794 30.2021 48.3524C31.3347 47.8904 32.613 47.2288 33.9632 46.4064C36.6653 44.76 39.7628 42.402 42.6976 39.5052C48.5108 33.766 54 25.5889 54 16.359L53.9996 16.3294Z';

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - clamp01(progress), 3);
}

function easeInOutCubic(progress: number) {
  const clamped = clamp01(progress);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function segmentProgress(phase: number, start: number, end: number) {
  return clamp01((phase - start) / (end - start));
}

function heartbeatTrack(
  phase: number,
  resting: number,
  firstBeat: number,
  valley: number,
  secondBeat: number,
) {
  if (phase <= 0.06) {
    return lerp(resting, firstBeat, easeOutCubic(segmentProgress(phase, 0, 0.06)));
  }

  if (phase <= 0.12) {
    return lerp(firstBeat, valley, easeInOutCubic(segmentProgress(phase, 0.06, 0.12)));
  }

  if (phase <= 0.18) {
    return lerp(valley, secondBeat, easeOutCubic(segmentProgress(phase, 0.12, 0.18)));
  }

  if (phase <= 0.27) {
    return lerp(secondBeat, resting, easeInOutCubic(segmentProgress(phase, 0.18, 0.27)));
  }

  return resting;
}

function waveScale(phase: number, start: number, finalScale: number) {
  const peak = start + 0.06;

  if (phase <= start) {
    return 0.96;
  }

  if (phase <= peak) {
    return lerp(0.96, 1.08, easeOutCubic(segmentProgress(phase, start, peak)));
  }

  return lerp(1.08, finalScale, easeOutCubic(segmentProgress(phase, peak, 1)));
}

function waveOpacity(phase: number, start: number, peakOpacity: number) {
  const peak = start + 0.06;

  if (phase <= start) {
    return 0;
  }

  if (phase <= peak) {
    return lerp(0, peakOpacity, easeOutCubic(segmentProgress(phase, start, peak)));
  }

  return lerp(peakOpacity, 0, easeOutCubic(segmentProgress(phase, peak, 1)));
}

function HeartWave({ className }: { className: string }) {
  return (
    <span className={`pulsing-heart__wave ${className}`} aria-hidden="true">
      <svg className="pulsing-heart__wave-svg" viewBox="0 0 54 49.13" fill="none">
        <path
          className="pulsing-heart__wave-glow"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-edge"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-far"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-soft"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-mid"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--tail-near"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="pulsing-heart__wave-sheen pulsing-heart__wave-sheen--glint"
          d={HEART_PATH}
          pathLength="100"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

export function PulsingHeart({ active }: PulsingHeartProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const ambient = root.querySelector<HTMLElement>('.pulsing-heart__ambient');
    const primaryWave = root.querySelector<HTMLElement>('.pulsing-heart__wave--early');
    const secondaryWave = root.querySelector<HTMLElement>('.pulsing-heart__wave--late');
    const core = root.querySelector<HTMLElement>('.pulsing-heart__core');
    const glassLayers = root.querySelectorAll<SVGPathElement>('.pulsing-heart__glass-layer');
    const rim = root.querySelector<SVGPathElement>('.pulsing-heart__rim-path');
    const primarySheens = root.querySelectorAll<SVGPathElement>(
      '.pulsing-heart__wave--early .pulsing-heart__wave-sheen',
    );
    const secondarySheens = root.querySelectorAll<SVGPathElement>(
      '.pulsing-heart__wave--late .pulsing-heart__wave-sheen',
    );

    if (!ambient || !primaryWave || !secondaryWave || !core || !rim) {
      return;
    }

    let animationFrame = 0;
    let elapsedBeforePause = 0;
    let startTime = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // One phase drives every composited layer so WebKit cannot start the SVG
    // sheen, expanding waves, and core heartbeat on separate timelines.
    const applyFrame = (elapsed: number) => {
      const phase = (elapsed % HEARTBEAT_CYCLE_MS) / HEARTBEAT_CYCLE_MS;
      const coreScale = heartbeatTrack(phase, 1, 1.075, 0.995, 1.035);
      const ambientScale = heartbeatTrack(phase, 0.94, 1.13, 0.98, 1.07);
      const ambientOpacity = heartbeatTrack(phase, 0.52, 0.86, 0.58, 0.72);
      const glassOpacity = heartbeatTrack(phase, 0.3, 0.56, 0.34, 0.45);
      const rimOpacity = heartbeatTrack(phase, 0.42, 0.76, 0.48, 0.62);
      const primaryScale = waveScale(phase, 0, 2.08);
      const secondaryScale = waveScale(phase, 0.12, 1.84);
      const primaryOpacity = waveOpacity(phase, 0, 0.62);
      const secondaryOpacity = waveOpacity(phase, 0.12, 0.5);
      const sheenOffset = -((elapsed % SHEEN_CYCLE_MS) / SHEEN_CYCLE_MS) * 100;

      core.style.transform = `translate3d(0, 0, 0) scale(${coreScale})`;
      ambient.style.transform = `translate3d(0, 0, 0) scale(${ambientScale})`;
      ambient.style.opacity = String(ambientOpacity);
      primaryWave.style.transform = `translate3d(0, 0, 0) scale(${primaryScale})`;
      primaryWave.style.opacity = String(primaryOpacity);
      secondaryWave.style.transform = `translate3d(0, 0, 0) scale(${secondaryScale})`;
      secondaryWave.style.opacity = String(secondaryOpacity);
      glassLayers.forEach((layer) => {
        layer.style.opacity = String(glassOpacity);
      });
      rim.style.opacity = String(rimOpacity);
      primarySheens.forEach((sheen, index) => {
        sheen.style.strokeDashoffset = String(sheenOffset + SHEEN_LAYER_OFFSETS[index]);
      });
      secondarySheens.forEach((sheen, index) => {
        sheen.style.strokeDashoffset = String(
          sheenOffset - 100 / 3 + SHEEN_LAYER_OFFSETS[index],
        );
      });
    };

    const render = (now: number) => {
      const elapsed = now - startTime;
      elapsedBeforePause = elapsed;
      applyFrame(elapsed);
      animationFrame = requestAnimationFrame(render);
    };

    const stop = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const start = (restart = false) => {
      stop();

      if (restart) {
        elapsedBeforePause = 0;
      }

      startTime = performance.now() - elapsedBeforePause;
      applyFrame(elapsedBeforePause);

      if (active && !document.hidden && !reducedMotion.matches) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }

      start();
    };

    const handleReducedMotionChange = () => {
      if (reducedMotion.matches) {
        stop();
        applyFrame(0);
        return;
      }

      start(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.addEventListener('change', handleReducedMotionChange);

    if (active && !reducedMotion.matches) {
      start(true);
    } else {
      applyFrame(0);
    }

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
    };
  }, [active]);

  return (
    <div
      ref={rootRef}
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
        <svg
          className="pulsing-heart__image"
          viewBox="0 0 54 49.13"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient
              id="heart-core-fill"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(27 24.565) rotate(90) scale(24.565 27)"
            >
              <stop stopColor="#ffa2a2" />
              <stop offset="1" stopColor="#e7000b" />
            </radialGradient>
            <linearGradient id="heart-core-glass" x1="9" y1="2" x2="42" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity="0.48" />
              <stop offset="0.24" stopColor="#fff" stopOpacity="0.1" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient
              id="heart-core-reflection"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(27 49) rotate(-90) scale(24 34)"
            >
              <stop stopColor="#fff" stopOpacity="0.18" />
              <stop offset="0.68" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="heart-core-rim" x1="9" y1="3" x2="45" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity="0.72" />
              <stop offset="0.42" stopColor="#fff" stopOpacity="0.12" />
              <stop offset="0.72" stopColor="#ffd9dd" stopOpacity="0.18" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.46" />
            </linearGradient>
          </defs>
          <path d={HEART_PATH} fill="url(#heart-core-fill)" />
          <path className="pulsing-heart__glass-layer" d={HEART_PATH} fill="url(#heart-core-glass)" />
          <path className="pulsing-heart__glass-layer pulsing-heart__glass-layer--reflection" d={HEART_PATH} fill="url(#heart-core-reflection)" />
          <path
            className="pulsing-heart__rim-path"
            d={HEART_PATH}
            fill="none"
            pathLength="1"
            vectorEffect="non-scaling-stroke"
            stroke="url(#heart-core-rim)"
            strokeWidth="0.8"
          />
        </svg>
      </span>
    </div>
  );
}

export type { PulsingHeartProps };
