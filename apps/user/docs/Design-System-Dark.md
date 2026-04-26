# Design System Specification: The Luminous Grid

## 1. Overview & Creative North Star

This design system is built upon a philosophy we call **"The Luminous Grid."** We are moving beyond the rigid, boxy constraints of traditional SaaS interfaces to create an editorialized experience that feels weightless, intentional, and high-end.

The "Soft Minimalist" aesthetic is achieved not through a lack of detail, but through the precision of it. By leveraging the **Electric Indigo (#6366F1)** as a focal point of energy against a sophisticated tonal backdrop, we create a "Digital Curator" persona—authoritative yet breathable. We break the "template" look by favoring intentional asymmetry in layout and using typography scales that emphasize a hierarchy of thought, not just a hierarchy of size.

---

## 2. Colors & Surface Philosophy

### The Tonal Foundation

Our palette is rooted in the depth of the Slate scale and the vibrancy of Electric Indigo.

- **Primary (Electric Indigo):** `#6366F1`. Used for high-impact actions and brand presence.
- **Surface (Dark Mode):** `#121212` — This is your "true floor."
- **Surface (Light Mode):** `#FFFFFF` — The pristine "canvas."

### The "No-Line" Rule

To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined through color shifts.

- **Implementation:** Place a `surface-container-high` element directly onto a `surface` background. The shift from `#121212` to `#222A3D` (Dark) or `#FFFFFF` to `#F8FAFC` (Light) is sufficient to define structure without the "cheapening" effect of a structural line.

### Surface Hierarchy & Nesting

Think of the UI as a series of stacked, semi-transparent layers rather than a flat grid.

- **Nesting:** Use the `surface-container` tiers (Lowest to Highest) to create "nested" depth. An inner card should always be one tier higher or lower than its parent container to create a soft, natural lift.

### The "Glass & Gradient" Rule

For floating elements (modals, dropdowns, navigation bars), use **Glassmorphism**. Combine the surface color with a `backdrop-filter: blur(12px)` and a 60% opacity. To add "soul," use a subtle linear gradient on primary CTAs: `linear-gradient(135deg, #6366F1 0%, #8083FF 100%)`.

---

## 3. Typography: Editorial Rhythm

We use **Plus Jakarta Sans** for its geometric clarity and modern warmth. Typography is our primary tool for conveying brand authority.

- **Display Scale (The Editorial Hook):** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero moments. This creates an "oversized" premium feel.
- **Headline vs. Body:** Pair `headline-sm` (Semi-Bold) with `body-md` (Regular). The contrast in weight and size should feel intentional—ensure at least a 2-step jump in the scale between labels and headers to avoid "visual grayness."
- **Micro-Copy:** `label-sm` (0.6875rem) should always be in `color-text-secondary` and used sparingly for metadata to keep the interface clean.

---

## 4. Elevation & Depth

### The Layering Principle

Depth is achieved through **Tonal Layering** rather than shadows. In this system, light comes from the brand color (Electric Indigo), not from a simulated sun.

- **Example:** A `surface-container-highest` panel on a `surface` background creates a natural elevation that feels "built-in" rather than "pasted on."

### Ambient Shadows

Shadows are reserved for elements that physically move over others (e.g., Modals).

- **Dark Mode Shadow:** `rgba(0, 0, 0, 0.3)` with a 24px blur and 8px offset.
- **Light Mode Shadow:** Use a tinted shadow—`rgba(99, 102, 241, 0.08)`—to mimic the brand’s "Electric Indigo" glow reflecting on the surface.

### The "Ghost Border" Fallback

If an element requires a container but background shifts are insufficient (e.g., complex data tables), use a **Ghost Border**. Use the `color-border` token (`#334155` in Dark / `#E2E8F0` in Light) but at **20% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons

- **Primary:** Electric Indigo background, white text. No border. `0.5rem` (8px) roundness. High-contrast and bold.
- **Secondary (The Glass Button):** Semi-transparent `primary_container` with a `backdrop-filter: blur(4px)`. This makes the button feel integrated into the surface.
- **Tertiary:** No background. `color-text-primary` with a subtle hover state shift to `primary`.

### Cards & Lists

- **Forbidden:** Divider lines between list items.
- **The Solution:** Use `16px` or `24px` of vertical white space to separate items. For lists, use a subtle `surface-container-low` hover state to highlight the active row.

### Input Fields

- **Resting:** `surface-container` background with a "Ghost Border."
- **Focus:** Transition the border to 100% opacity `color-primary` and add a 4px soft outer glow of the same color. This creates a "Luminous" focus effect.

### Chips

- **Selection:** Use `primary_fixed` with `on_primary_fixed` text for a soft, pastel-like indigo effect that doesn't compete with the main Primary button.

---

## 6. Do’s and Don'ts

### Do:

- **Use Asymmetry:** Offset header text from the grid occasionally to create an editorial, high-end look.
- **Embrace Negative Space:** If a section feels crowded, double the padding. "Soft Minimalism" requires air.
- **Consistent Roundness:** Stick strictly to the `0.5rem` (8px) rule for cards and buttons.

### Don't:

- **Don't use pure black:** Never use `#000000`. Use the `surface` token `#121212` to maintain tonal depth.
- **Don't use high-contrast dividers:** Avoid 1px Slate-700 lines that cut through the layout. Use background color blocks instead.
- **Don't over-shadow:** If you can achieve the look with a color shift, do not use a drop shadow. Shadows are a last resort for physical separation.

---

## 7. Token Reference Summary

| Token                 | Dark Mode Value | Light Mode Value |
| :-------------------- | :-------------- | :--------------- |
| **Primary**           | `#6366F1`       | `#6366F1`        |
| **Surface**           | `#121212`       | `#FFFFFF`        |
| **Surface-Container** | `#1E1E1E`       | `#F8FAFC`        |
| **Text-Primary**      | `#F1F5F9`       | `#0F172A`        |
| **Text-Secondary**    | `#94A3B8`       | `#64748B`        |
| **Border**            | `#334155`       | `#E2E8F0`        |
| **Roundness**         | `0.5rem (8px)`  | `0.5rem (8px)`   |
