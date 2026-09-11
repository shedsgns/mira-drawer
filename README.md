# MIRA Drawer

React + TypeScript prototype for MIRA drawer flows and the Sparkles daily-plan screen.

Live: https://shedsgns.github.io/mira-drawer/

## Routes

- `/mira-drawer/` - drawer demo
- `/mira-drawer/sparkles` - daily plan + sparkles demo
- `/mira-drawer/focus` - separate weekly focus page, using Onest and the Mira icon set. Includes an animated CSS sphere, accessible focus picker, and a locally saved selection for the current Monday–Sunday week.

## Build

```bash
npm run build
```

## Main Files

- `src/App.tsx` - drawer flows
- `src/styles.css` - shared drawer styles
- `src/pages/sparkles/` - Sparkles page
- `src/pages/focus/` - weekly focus page and sphere, adapted from the supplied `focus/` reference package
- `Icons/` - SVG assets

## Heart Drawer Iterations

The fourth drawer began as a warning concept built on the SOS Drawer’s structure,
dimensions, spacing, responsive behavior, and opening and closing mechanics. Its
trigger is labeled **Open Heart drawer**.

1. **Fourth drawer foundation**
   - Added `WarningDrawer` alongside the existing drawer examples.
   - Reused the SOS Drawer’s component architecture and layout behavior.

2. **Particle heart-to-logo concept**
   - Explored a dense particle heart that dissolved and reorganized into the
     Mira logo.
   - Tested floating particles, negative space, sparkles, and persistent
     particle movement.

3. **Simplified visual direction**
   - Removed the particle morph and logo transition.
   - Replaced them with a pulsing red heart and expanding heart-shaped beat
     lines inspired by the SOS animation.

4. **Heart styling**
   - Used the heart geometry supplied in the Figma design.
   - Added a red gradient, internal highlight, red aura, and restrained floating
     movement.

5. **SOS-style glass treatment**
   - Added a glass shell, illuminated rim, and synchronized internal highlight.
   - Removed dark shadows and conflicting blue effects.
   - Set the drawer background to `#222459`.

6. **Expanding beat lines**
   - Added two staggered heart-shaped pulse outlines.
   - Limited their visible borders to 1px and supported them with a soft red
     glow.

7. **Ambient effects exploration**
   - Tested moving dust, sparkles, and a floating translucent heart.
   - Removed the floating heart, sparkles, and white dust for a cleaner result.

8. **Pixelated heart experiment**
   - Created an alternate heart assembled from animated rectangular pixels.
   - Preserved the experiment in `src/components/PixelHeart.tsx`, while the
     drawer returned to the smoother and more premium heart treatment.

9. **Copy and naming**
   - Renamed the trigger to **Open Heart drawer**.
   - Updated the content to natural American English and added the final
     medical disclaimer.

10. **Spacing refinement**
    - Reduced the space between the heart and title.
    - Matched the title-to-description spacing used by the other drawers.

11. **Moving line-gradient exploration**
    - Referenced the moving gradient on the SOS ring.
    - Replaced a hard traveling dash with a five-stage tapered gradient moving
      around each heart-shaped beat line.

12. **Final color refinement**
    - Changed the moving line gradient from white to saturated bright red.
    - Preserved the 1px contours, staggered wave speeds, red glow, clean
      particle-free presentation, and reduced-motion behavior.

The current Heart Drawer uses a smooth glass-like red heart, a subtle double
heartbeat, slight floating movement, expanding 1px heart contours, and
bright-red traveling gradients. It contains no particle morph, logo transition,
white dust, sparkles, dark shadow, or blue border.

## Deploy

Pushes to `main` deploy to GitHub Pages.

## Focus sphere

The original CSS glass shell, lens, and scrolling labels surround an Orbkit
SHDR-25 surface. The speaking preset is slowed to speed 0.95, drift 0.24,
and swirl 0.16, with Mira blue, aqua, and lilac and a soft-light blend over
the original pastel body. No extra shader wrapper is used. Motion pauses
while the drawer is open and respects visibility and reduced motion.

SHDR-25 is by XorDev, for **non-commercial use with attribution**. Commercial
use requires separate permission. See `src/pages/focus/orbkit/NOTICE.md`.
The runtime is MIT licensed. The CSS sphere remains visible without WebGL.
