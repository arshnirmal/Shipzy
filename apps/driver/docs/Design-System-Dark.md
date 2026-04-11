# Design System Strategy: The Night Navigator

## 1. Overview & Creative North Star

This design system is engineered for the high-stakes, low-light environment of professional transit. The **Creative North Star is "The Night Navigator"**—an ethos that treats the driver’s interface not as a screen, but as a precision instrument.

To break away from the "generic SaaS" aesthetic, we utilize **Atmospheric Depth**. Instead of a flat grid, the layout is treated as a series of receding and advancing planes. We reject the rigid constraints of traditional containers in favor of intentional asymmetry and overlapping elements that guide the eye naturally toward critical navigation and dispatch data. This is a premium, editorial approach to utility: sophisticated, calm, and laser-focused.

## 2. Colors & Surface Logic

The palette is rooted in OLED-efficient blacks and deep charcoals to minimize cabin glare and preserve the driver’s night vision.

- **Primary Identity:** High-contrast Electric Indigo (`primary: #c0c1ff` / `primary_container: #8083ff`) acts as the "North Star" light, used only for critical actions and active states.
- **Tonal Depth:** We utilize the `surface_container` tiers to build a hierarchy of information without cluttering the UI with lines.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. In a low-light environment, thin lines create visual "vibration" and unnecessary cognitive load. Boundaries must be defined solely through:

1.  **Background Shifts:** Place a `surface_container_low` card on a `surface` background.
2.  **Tonal Transitions:** Use a subtle shift from `surface_container_lowest` to `surface_container_high` to denote a change in information density.

### The Glass & Gradient Rule

To move beyond a flat, "out-of-the-box" look, use **Glassmorphism** for floating elements (e.g., active navigation overlays). Apply a `surface_variant` at 60% opacity with a `backdrop-blur` of 20px.

- **Signature Textures:** For primary CTAs (like "Accept Trip"), use a subtle linear gradient from `primary` to `primary_container`. This provides a "glow" that feels professional and tactile rather than flat.

## 3. Typography: Legibility as Luxury

We utilize **Plus Jakarta Sans** for its geometric clarity and modern terminal cuts, which ensure high legibility at a glance.

- **Display & Headlines:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) for critical status updates (e.g., "Next Turn"). Use a tighter letter-spacing (-0.02em) to give these a bespoke, editorial feel.
- **Functional Body:** `body-md` (0.875rem) is our workhorse. For driving conditions, we prioritize generous line-height (1.5) to ensure characters don't blur during motion.
- **Labeling:** `label-md` (0.75rem) should be used sparingly for metadata, utilizing the `on_surface_variant` token to keep it secondary to primary trip data.

## 4. Elevation & Depth

In this design system, elevation is conveyed through **Tonal Layering**, not structural scaffolding.

- **The Layering Principle:** Depth is achieved by "stacking" the surface tiers.
  - _Base:_ `surface` (#131313)
  - _Sectioning:_ `surface_container_low` (#1C1B1B)
  - _Interactive Card:_ `surface_container_highest` (#353534)
- **Ambient Shadows:** When a floating effect is required (e.g., a bottom sheet), use an extra-diffused shadow.
  - _Spec:_ `0px 24px 48px rgba(0, 0, 0, 0.4)`. The shadow must feel like a natural ambient occlusion, never a harsh drop shadow.
- **The "Ghost Border" Fallback:** If a border is required for extreme accessibility cases, use the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

## 5. Components

### Buttons

- **Primary:** 4px radius (`DEFAULT: 0.25rem`). Background: `primary_container`. Text: `on_primary_container`. Use a subtle inner-glow (1px white at 10% opacity) on the top edge to simulate a physical button.
- **Tertiary:** No background, no border. Use `primary` text. These are for low-priority actions like "View History."

### Input Fields

- **Style:** Minimalist. No bounding box. Use a `surface_container_highest` bottom-only bar (2px) that transforms into a `primary` color glow when focused.
- **Error State:** Use `error` (#ffb4ab) for text and icon. Avoid red box fills to keep the "Night Navigator" calm.

### Cards & Lists

- **No Dividers:** Forbid the use of divider lines between list items. Instead, use 16px of vertical white space (from the Spacing Scale) or alternate the background between `surface_container_low` and `surface_container_lowest`.

### The Glance-Header (Custom Component)

A wide-format component used at the top of the viewport. It uses a `surface_bright` background with a subtle 4px corner radius on the bottom edges. This serves as the anchor for the driver's current status, providing a high-contrast zone for the most essential "at-a-glance" info.

## 6. Do’s and Don’ts

### Do

- **Do** prioritize "glanceable" hierarchy. If a driver can't understand the screen in 0.5 seconds, the hierarchy has failed.
- **Do** use asymmetrical layouts. Placing key metrics (like "ETA") slightly off-center can create a more dynamic, high-end feel than a centered, "template" look.
- **Do** use `primary_fixed_dim` for icons to ensure they don't overpower the text.

### Don't

- **Don't** use pure white (#FFFFFF). It causes eye strain in dark cabins. Use `on_surface` (#e5e2e1) for primary text.
- **Don't** use 1px dividers or borders. They are visual noise in a night-mode application.
- **Don't** use standard Material Design "elevated" shadows. They feel dated. Stick to tonal layering and glassmorphism.
