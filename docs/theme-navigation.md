# Theme persistence across project navigation

## Incident (2026-08-04)

Selecting light mode on the Junimo homepage and then opening Remalt, GreenPost or Project Doru showed the project page in dark mode.

## Root cause

The bulb kept the selected theme only in its client-side effect and initialized new mounts from the URL query string, which normal project links do not include. More importantly, unmounting the homepage bulb during an internal route change explicitly reset the document theme to dark. Project pages do not render the bulb, so they had no component-level state to restore the user's choice.

## Fix

- Store the selected `dark` or `light` value in `localStorage` under `junimo-theme`.
- Restore the stored value from the shared layout before each page is painted.
- Keep the selected target when the bulb unmounts during an in-progress transition instead of resetting to dark.
- Preserve `?theme=light` and `?theme=dark` as explicit URL overrides for QA and shared links.

Sushi files and Sushi-specific navigation were intentionally left unchanged.

## Regression check

Run `pnpm qa:theme-persistence` with the Junimo development server running. The check selects light mode, visits `/remalt`, `/greenpost` and `/project-doru`, verifies their light palette, reloads Remalt, then verifies dark mode also survives a later navigation.
