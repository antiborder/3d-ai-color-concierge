# Project Guidelines for Claude

## Educational Slide Design

When creating or modifying educational slide components under `frontend/src/components/educational/slides/`:

- **Minimum font size: 14pt (approximately 18–19px).** Labels, body text, and captions must all meet this minimum. Smaller annotations inside SVG diagrams may go down to 12px only when space is critically constrained, but prefer 14px+.
- **Slide dimensions must fit typical mobile screens.** Target a max width of `min(320px, 90vw)` and keep the total slide height (including title and text summary below any diagram) within `80vh` so it never requires scrolling on a phone. SVG viewBoxes should use aspect ratios that are taller than they are wide (portrait), or close to square — avoid wide landscape layouts.
- **SVG diagrams:** Use `width="100%"` with `style="display: block; max-width: 260px; margin: 0 auto"` so they scale down on narrow screens.
- **All text must be i18n-aware.** Use `useTranslation` and add keys to both `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/ja.json`.
