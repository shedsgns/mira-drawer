# MIRA SOS Drawer

A small React prototype for the MIRA SOS bottom drawer flow.

It starts with a Figma-matched green trigger button and opens a bottom drawer with a 64px animated SOS beacon and four support actions.

## Features

- Bottom drawer opening from the bottom
- Flat MIRA background: `#363981`
- MIRA blue drawer surface: `#4086de`
- Onest font via `@fontsource/onest`
- Animated SOS beacon with reduced-motion support
- Transparent outside-click close area
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

- `src/App.jsx` - React components and drawer state
- `src/styles.css` - styling, drawer motion, and SOS animation
- `Icons/` - SVG assets
