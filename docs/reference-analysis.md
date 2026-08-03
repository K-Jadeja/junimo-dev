# Reference analysis

Captured on 2026-08-03 with Playwright at 1440 x 1000 and 390 x 844. The repository capture matrix is in `artifacts/references/`; the ZeroLimits and trucs.ai captures are in `artifacts/reference-audit-2026-08-03/`. These notes come from rendered pages, visible copy and responsive screenshots rather than HTML-only inspection.

## Shared language

The references are not trying to persuade visitors with portfolio language. They introduce a person, state what they do now, list things they made, and let specificity carry the personality.

- Short declarative sentences beat role labels and marketing claims.
- Project entries use a name plus one useful sentence. They do not explain the whole project on the homepage.
- Writing titles are concrete and slightly opinionated: “You Don’t Need Animations”, “Agents with Taste”, “How Does Image Compression Work?”, “Coding Agents & Complexity Budgets”.
- Personal details appear as a paragraph or a small “Now” section, not as visual widgets.
- The page behaves like a maintained document: a small type system, a readable measure, generous section gaps and very little interface chrome.

## Paco Coursey

Source: <https://paco.me/>

- The readable article is approximately 640px wide on desktop, with 24px side gutters on the 390px view. The body uses 16px text with an approximately 18.4px line height.
- The copy moves from craft (“Crafting interfaces.”) to current work, past work, things made, “Now” and “Connect”. The personal paragraph about dance music is what makes the otherwise spare page feel authored.
- The work model is three text columns on desktop: Building, Projects and Writing. There are no thumbnails, cards, browser frames or metrics.
- Inline links are underlined and semantic. Junimo borrows the content rhythm, not this link treatment, because its chosen direction uses no resting underlines.
- On mobile the three-column work group becomes cramped and visually clipped. It is useful as a desktop composition reference, not as Junimo’s responsive layout.

## Emil Kowalski

Source: <https://emilkowal.ski/>

- The content column is approximately 692px wide with large top whitespace and wide gaps between Today, Projects, Writing, Newsletter and More.
- The voice is plain and specific: “I like to build things for designers and developers” and “think deeply about the user interface, how it looks, feels, behaves.”
- Project and writing entries are title plus a concise subtitle, with no role, year, thumbnail or explanatory card.
- Whole rows receive a quiet hover wash. This is a better interaction model for Junimo than yellow underlines or preview controls.
- The page has many entries but still feels minimal because every entry has the same low-friction shape.

## ZeroLimits.dev

Source: <https://zerolimits.dev/>

- A compact sans index with an approximately 48rem cap, a large site name, a short personal tagline, direct contact links and a Projects list.
- Project rows put the title and description close together and keep the page free of staged visual assets.
- The copy is memorable without being long: “The most interesting boring person you’ve ever met.” Junimo should aim for that level of specificity rather than add more professional labels.

## trucs.ai

Source: <https://trucs.ai/>

- A raw technical document: mono type, visible rules, definition-list indentation and direct experiment names.
- It demonstrates that an ultra-minimal site can have a strong point of view when the writing is concrete and the structure is honest.
- It uses underlined links heavily. That raw document quality is useful, but the link treatment is intentionally not carried into Junimo.

## Lee Robinson

Source: <https://leerob.com/>

- A narrow serif reading column with no display hero or navigation bar.
- The copy establishes identity in two paragraphs: current work, previous work, years of experience, a teaching motive and a personal interest in music.
- Writing is introduced with “Some of my favorite writing includes:” and then a simple list of specific titles.
- Junimo borrows the clarity and point of view, while keeping its existing dark sans system and bulb.

## Brian Lovin

Source: <https://brianlovin.com/>

- A simple self-description followed by named collections such as Writing, Listening, Sites and Projects.
- The titles are the personality: article names, tools, apps and things in rotation do more work than a biography block.
- This supports giving Junimo a Writing section now and leaving room for music, games or other interests later without adding a new visual component for each category.

## Copy decisions for Junimo

- Keep: “I build AI products and the systems underneath them.” It is specific, short and consistent with the site’s visual systems theme.
- Keep: “Founding Engineer / Technical Lead at Remalt. Building GreenPost on the side.” It states the present without adding location, exploration language or a role kicker.
- Projects use existing factual descriptions: Remalt, GreenPost and Project Doru.
- Writing starts with the pinned X thread titled `Building an AI agent with LangChain`, described as a tutorial thread about turning natural language into actions across 5,000+ apps with Zapier. Source: `https://x.com/krsnalyst/status/1666524859713703951`.
- Future personal details belong in Now as one or two sentences. Raw preferences are better than fabricated “personality copy”; music, games, current curiosities and a sign-off can be added when supplied.

## Junimo implementation direction

The homepage keeps the black background and warm bulb as its one distinctive visual decision. Everything else becomes a quiet text index:

```text
Krishnasinh Jadeja

I build AI products and the systems underneath them.

Projects
Writing
Now
Experience
More
```

The implementation deliberately removes homepage screenshots, preview toggles, project-role metadata, the label rail, instructional bulb text, resting link underlines and a bordered footer. New projects and writing entries use the same data-driven title-plus-description component so the page can grow without becoming a catalogue UI.
