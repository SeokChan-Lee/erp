# Axis ERP Design System

## Design Direction

Axis ERP uses an Apple-inspired visual foundation adapted for a practical business application.

The interface should feel calm, precise, and operational. It should not feel like a marketing landing page inside the product.

## Font

Pretendard is the fixed font family.

Recommended CSS stack:

```css
font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

## Core Colors

| Token | Value | Usage |
| --- | --- | --- |
| `axis-black` | `#000000` | Rare dark chapters, high contrast |
| `axis-ink` | `#1d1d1f` | Primary text |
| `axis-gray-bg` | `#f5f5f7` | App background |
| `axis-white` | `#ffffff` | Panels and tables |
| `axis-blue` | `#0071e3` | Primary action and focus |
| `axis-link` | `#0066cc` | Inline links |
| `axis-text-muted` | `#6e6e73` | Secondary text |
| `axis-border-soft` | `#d2d2d7` | Subtle borders |
| `axis-border-strong` | `#86868b` | Form and selected boundaries |

## UI Principles

- Use neutral surfaces as the foundation.
- Reserve blue for real action, links, and selected states.
- Use restrained borders and clear spacing instead of depth effects.
- Keep cards and panels simple.
- Use 8px radius for most application controls and cards.
- Use larger radius only for high-level dashboard tiles or special controls.
- Keep tables dense but readable.
- Use clear spacing and alignment instead of decorative effects.

## Logo Direction

Axis ERP should use a minimal wordmark and symbol.

- Wordmark: `Axis ERP`
- Primary color: `#1d1d1f`
- Accent: `#0071e3`
- Symbol direction: a simple axis point, crosshair, or modular grid that implies business operations converging at one center.

Avoid complex illustrations, gradients, and overly colorful marks.

## Application Layout

Recommended structure:

- Left sidebar navigation
- Top utility bar
- Main content area
- Page header with title, description, and primary action
- Content panels on white surfaces
- Dashboard metrics in restrained tiles

## Dashboard Charts

Use Chart.js for chart rendering when statistics are implemented.

Charts should:

- Use muted neutral axes and labels.
- Use `#0071e3` as the primary series color.
- Use limited secondary colors only when multiple series are necessary.
- Avoid decorative gradients and depth effects.
