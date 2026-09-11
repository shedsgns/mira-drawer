import {
  useId,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { useAnimationVisibility } from "./useAnimationVisibility";
import "./sphere.css";

export interface WeeklyFocusItem {
  /** Stable and unique within the supplied list. */
  id: string;
  label: string;
}

export type WeeklyFocusStyle = CSSProperties & {
  [name: `--focus-${string}`]: string | number | undefined;
};

export interface WeeklyFocusProps {
  focuses: readonly WeeklyFocusItem[];
  onOpenFocusPicker: () => void;
  /** A CSS length, or a number in pixels. */
  size?: number | string;
  /** Duration of the entire loop. Default: 4 seconds per focus. */
  cycleSeconds?: number;
  /** CSS custom properties for colors, wave/window speeds and blur. */
  style?: WeeklyFocusStyle;
  className?: string;
  paused?: boolean;
}

/**
 * Every step holds for 75% of its time and moves for the remaining 25%.
 * The duplicate first/second rows make the final frame match the first.
 * Generated once per list length, never on an animation frame.
 */
function makeKeyframes(name: string, count: number): string {
  if (count < 2) return "";

  const percentage = (value: number) => Number(value.toFixed(6));
  const frames = Array.from({ length: count }, (_, index) => {
    const start = percentage((index / count) * 100);
    const hold = percentage(((index + 0.75) / count) * 100);
    return `${start}%, ${hold}% {
      transform: translateY(calc(var(--focus-row) * -${index + 1}));
    }`;
  });

  return `@keyframes ${name} {
    ${frames.join("\n")}
    100% {
      transform: translateY(calc(var(--focus-row) * -${count + 1}));
    }
  }`;
}

/**
 * The original CSS glass sphere and synchronized word tracks.
 * The button opens the picker without choosing the decorative word.
 * Render the title and hint outside this button to suit the host screen.
 */
export function WeeklyFocus({
  focuses,
  onOpenFocusPicker,
  size,
  cycleSeconds,
  style,
  className,
  paused = false,
}: WeeklyFocusProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useAnimationVisibility(buttonRef);

  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const animationName = `weekly-focus-track-${instanceId}`;
  const count = focuses.length;
  const keyframes = useMemo(
    () => makeKeyframes(animationName, count),
    [animationName, count],
  );

  const rows = useMemo(() => {
    if (focuses.length === 0) return [];
    const first = focuses[0]!;
    const second = focuses[1] ?? first;
    const last = focuses[focuses.length - 1]!;
    return [
      { item: last, key: `before-${last.id}` },
      ...focuses.map((item) => ({ item, key: `item-${item.id}` })),
      { item: first, key: `after-first-${first.id}` },
      { item: second, key: `after-second-${second.id}` },
    ];
  }, [focuses]);

  const duration =
    typeof cycleSeconds === "number" &&
    Number.isFinite(cycleSeconds) &&
    cycleSeconds > 0
      ? cycleSeconds
      : Math.max(count, 1) * 4;

  const sphereStyle: WeeklyFocusStyle = {
    ...style,
    ...(size !== undefined
      ? { "--focus-size": typeof size === "number" ? `${size}px` : size }
      : {}),
    "--focus-cycle": `${duration}s`,
  };

  const trackStyle: CSSProperties = {
    animationName: count > 1 ? animationName : "none",
    animationDuration: `${duration}s`,
    animationTimingFunction: "var(--focus-scroll-ease)",
    animationIterationCount: "infinite",
  };

  // Both views use the same rows, dimensions and animation. Complementary
  // CSS clips reveal the sharp text through the window and blur it outside.
  const renderWords = (clear = false) => (
    <span
      className={[
        "focus-sphere__words",
        clear && "focus-sphere__words--clear",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="focus-sphere__track" style={trackStyle}>
        {rows.map(({ item, key }) => (
          <span
            key={key}
            className="focus-sphere__word"
            data-long={item.label.length > 12 ? "true" : undefined}
          >
            {item.label}
          </span>
        ))}
      </span>
    </span>
  );

  return (
    <>
      {keyframes && <style>{keyframes}</style>}
      <button
        ref={buttonRef}
        type="button"
        className={["focus-sphere", className].filter(Boolean).join(" ")}
        style={sphereStyle}
        data-active="false"
        data-paused={paused || undefined}
        data-single={count === 1 || undefined}
        aria-label="Choose your weekly focus"
        aria-haspopup="dialog"
        onClick={onOpenFocusPicker}
      >
        <span className="focus-sphere__body" aria-hidden="true">
          <span className="focus-sphere__light">
            <i className="focus-wave focus-wave--a" />
            <i className="focus-wave focus-wave--b" />
            <i className="focus-wave focus-wave--c" />
            <i className="focus-wave focus-wave--d" />
          </span>
          {renderWords()}
          <span className="focus-sphere__glass" />
          {renderWords(true)}
          <span className="focus-sphere__edge" />
          <span className="focus-sphere__reflection" />
          <span className="focus-sphere__caustic" />
        </span>
      </button>
    </>
  );
}

export default WeeklyFocus;
