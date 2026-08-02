# Reference analysis

Captured again on 2026-08-02 with Chrome headless through Playwright at 1440 x 1000 and 390 x 844. The source captures are in `artifacts/references/`. The measurements below come from the rendered desktop pages, not HTML-only inspection.

## Paco Coursey

Source: <https://paco.me/>

- Content width: the rendered main column measured approximately 1,072px, centered at about x=184px. The readable text inside it is split into three columns of roughly 192px with generous gutters.
- Type: body text is 16px with an unusually tight 18.4px line height. There is no oversized display headline; the name and section headings stay in the 14-16px range. Approximately three visible text scales carry the page: 16px body, 14px section/link text, and a restrained italic serif accent.
- Spacing rhythm: the desktop page uses about 70-90px between the intro, the three-column work group, the “Now” writing, and “Connect”; the footer sits with a large but quiet final gap. Mobile keeps roughly 34px side padding and the same sequence without trying to fill the screen.
- Project presentation: projects are text links with one-line descriptions inside the Projects column. There are no thumbnails, cards, case-study frames, metrics, or project hero sections.
- Navigation density: no visible navigation bar. The name, writing, project, and contact links are the navigation.
- Colour count: almost entirely black text on white, with a quiet grey secondary colour and black link underlines. No accent colour system is needed.
- Borders: no visible layout borders in the captured page. Underlines belong to links and remain semantic.
- Interaction behaviour: native link underlines and external-link affordances do most of the work. The page does not need scroll-triggered motion to feel authored.
- Deliberately absent: no hero theatre, portfolio cards, large imagery, skill list, status indicator, résumé framing, or “available” claim.
- Why it feels personal: the site is mostly a point of view written in first person, then a short list of things the person actually made or is thinking about. The alignment and restraint feel like a decision rather than a template.

## Emil Kowalski

Source: <https://emilkowal.ski/>

- Content width: approximately 644px, centered at x=398px. The mobile column expands to the viewport with consistent side padding rather than becoming a desktop grid.
- Type: body text is 16px with a 24px line height. The visual hierarchy uses roughly three sizes: 16px identity/section titles, 16px project titles, and 14-16px grey descriptions. There is no display type.
- Spacing rhythm: the intro begins after about 230px of top space; section groups are separated by roughly 120-160px. Within a group, each project is compact, with about 24-36px between items. Mobile preserves the same vertical pacing and lets the page become long instead of compressing the type.
- Project presentation: a vertically ordered list of named projects and one-sentence explanations. Writing is a second equally legible list. No image stage or decorative container is used.
- Navigation density: no visible navigation bar. The identity block and section sequence are enough.
- Colour count: black, a medium grey for descriptions, a near-white surface, and a dark newsletter button. There is no branded accent colour.
- Borders: visible borders are limited to the newsletter input/control and small interactive form details. They do not define the page sections.
- Interaction behaviour: text links and the newsletter control provide the useful interaction. There is no automatic entrance choreography.
- Deliberately absent: no giant statement, visual dashboard, numbered sections, filter controls, or portfolio marketing copy.
- Why it feels personal: the information hierarchy mirrors what Emil cares about: what he is doing today, small tools, writing, and a simple way to stay in touch.

## Rauno Freiberg

Source: <https://rauno.me/>

- Content width: the main surface is full viewport width, approximately 1,440px on desktop. The design is a horizontal sequence of panels rather than a centred document column.
- Type: the rendered desktop has a 32px introductory statement and roughly 720px display type for the oversized panel words, plus small utility text. There are about four functional scales, but the 720px type is an object in the composition rather than reading copy.
- Spacing rhythm: the page is organized as a shallow horizontal strip at the top of a very tall scrollable canvas. The mobile capture keeps the panel strip rather than collapsing it into a normal stacked site.
- Project presentation: projects, details, notes, and contact information are individual art-directed panels. The content is the panel system; there are no repeated portfolio cards.
- Navigation density: tiny utility labels and a compact menu/control area. Navigation is part of the object, not a conventional sticky bar.
- Colour count: black and white carry the structure, with a deliberately small set of yellow, orange, cobalt-blue, and red accents inside specific panels.
- Borders: panel edges and the horizontal track provide the visible structure. The lines are functional because they define the movable units.
- Interaction behaviour: horizontal movement, cursor-like symbols, and direct panel manipulation are the central interactions. They are user-triggered rather than automatic scroll reveals.
- Deliberately absent: no conventional hero-to-project landing page, no card grid, no generic dashboard mockups, and no generic “selected work” section.
- Why it feels personal: the entire site is a singular interaction object with a point of view. It does not pretend to be a reusable portfolio system.

