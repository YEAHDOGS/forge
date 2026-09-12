---
version: alpha
name: Forge Ember
colors:
  primary: "#ff6b1a"
  secondary: "#ffa14d"
  tertiary: "#7a2d0e"
  neutral: "#f6f1e7"
  bg: "#0d0906"
  muted: "#b7a78c"
typography:
  display:
    fontFamily: Anton
    fontSize: clamp(90px, 22vw, 260px)
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: 0.01em
  panel-line:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  body:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.5
    letterSpacing: 0
  cta:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.08em
rounded:
  sm: 0px
  md: 0px
  lg: 0px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#0d0906"
    rounded: "{rounded.full}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
omitted:
  - elevation: "Flat industrial; depth comes from photography + scrims, not shadows."
---

# Forge Ember — DESIGN.md

## Overview (Brand & Style)

Forge is a free Oklahoma LLC formation wizard. The visual world is a night forge: molten metal, black steel, one ember-orange accent. Persuade mode — the visitor decides and acts. Personality: industrial, blunt, honest. Emotional target: "this is serious and it costs me nothing."

Brand rule: Forge is not a law firm and files nothing. The design never implies otherwise — the wizard prepares, the user files.

## Colors

- `--bg #0d0906` — near-black warm; every panel's base.
- `--ink #f6f1e7` — bone white for display type and lines.
- `--muted #b7a78c` — warm gray for captions and secondary text. AA-checked on bg.
- `--ember #ff6b1a` — the single accent. CTAs, the hero word highlight, active states.
- `--ember-soft #ffa14d` — ember for gradients/scrims only, never text on bg.
- One palette, whole page. No warm/cool mixing. No other accents.

## Typography

- Display: Anton, uppercase, 0.88 line-height, tight. One giant word per panel (90px→260px clamp). Anton is the default Google font; falls back to "Arial Narrow" system stack.
- Panel lines: Poppins 500, 20px/1.35 — the 1–2 short lines per panel.
- Body/captions: Poppins 300, 16px/1.5.
- CTAs: Poppins 600, 14px, 0.08em tracking, uppercase, pill buttons.
- Never serif. Never Inter-as-default. Emphasis inside a headline stays in Anton (weight/color), never a swapped family.

## Layout (Layout & Spacing)

- Full-screen Y-scroll-snap panels, 100svh each, mandatory snap. One idea per panel.
- Copy position varies per panel (bottom-left, top-right, mid-right, bottom-left, top-left, bottom-right, mid-left) — never forced to vertical center.
- Panel copy: one giant display word + 1–2 short punchy lines + optional single CTA. Never paragraphs.
- Fixed slim header (mark left, one CTA right), ≤64px.
- Mobile: single column, word scales by vw, copy padding 20px, CTA full-width-friendly.

## Elevation & Depth

Flat. Depth from full-bleed photography with gradient scrims. No drop shadows on light (page is dark-only). Grain overlay only as fixed pointer-events-none layer if used — never on scrolling containers.

## Shapes

Sharp industrial (radius 0) for panels and type blocks; interactive CTAs are full-pill. Documented split: buttons pill, everything else square.

## Components

- `button-primary`: ember fill, near-black text, pill, uppercase 14px. Hover: slight translate + brightness. Active: scale .98.
- `button-ghost`: transparent, bone text, 1px bone/40 border, pill. One per panel max — never two CTAs with the same intent.
- Progress: thin ember scroll progress bar under header (motion-allowed, transform scaleX).
- Badge: rectangular made-by-dogs.png image, linked to https://wearedogs.net, in closer footer. Never as text, never a name.

## Do's and Don'ts

- DO: one giant display word per panel, dark full-bleed imagery, gradient scrims for legibility.
- DO: short punchy lines — happy medium between wall of text and no text.
- DO: honor prefers-reduced-motion (parallax + reveals collapse to static).
- DON'T: add eyebrows to every panel (max 1 per 3 panels).
- DON'T: imply Forge files anything or is a law firm — "Forge files nothing" is on the page twice.
- DON'T: invent fees. Every number comes from verified Oklahoma fee facts ($100 formation, $25/yr annual certificate, ~1 business day online filing, $750 TX foreign + 2.7% card fee).
- DON'T: add new dependencies, hosts, or installs. Google Fonts (already in use on the fleet) is the only external host.
- DON'T: put any personal name, handle, or family reference anywhere. Build aborts on PII.
