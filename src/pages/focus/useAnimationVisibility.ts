import { useEffect, type RefObject } from "react";

/**
 * Pauses CSS animations without React state, timers or a frame loop.
 * The stylesheet reads data-active on the referenced element.
 */
export function useAnimationVisibility<T extends HTMLElement>(
  ref: RefObject<T | null>,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let pageActive = true;
    let inViewport = true;

    const sync = () => {
      element.dataset.active = String(
        pageActive && document.visibilityState !== "hidden" && inViewport,
      );
    };

    const measureVisibility = () => {
      const bounds = element.getBoundingClientRect();
      inViewport =
        bounds.width > 0 &&
        bounds.height > 0 &&
        bounds.bottom > 0 &&
        bounds.right > 0 &&
        bounds.top < window.innerHeight &&
        bounds.left < window.innerWidth;
    };

    const hasObserver = typeof IntersectionObserver !== "undefined";
    if (hasObserver) measureVisibility();

    const observer = hasObserver
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries.find((item) => item.target === element);
            if (!entry) return;
            // threshold: 0 also reports edge contact. Testing the ratio here
            // could leave an entering element paused without another callback.
            inViewport = entry.isIntersecting;
            sync();
          },
          { threshold: 0 },
        )
      : null;

    const onPageHide = () => {
      pageActive = false;
      sync();
    };

    const onPageShow = () => {
      pageActive = true;
      if (hasObserver) measureVisibility();
      sync();
    };

    observer?.observe(element);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    sync();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      element.dataset.active = "false";
    };
  }, [ref]);
}
