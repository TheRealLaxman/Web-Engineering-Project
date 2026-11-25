# Design tokens

Tailwind v4 reads these CSS variables through `@theme inline` in `src/index.css`. The `data-theme="dark"` attribute set by `ThemeContext` switches the raw values.

| Token | Light value | Dark value | Tailwind utility | Usage |
| --- | --- | --- | --- | --- |
| `--bg` | `#f8fafc` | `#0b1220` | `bg-bg` | Page background |
| `--surface` | `#ffffff` | `#131c2e` | `bg-surface` | Cards, header, buttons |
| `--surface-alt` | `#eef2f7` | `#1e293b` | `bg-surface-alt` | Hover, active nav, notices, badges |
| `--text` | `#0f172a` | `#e2e8f0` | `text-fg` | Headings and body copy |
| `--muted` | `#64748b` | `#94a3b8` | `text-muted` | Secondary text and labels |
| `--primary` | `#0ea5e9` | `#38bdf8` | `text-primary`, `bg-primary` | Links, badges, focus outlines, primary buttons |
| `--primary-contrast` | `#ffffff` | `#06202e` | `text-primary-contrast` | Text on primary buttons |
| `--border` | `#e2e8f0` | `#243049` | `border-line` | Borders and dividers |
| `--danger` | `#b42318` | `#fca5a5` | `text-danger` | Form errors |
| `--radius` | `0.75rem` | `0.75rem` | `rounded-card` | Shared corner radius |
