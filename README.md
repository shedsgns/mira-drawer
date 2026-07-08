# MIRA SOS Drawer

A focused React prototype for the MIRA SOS bottom drawer flow. The experience starts with a Figma-matched green launch button, then opens a native-feeling bottom drawer with a polished SOS visual and four immediate support actions.

## What Is Included

- `Open SOS drawer` trigger button from the Figma design.
- Bottom drawer that opens from the bottom with a smooth native-sheet motion curve.
- Flat MIRA page background: `#363981`.
- Drawer surface in MIRA blue: `#4086de`.
- Animated SOS beacon sized at `64px`.
- Onest font loaded locally through `@fontsource/onest`.
- Four action rows:
  - Panic attack support
  - Breathing exercise
  - Relaxing game
  - Meditation
- Transparent outside-click layer, with no visual backdrop dimming.
- Escape-to-close and focus return behavior.
- Reduced-motion support for the animated SOS and drawer transitions.

## Design References

- Drawer Figma node: `4543:40212`
- Launch button Figma node: `4544:34488`
- Drawer motion reference: [Building a drawer component by Emil Kowalski](https://emilkowal.ski/ui/building-a-drawer-component)

The drawer uses the Vaul-style sheet curve from the article:

```css
cubic-bezier(0.32, 0.72, 0, 1)
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Main Files

- `src/App.jsx` - React components, drawer state, focus handling, and action data.
- `src/styles.css` - visual styling, drawer motion, SOS animation, responsive states, and reduced-motion rules.
- `Icons/` - SVG assets used by the drawer action rows and SOS wordmark.
- `index.html` - app shell and document metadata.

## Interaction Notes

The drawer is closed by default and translated below the viewport. Clicking the launch button opens it from the bottom. The drawer can be closed by pressing `Escape` or clicking the transparent outside area above the sheet.

When the drawer opens, focus moves to the first drawer action. When it closes, focus returns to the launch button. The closed drawer is marked inert so its internal buttons do not stay in the tab order.

## Visual Notes

The launch button is intentionally flat to match the Figma node:

- no browser appearance
- no border
- no inset shadow
- no internal highlight

The open state intentionally does not add a dim overlay. The outside-click layer is transparent and only exists for interaction.

The SOS beacon is built from layered CSS:

- expanding ripples
- a rotating hairline ring
- a coral luminous core
- imported `SOS.svg` wordmark
- slow breathing motion

Animations use `transform` and `opacity` so the interaction stays smooth.
