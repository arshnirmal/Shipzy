# Design System Document: The Urban Navigator

## 1. Overview & Creative North Star

The design system for the driver application is anchored by the Creative North Star: **"The Urban Navigator."** This is not a static interface; it is a high-performance instrument designed for the kinetic, high-stakes environment of city logistics.

To move beyond the "standard app" aesthetic, this system utilizes **Organic Utility**. We reject the rigid, boxed-in layouts of legacy logistics software in favor of an editorial, map-centric experience. By utilizing intentional asymmetry, oversized typography for critical data, and a "Layered Glass" philosophy, we ensure the driver feels like a professional navigator, not just a data entry clerk. Speed is our aesthetic; legibility is our luxury.

---

## 2. Colors: Tonal Depth over Borders

Color in this system is used for communication, not decoration. We utilize the **"No-Line" Rule**: borders are strictly prohibited for sectioning. Definition is achieved through background shifts and elevation.

### The Palette

- **Primary (Electric Indigo - #4648d4):** Our pulse. Used for critical "Go" actions and active navigation states.
- **Surface Hierarchy:**
  - `surface` (#fcf8ff): The base canvas.
  - `surface-container-low` (#f5f2fe): Secondary content areas.
  - `surface-container-highest` (#e4e1ed): High-priority interactive cards.
- **Status & Utility:**
  - `tertiary` (#006c49): The "Online" state—vibrant, high-visibility green.
  - `error` (#ba1a1a): Urgent alerts and missed windows.

### The "Glass & Gradient" Rule

To elevate the UI from "utilitarian" to "premium," floating map overlays must use **Glassmorphism**. Apply `surface_container_lowest` at 85% opacity with a `24px` backdrop blur.
**Signature Texture:** Main CTAs should not be flat. Apply a subtle linear gradient from `primary` (#4648d4) to `primary_container` (#6063ee) at a 135-degree angle to create a "liquid light" effect that demands attention during high-speed scanning.

---

## 3. Typography: The Editorial Edge

We use **Plus Jakarta Sans**—a geometric sans-serif that balances mechanical precision with approachable curves.

- **Display (The Dashboard):** `display-sm` is reserved for the most critical metric (e.g., "Current Earnings" or "Minutes to Destination"). It should feel like a headline in a high-end magazine.
- **Headlines & Titles:** Use `headline-sm` for job titles. The tight tracking and bold weight ensure readability at arm's length while the phone is mounted.
- **Labels:** `label-md` and `label-sm` are used for metadata (e.g., "Package Weight," "Priority"). These are always uppercase with `0.05em` letter spacing to maintain a "technical" feel.

---

## 4. Elevation & Depth: The Layering Principle

Depth replaces lines. We create a "stacked sheet" effect to guide the driver's eye.

- **Tonal Layering:** Instead of drawing a box around a job offer, place a `surface_container_highest` card on top of a `surface_container_low` background. This creates a soft, sophisticated lift.
- **Ambient Shadows:** For floating action buttons (FABs) or map overlays, use a `16px` blur shadow with 6% opacity, tinted with `primary`. This prevents the "muddy" look of grey shadows and keeps the interface feeling "Urban" and "Light."
- **The Ghost Border Fallback:** If a divider is essential for accessibility in complex lists, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Engineered for Speed

### Buttons (High-Contrast Actions)

- **Primary:** Indigo gradient, `lg` (8px) corner radius. Min-height 56px for "fat-finger" accessibility while driving.
- **Tertiary (Online/Offline Toggle):** Uses `tertiary_container` for the "Online" state. It should glow with a soft ambient shadow to indicate the app is "Live."

### Job Scanning Cards

- **Constraint:** No divider lines.
- **Structure:** Use `title-lg` for the destination district. Use `body-sm` with `on_surface_variant` for secondary details. Use vertical white space (16px/24px) to separate different jobs.
- **Status Indicators:** A vertical 4px "accent bar" of `tertiary` on the left edge of a card signals a high-priority or premium-pay job.

### Map-Optimized Overlays

- Overlays must never touch the edge of the screen. Maintain a 16px "breathing margin" to show the map underneath, reinforcing the "Navigator" North Star.
- Use `surface_container_lowest` with backdrop blur to ensure text remains legible regardless of the map's complexity.

### Input Fields

- **Design:** Borderless. Use `surface_container_high` as the background. When focused, the background shifts to `surface_container_highest` with a 2px `primary` bottom-only indicator.

---

## 6. Do's and Don'ts

### Do

- **Do** use `8px` (lg) corner radius for all primary containers to maintain the "Urban Navigator" geometric language.
- **Do** use asymmetrical layouts in the profile or summary screens (e.g., left-aligned large typography with right-aligned floating stats) to break the "template" feel.
- **Do** prioritize `surface` shifts over lines.

### Don't

- **Don't** use 100% black (#000000). Use `on_surface` (#1b1b23) for deep contrast that feels natural.
- **Don't** use standard Material Design shadows. They are too heavy for this "High-Visibility" system.
- **Don't** use "Information Blue" for links. In this system, Indigo is the only interactive color; Green (Tertiary) is for Status; Red (Error) is for Alerts.
