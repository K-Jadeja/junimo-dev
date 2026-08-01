# Portfolio build notes

## Direction

The site uses a quietly expensive editorial system: warm ivory paper, near-black typography, thin rules, one cobalt signal colour, and dark project media stages. The 12-column grid is used as a compositional scaffold rather than a reason to make a card grid. The project media is intentionally the visual anchor for each section.

The interaction vocabulary is deliberately small:

- a short reveal on section entry;
- a 1.8% media scale on hover;
- restrained arrow and rule movement;
- a keyboard-safe mobile navigation drawer;
- near-viewport media playback with reduced-motion support.

The page remains fully legible with motion disabled.

## Reference takeaways

- Paco Coursey: quiet information architecture, direct copy, generous vertical pacing.
- Emil Kowalski: interaction and component details should feel considered rather than decorative.
- Carl Barenbrug: editorial hierarchy and strong typographic composition.
- Rauno Freiberg: small details should be consistent and purposeful.
- Brian Lovin and Lee Robinson: a personal site can stay compact when the work and writing are specific.

## Temporary media

The public Remalt page was inspected as a public marketing surface. GreenPost and Project Doru were reachable as public client pages, but a reliable visual browser capture was not available in the build environment. The three temporary assets therefore use original, project-specific compositions based only on the supplied project facts and public product language. They do not depict private dashboards or user data.

Editable sources and derivatives live together:

```text
public/projects/remalt/remalt-temporary.svg
public/projects/remalt/remalt-temporary.webp
public/projects/greenpost/greenpost-temporary.svg
public/projects/greenpost/greenpost-temporary.webp
public/projects/project-doru/project-doru-temporary.svg
public/projects/project-doru/project-doru-temporary.webp
```

Future demo replacement is documented in the root README and only requires changing the relevant `media` object in `src/data/portfolio.ts`.
