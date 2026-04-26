# Design System Documentation: The Digital Curator

## 1. Overview & Creative North Star

The "Digital Curator" philosophy transforms the standard business dashboard from a sterile data dump into a sophisticated, editorial management experience. This design system moves away from the "boxy" nature of traditional SaaS, opting for a layout that feels like a high-end professional journal or a curated gallery.

By utilizing high-density information architecture paired with generous tonal depth, we create an environment where complex logistics feel effortless. We break the "template" look through **intentional nesting** and **asymmetric focal points**, ensuring that the user’s eye is guided by importance rather than just a rigid grid.

## 2. Color & Tonal Architecture

The palette is rooted in **Electric Indigo (#6366F1)**, balanced by a "Professional Slate" spectrum. The goal is to use color to define space, not just decoration.

### The "No-Line" Rule

Sectioning must be achieved through background shifts rather than 1px solid borders. To separate a sidebar from a main content area, transition from `surface-container-low` (#eff4ff) to `surface` (#f8f9ff). This creates a "soft break" that feels premium and architectural.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Each layer deeper should signify a more focused task.

- **Base Layer:** `surface` (#f8f9ff) – The primary canvas.
- **Sectional Layer:** `surface-container-low` (#eff4ff) – Used for sidebars or secondary navigation panels.
- **Action Layer (Cards):** `surface-container-lowest` (#ffffff) – Used for the primary work surface or data containers to provide maximum "lift" and clarity.

### The "Glass & Gradient" Rule

To elevate the experience, floating elements (like dropdowns or hovering action bars) should use **Glassmorphism**:

- **Fill:** `surface_container_low` at 80% opacity.
- **Effect:** Backdrop-blur (12px to 20px).
- **Signature Texture:** Use a subtle linear gradient on primary CTAs—from `primary` (#4648d4) to `primary_container` (#6063ee)—to add "soul" and depth to the Electric Indigo brand color.

## 3. Typography: Geometric Precision

We use **Plus Jakarta Sans** for its geometric clarity and professional weight distribution. The typography isn't just for reading; it’s for navigating.

- **Display (lg/md/sm):** Reserved for high-level "Dashboard Summaries." Use `on_surface` (#0d1c2e) with a -0.02em letter spacing to give it an editorial, authoritative feel.
- **Headlines & Titles:** Used for module headers. Use `headline-sm` (1.5rem) for main page titles to establish a clear hierarchy.
- **Body (lg/md/sm):** Use `body-md` (0.875rem) as the workhorse for data. It provides high-density readability without eye strain.
- **Labels (md/sm):** Utilize `label-md` in all-caps with +0.05em tracking for table headers or metadata to create a "curated" look.

## 4. Elevation & Depth

Hierarchy is achieved through **Tonal Layering** rather than traditional structural lines.

- **The Layering Principle:** Instead of shadows, stack `surface-container-lowest` cards on top of `surface-container` backgrounds. This creates a soft, natural lift.
- **Ambient Shadows:** For elevated elements (Modals, Tooltips), use an ultra-diffused shadow: `0px 12px 32px rgba(13, 28, 46, 0.06)`. The tint is derived from the `on_surface` token to mimic natural light.
- **The Ghost Border:** If a boundary is strictly required for accessibility (e.g., in high-density tables), use the **Ghost Border**: `outline-variant` (#c7c4d7) at 20% opacity. Never use 100% opaque borders for container edges.

## 5. Component Guidelines

### Buttons & Interaction

- **Primary:** Linear gradient (Electric Indigo) with `lg` (8px) corner radius.
- **Secondary:** Ghost style using `outline-variant` (20% opacity) with `on_surface` text.
- **Sizing:** All buttons should have a minimum height of 40px for desktop precision, with horizontal padding at 24px.

### High-Contrast Data Tables

The centerpiece of the "Digital Curator."

- **Header:** `surface-container-high` (#dce9ff) background, `label-md` text.
- **Rows:** No horizontal dividers. Use a subtle `surface-container-lowest` background for every second row (zebra striping) or simply rely on 16px vertical padding (Spacing Scale) to define rows.
- **Hover State:** Shift background to `surface-container-highest` (#d5e3fc) to indicate focus.

### Structured Side-Navigation

- **Background:** `surface-container-low` (#eff4ff).
- **Active State:** A vertical 4px bar of `primary` (#4648d4) on the left edge, with the menu item background shifting to `surface_variant` (#d5e3fc).
- **Typography:** `title-sm` (1rem) for nav items to maintain professional weight.

### Input Fields

- **Style:** `surface-container-lowest` (#ffffff) fill with a 1px "Ghost Border" (20% opacity `outline-variant`).
- **Focus:** Border transitions to 1px solid `primary` (#4648d4) with a soft indigo outer glow (4px blur).

## 6. Do’s and Don’ts

### Do

- **Do** use whitespace as a separator. If you feel the need to add a line, try adding 16px of padding first.
- **Do** use `tertiary` (#904900) for "Attention" items like pending shipments or alerts; it provides a sophisticated contrast to the Indigo.
- **Do** nest containers. A white card on a light blue background is the signature look of this system.

### Don’t

- **Don’t** use pure black (#000000) for text. Always use `on_surface` (#0d1c2e) for a softer, more premium "Slate" feel.
- **Don’t** use the `full` (9999px) roundedness for anything other than status chips. Buttons and cards must stick to the `lg` (8px) radius to maintain a professional, structural look.
- **Don’t** clutter the interface with icons. Use icons only where they provide immediate functional recognition; otherwise, let the typography lead.
