# MIRA SOS Drawer

A small React prototype for the MIRA bottom drawer flows.

It starts with a Figma-matched two-tab launcher and opens either the SOS support drawer or the recap-preparation drawer.

Live demo: `https://shedsgns.github.io/mira-drawer/`

## Features

- Bottom drawer opening from the bottom
- Flat MIRA background: `#363981`
- MIRA blue drawer surface: `#4086de`
- Onest font via `@fontsource/onest`
- Animated SOS beacon with reduced-motion support
- Neural recap loader with reduced-motion support
- Soft blurred outside-click close area
- Escape-to-close and focus return behavior

## Actions

- Panic attack support
- Breathing exercise
- Relaxing game
- Meditation

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Build:

```bash
npm run build
```

## Files

- `src/App.tsx` - React components and drawer state
- `src/styles.css` - styling, drawer motion, and animations
- `neural-loader.js` - canvas recap loader animation
- `Icons/` - SVG assets
