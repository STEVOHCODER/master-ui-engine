# Design Tokens

MASTER-UI-ENGINE uses a CSS custom-property token system. Every preview consumes
these tokens, so re-theming the library means overriding variables — not editing
components.

## Files

| File | Purpose |
|------|---------|
| `engine.css` | **Single entry point.** Imports every layer below, then adds base typography, one `:focus-visible` ring, `.sr-only`, and a `prefers-reduced-motion` guard |
| `colors/primitive.css` | Raw HSL triplets: grayscale ramp, brand blue, secondary, semantic states, accent |
| `colors/semantic.css` | UI role mapping (`--bg-surface`, `--text-secondary`, `--primary-fg`, …) |
| `typography/scale.css` | `--font-*`, `--text-*`, `--leading-*`, `--tracking-*` |
| `spacing/scale.css` | `--space-0` … `--space-24` |
| `shadows/scale.css` | Elevation shadows (`--shadow-xs` … `--shadow-xl`) |
| `borders/scale.css` | `--border-width*`, `--radius-sm/base/md/lg/full`, border colors |
| `themes/light.css` | shadcn-style aliases (`--color-background`, `--color-primary`, `--radius`) on `:root` |
| `themes/dark.css` | `html.dark`: mirrors the grayscale ramp, lifts the brand blues, brightens states, deepens shadows, re-points white-pinned tokens |
| `base/typography.css` | Optional element styles (`h1`–`h6`, `p`, `a`). Deliberately **not** imported by `engine.css`, because previews author their own type and a global would restyle them |

## How to use

Link one file:

```html
<link rel="stylesheet" href="../design-tokens/engine.css">
```

All 46 previews already do this (adjust the relative depth for the folder you
are in). If you would rather cherry-pick layers, import them in the same order
`engine.css` uses: primitives → semantics → scales → light → dark.

Dark mode is applied by adding `class="dark"` to `<html>`:

```js
document.documentElement.classList.toggle('dark');
localStorage.setItem('mui-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
```

Every preview ships a toggle that does exactly that and restores the stored
choice on load.

## Two kinds of token — do not mix them up

Primitives are raw channel triplets, so they need `hsl()`:

```css
color: hsl(var(--color-gray-700));
```

Semantics already resolve to a complete `<color>`, so use them directly:

```css
color: var(--text-secondary);
background: var(--bg-surface);
```

Assigning a bare triplet to a semantic token (`--text-primary: 220 10% 10%`)
produces an invalid value and the declaration is dropped.

## Example override

```css
:root {
  /* primitives — raw triplets */
  --color-primary-500: 262 83% 58%;   /* brand purple */
  --color-primary-600: 262 78% 50%;
  --color-gray-50: 260 30% 98%;       /* warm neutral surfaces */

  /* scales */
  --radius-base: 0.75rem;             /* var(--radius) follows it */
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --space-4: 1.25rem;
}
```

Prefer overriding primitives and letting the semantics derive. `themes/dark.css`
re-points the primitives for dark mode, so a brand override that only touches
semantics will not flip with the theme.

## Inverted surfaces

The dark theme is a mirror of the grayscale ramp, so text on a surface pinned to
the bottom of the ramp (gray-900/950 — footers, nav rails) has to sit at the
opposite end: `hsl(var(--color-gray-50))` for primary text,
`hsl(var(--color-gray-300))` for secondary. Mid-ramp greys (400/500/600) fail
contrast in *both* themes on those surfaces, and `#fff` pinned literally stops
inverting — use the token instead.

## Attribution

Token naming follows the shadcn/ui convention (`--color-*`, `--radius`, HSL
channel values). shadcn/ui is MIT licensed. MASTER-UI-ENGINE tokens are MIT.
