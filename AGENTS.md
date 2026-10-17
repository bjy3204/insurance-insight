<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI conventions requested by the user
- Use the existing custom dropdown components for all dropdowns; do not introduce native HTML select controls.
- Use the project icon library for arrows, plus, minus and other action symbols. Add actions should use icon buttons with accessible labels and titles.
- Apply interface changes to both desktop and mobile.

- Before changing controls, inspect matching controls in other menus and reuse the shared component. Match dropdown anchoring, menu width, spacing, arrow/icon size and placement, and add-button placement; do not assemble bespoke approximations.

- Omit trailing periods in short interface notices, as requested by the user.

- Print icons use the shared light gray (#94a3b8) resting color and dark gray (#334155) on hover or keyboard focus. Do not use blue hover for print icons.

- Preserve bottom-left floating launchers: original circular shape, 56px control and 24px icon. Exclude these launchers from ordinary 44px icon-button rules.