## Brian Lovin

Source: <https://brianlovin.com/>

- Content width: the readable content is approximately 640px, visually centered around x=400px on desktop even though the page canvas is full width. The mobile content uses about 14px side padding.
- Type: body is 16px with a 24px line height; the main identity heading is approximately 24px with a 32px line height. The page uses about four visible scales: 16px body, 24px intro, smaller grey section labels, and compact icon/link text.
- Spacing rhythm: profile block, social links, writing list, and projects list are separated by roughly 60-90px. List rows are dense, about 12-20px apart, so a recruiter can scan it quickly.
- Project presentation: project names are inline with muted descriptions. There are no project images, cards, case-study previews, or duplicated metadata blocks.
- Navigation density: a single compact menu control at the top left of the captured page; the content itself carries the navigation.
- Colour count: black text, soft grey secondary text/icons, white background, and a small amount of near-black UI chrome. No saturated accent is necessary.
- Borders: many computed borders belong to invisible or low-contrast interactive wrappers, but the screenshot reads as largely borderless. Rules never become decorative section dividers.
- Interaction behaviour: social icons, writing links, project links, and the compact menu. Hover/focus states are enough; the page does not animate every section into view.
- Deliberately absent: no résumé table, no skill chart, no hero image, no “available” indicator, and no visual case-study theatre.
- Why it feels personal: the opening sentence is specific and current, while the lists show a recognizable set of interests rather than a generalized skills inventory.

## Carl Barenbrug

Source: <https://carlbarenbrug.com/>

- Content width: the rendered desktop content measured approximately 918px centered at x=261px. The article itself is a narrow mono column inside a broader three-column information layout.
- Type: body is approximately 15px with a 20px line height, using one mono family throughout. The heading is not a display headline; it is also about 15px. The design uses only two or three scales and relies on column placement and density instead of type contrast.
- Spacing rhythm: long-form text is grouped into compact paragraphs with visible blank lines. The top identity area, article, archive link, and lower information columns are separated by large intentional gaps, often 100px or more.
- Project presentation: current and archived projects appear as text lists in the lower information grid. No screenshots, cards, browser frames, or marketing summaries appear in the main article.
- Navigation density: approximately 14 visible text links in the lower information area, organized by categories such as Experience, Projects, Presence, and Sync.
- Colour count: near-black mono text, two grey levels, and white. There is no accent colour system.
- Borders: two meaningful vertical rules structure the article and lower columns. They are layout scaffolding, not repeated decoration.
- Interaction behaviour: archive and external links are direct; the small “Lab” control and lower lists are the only visible object-level interactions.
- Deliberately absent: no large hero, no cards, no animation choreography, no colour-coded project taxonomy, and no image gallery.
- Why it feels personal: the site reads like an authored document with an opinionated voice, unusual density, and a specific set of references. Its typography is a constraint applied consistently, not a style layer added to a template.

## Lee Robinson

Source: <https://leerob.com/>

- Content width: the body canvas measures approximately 650px and the readable main column approximately 586px, centered around x=422px on desktop.
- Type: the body uses a serif face at 16px with a 24px line height. The name is approximately 24px with a 24px line height. Roughly three scales are visible: 16px paragraphs, 24px identity, and the same body size for the link list.
- Spacing rhythm: paragraphs are separated by about 22-28px, with a slightly larger gap before the link list and the closing note. The entire page is short enough to understand in one calm pass.
- Project presentation: projects are not staged as projects; they appear as a list of links inside a personal essay. This makes the work feel like part of a life rather than a catalogue.
- Navigation density: no visible navigation bar. Links are embedded in the writing.
- Colour count: black serif text and blue-grey link/bullet details on white. No decorative accent palette.
- Borders: no layout borders. Link underlines and small list markers carry the affordance.
- Interaction behaviour: native links only. There is no motion layer competing with the writing.
- Deliberately absent: no portfolio hero, no image gallery, no technical stack list, no metric callouts, and no section numbering.
- Why it feels personal: the biography includes family, interests, and a concrete explanation of what the author is trying to make understandable. The site earns credibility through voice and specificity.

## Design conclusions

The common thread is not “editorial styling.” It is reduction: one column or one purposeful object, a small type system, direct links, and copy that sounds like one person. The final homepage uses Paco and Emil as the primary structural references: compact identity copy, a short project list, a small current-state section, and direct links. Brian and Lee reinforce the value of a readable personal voice. Carl and Rauno were intentionally not used as layout directions.

The final implementation does not use a grain layer, cobalt underline, numbered section system, oversized hero, fake dashboard, sticky blurred header, alternating project blocks, or automatic reveal animation.
