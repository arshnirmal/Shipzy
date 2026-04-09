# Design System Strategy: Soft Minimalism & Editorial Precision

## 1. Overview & Creative North Star

The "Swift Editorial" North Star defines this design system. It moves away from the generic "app-template" look by treating the hyperlocal delivery experience as a premium concierge service. We achieve this through a "Soft Minimalist" approach: high-contrast geometric typography paired with an ethereal, layered interface.

The design rejects the rigid constraints of a 1px border world. Instead, it utilizes intentional asymmetry, generous negative space, and tonal depth. By prioritizing depth over lines, we create a UI that feels like it’s floating—modern, fast, and weightless—reflecting the core brand promise of the 'Swift Bolt' box logo: speed, precision, and care.

---

## 2. Colors

Our palette is anchored by the high-energy **Electric Indigo (#6366F1)**, balanced against a sophisticated range of Slate and Zinc neutrals.

### Surface Hierarchy & Nesting

To move beyond a "flat" interface, we utilize the `surface-container` tiers to create depth.

- **Surface Lowest (#ffffff):** The base for primary interactive cards.
- **Surface Low (#eff4ff):** The standard background for secondary content blocks.
- **Surface High (#dce9ff):** Used for elevated navigation or active states.

### The "No-Line" Rule

Traditional 1px solid borders are prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-lowest` card should sit atop a `surface-container-low` background to define its edges naturally.

### Glass & Signature Textures

- **Glassmorphism:** For floating action buttons or sticky headers, use `surface-container-lowest` at 80% opacity with a `24px` backdrop blur.
- **Gradients:** Main CTAs should use a subtle linear gradient: `primary` (#4648d4) to `primary_container` (#6063ee) at a 135-degree angle to add "visual soul."

---

## 3. Typography

We use **Plus Jakarta Sans** for its geometric clarity and modern "tech-forward" feel. The scale is designed to feel editorial, using drastic size differences to create a clear information hierarchy.

| Level               | Size      | Token         | Role                                      |
| :------------------ | :-------- | :------------ | :---------------------------------------- |
| **Display Large**   | 3.5rem    | `display-lg`  | High-impact marketing moments.            |
| **Headline Medium** | 1.75rem   | `headline-md` | Page headers and primary category titles. |
| **Title Medium**    | 1.125rem  | `title-md`    | Card titles and section headers.          |
| **Body Large**      | 1.0rem    | `body-lg`     | Default reading text, primary inputs.     |
| **Label Small**     | 0.6875rem | `label-sm`    | Metadata, micro-copy, and timestamps.     |

**Editorial Note:** Always pair `headline-md` (bold) with `body-md` (regular) with at least 16px of vertical spacing to ensure the geometric nature of the font has "room to breathe."

---

## 4. Elevation & Depth

In this system, elevation is a physical property. We move away from heavy shadows in favor of **Tonal Layering**.

- **The Layering Principle:** Place a `surface-container-lowest` element on a `surface-container-low` background to create a "soft lift" without a shadow.
- **Ambient Shadows:** For high-priority floating elements (like the "Swift Bolt" checkout button), use an extra-diffused shadow: `0px 12px 32px rgba(11, 28, 48, 0.06)`. The shadow color is a tinted version of `on-surface` (#0b1c30) for a natural look.
- **The Ghost Border:** If a boundary is required for accessibility, use a "Ghost Border": the `outline-variant` token at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons

- **Primary:** `primary` background with `on-primary` text. Use a 135° gradient for depth.
- **Outlined:** `Ghost Border` (15% opacity Indigo) with `primary` text. No solid 1px Indigo borders.
- **Ghost:** `primary` text with no container. Used for secondary actions (e.g., "Cancel Order").

### Cards & Lists

- **Cards:** Use `surface-container-lowest`. Strictly forbid divider lines. Separate items using `spacing-4` (1rem) of white space or a subtle shift to `surface-container-low`.
- **Tracking Card:** A specific component for delivery status. Use `tertiary_container` for the progress track to provide a warm, energetic contrast to the Indigo.

### Input Fields

- **Container:** `surface-container-lowest` background.
- **Border:** `outline-variant` at 20% opacity.
- **Focus State:** The border transitions to `primary` (#6366F1) with a soft 4px `primary_fixed` outer glow.

### Additional Signature Components

- **The Bolt Progress Bar:** A thin, high-contrast bar using the `primary` color to show delivery real-time status, featuring a small 'Swift Bolt' icon at the leading edge.

---

## 6. Do's and Don'ts

### Do

- **Do** use the 8px grid (`spacing-1`, `spacing-2`, etc.) religiously to ensure geometric alignment.
- **Do** use asymmetrical padding (e.g., more padding at the bottom of a card than the top) to create a custom, high-end feel.
- **Do** use `Plus Jakarta Sans` in "Medium" weight for buttons to enhance readability.

### Don't

- **Don't** use solid black (#000000). Always use `on-surface` (#0b1c30) for text to maintain the soft minimalist tone.
- **Don't** use 1px solid lines to separate list items; let the white space do the work.
- **Don't** use a corner radius larger or smaller than the `lg` (8px/0.5rem) token for main containers. Consistency in the 8px radius is vital for the "professional" look.
