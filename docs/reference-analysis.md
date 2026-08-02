# Reference analysis

Captured on 2026-08-02 with the installed Chrome executable through Playwright at 1440 x 1000 and 390 x 844. Source captures are stored in `artifacts/references/`; these notes come from rendered pages rather than HTML-only inspection.

## Paco Coursey

Source: <https://paco.me/>

- Content width: approximately 1,072px centered at x=184px on desktop. Readable content is divided into three narrow columns with generous gutters.
- Type: Söhne/Inter-style sans at 16px with a tight 18.4px line height. The name and section labels stay near 16px; there is no display-scale hero. Three visible functional scales are enough.
- Rhythm: the identity block leads into the three-column work group after roughly 70-90px. The Now and Connect blocks use larger separations, but the page remains short and scannable.
- Work: text links with one-line descriptions. No thumbnails, cards, metrics, browser frames, or staged case-study sections.
- Navigation: no visible navbar. The name, links, and content lists carry the navigation.
- Colour and borders: black, white, quiet grey, and semantic link underlines. No branded accent system or decorative rules.
- Personality: first-person writing, current interests, and a small list of things actually made make it feel maintained by one person rather than generated from a portfolio schema.

## Lee Robinson

Source: <https://leerob.com/>

- Content width: approximately 586px inside a roughly 650px body canvas, centered around x=422px on desktop.
- Type: STIX Two Text at 16px with a 24px line height. The name is approximately 24px. The hierarchy is carried by readable paragraphs and link lists, not display type.
- Rhythm: compact paragraph gaps around 22-28px, larger gaps between thought groups, and no theatrical first viewport.
- Work: projects appear as links inside a personal essay/list rather than as a catalogue. There are no images, dashboard frames, skill lists, or metric callouts.
- Navigation: no visible navigation bar. Embedded links and the sequence of writing do the work.
- Colour and borders: dark text on white with muted blue-grey link details. No layout borders or accent palette.
- Personality: specific biographical detail and a clear point of view make the site feel like a personal document, not a service page.

## Secondary reference checks

Rauno Freiberg, Brian Lovin, Carl Barenbrug, and Emil Kowalski were also captured in the same Chrome pass. Their useful shared lessons were compact type systems, direct links, intentional whitespace, and interaction that is limited to meaningful objects. Their more experimental layouts, mono-heavy systems, or editorial art direction were not used for the current homepage.

## Current design conclusion

The current site takes Paco's compact sans rhythm and wide desktop alignment, then borrows Lee's calm personal voice and readable paragraph measure. The dark palette and warm bulb are original to Krishnasinh Jadeja's site. The bulb is deliberately the only expressive object; the rest stays list-based, quiet, and easy to scan.

The implementation does not use a conventional navbar, oversized agency hero, bento grid, grain, fake dashboard, repeated reveal choreography, or a second accent system.
