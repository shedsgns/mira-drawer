import { useEffect, useRef } from 'react';
import heartSource from '../../Icons/Heart.svg';

type PixelHeartProps = {
  active: boolean;
};

type HeartPixel = {
  alpha: number;
  color: string;
  phase: number;
  radius: number;
  speed: number;
  x: number;
  y: number;
};

const HEART_WIDTH = 54;
const HEART_HEIGHT = 49.13;
const SAMPLE_SCALE = 2;
const HEARTBEAT_DURATION = 2800;
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
    </svg>
  );
}

function createHeartPixels(image: HTMLImageElement) {
  const sampleWidth = Math.round(HEART_WIDTH * SAMPLE_SCALE);
  const sampleHeight = Math.round(HEART_HEIGHT * SAMPLE_SCALE);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });

  if (!sampleContext) {
    return [];
  }

  sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
  sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const heartPixels: HeartPixel[] = [];

  for (let y = 0; y < sampleHeight; y += 2) {
    for (let x = 0; x < sampleWidth; x += 2) {
      const sourceIndex = (y * sampleWidth + x) * 4;
      const sourceAlpha = pixels[sourceIndex + 3];

      if (sourceAlpha < 56 || (x * 17 + y * 31) % 11 === 0) {
        continue;
      }

      const positionX = x / SAMPLE_SCALE;
      const positionY = y / SAMPLE_SCALE;
      const distanceFromCenter = Math.min(
        1,
        Math.hypot(
          (positionX - HEART_WIDTH / 2) / (HEART_WIDTH / 2),
          (positionY - HEART_HEIGHT / 2) / (HEART_HEIGHT / 2),
        ),
      );
      const seed = ((x * 73 + y * 151) % 997) / 997;

      heartPixels.push({
        alpha: sourceAlpha / 255,
        color: `rgb(${pixels[sourceIndex]} ${pixels[sourceIndex + 1]} ${pixels[sourceIndex + 2]})`,
        phase: seed * Math.PI * 2,
        radius: 0.22 + distanceFromCenter * 0.82,
        speed: 0.00042 + seed * 0.00028,
        x: positionX,
        y: positionY,
      });
    }
  }

  return heartPixels;
}

export function PixelHeart({ active }: PixelHeartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(HEART_WIDTH * pixelRatio);
    canvas.height = Math.round(HEART_HEIGHT * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const image = new Image();
    let animationFrame = 0;
    let isRunning = false;
    let isDisposed = false;
    let heartPixels: HeartPixel[] = [];

    const draw = (time: number, staticFrame = false) => {
      context.clearRect(0, 0, HEART_WIDTH, HEART_HEIGHT);

      const heartbeatPhase = (time % HEARTBEAT_DURATION) / HEARTBEAT_DURATION;
      const firstBeat = Math.exp(-Math.pow((heartbeatPhase - 0.07) / 0.032, 2)) * 0.056;
      const secondBeat = Math.exp(-Math.pow((heartbeatPhase - 0.19) / 0.046, 2)) * 0.027;
      const heartbeatScale = staticFrame ? 1 : 1 + firstBeat + secondBeat;
      const centerX = HEART_WIDTH / 2;
      const centerY = HEART_HEIGHT * 0.52;

      for (let index = 0; index < heartPixels.length; index += 1) {
        const pixel = heartPixels[index];
        const driftX = staticFrame ? 0 : Math.sin(time * pixel.speed + pixel.phase) * pixel.radius;
        const driftY = staticFrame ? 0 : Math.cos(time * pixel.speed * 0.82 + pixel.phase * 1.31) * pixel.radius * 0.72;
        const x = centerX + (pixel.x - centerX) * heartbeatScale + driftX;
        const y = centerY + (pixel.y - centerY) * heartbeatScale + driftY;
        const shimmer = staticFrame ? 1 : 0.88 + Math.sin(time * 0.00055 + pixel.phase) * 0.12;

        context.globalAlpha = pixel.alpha * shimmer;
        context.fillStyle = pixel.color;
        context.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, 1.15, 1.15);
      }

      context.globalAlpha = 1;
    };

    const frame = (time: number) => {
      if (isDisposed || document.hidden || reducedMotion.matches) {
        isRunning = false;
        return;
      }

      draw(time);
      animationFrame = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (!isRunning && !isDisposed && !document.hidden && !reducedMotion.matches && heartPixels.length > 0) {
        isRunning = true;
        animationFrame = window.requestAnimationFrame(frame);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
        isRunning = false;
        return;
      }

      start();
    };

    const handleMotionPreference = () => {
      window.cancelAnimationFrame(animationFrame);
      isRunning = false;

      if (reducedMotion.matches) {
        draw(0, true);
      } else {
        start();
      }
    };

    image.decoding = 'async';
    image.onload = () => {
      if (isDisposed) {
        return;
      }

      heartPixels = createHeartPixels(image);

      if (reducedMotion.matches) {
        draw(0, true);
      } else {
        start();
      }
    };
    image.src = heartSource;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      isDisposed = true;
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotion.removeEventListener('change', handleMotionPreference);
    };
  }, [active]);

  return (
    <div
      className="pulsing-heart pixel-heart"
      data-active={active}
      data-node-id="4658:56817"
      role="img"
      aria-label="Pixelated pulsing heart"
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
        <canvas className="pixel-heart__canvas" ref={canvasRef} aria-hidden="true" />
      </span>
    </div>
  );
}

export type { PixelHeartProps };
