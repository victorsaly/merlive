# Merlive reference

What only some diagrams need. SKILL.md has the everyday path.

## The Mermaid that is read

| Written | Read as |
|---|---|
| `flowchart TD`, `graph TD`, `TB` | Top to bottom |
| `flowchart LR` | Left to right |
| `BT`, `RL` | Drawn as `TD` and `LR`, with a note |
| `A[Text]`, `A(Text)`, `A[[Text]]` | A box |
| `A([Text])`, `A((Text))` | A start or end (a pill) |
| `A{Text}`, `A{{Text}}` | A decision (a box with cut corners, the same size as the others) |
| `A["Text with (brackets)"]` | A quoted label |
| `A["one line<br/>and another"]` | A label in the author's own lines, up to four |
| `A[("Orders")]` | A store of data: a box of the `data` kind |
| `accTitle: …`, `accDescr: …` | What the picture is called and what it shows, kept for readers who cannot see it |
| `A --> B`, `A --- B` | A link, with or without an arrowhead |
| `A -.-> B`, `A ==> B` | A dotted link, a thick link |
| `A -->\|Yes\| B`, `A -- Yes --> B`, `A -- "two<br/>lines" --> B` | A link with words |
| `A -. maybe .-> B`, `A == must ==> B`, `A ---> B` | Words in a dotted or thick link; an arrow drawn longer |
| `subgraph id["Title"]` … `end`, `g1 --> g2` | A group, drawn as a frame with its title; a link between groups joins the end of one to the start of the next |
| `A --> B --> C` | A chain |
| `class A,B rework`, `A:::rework` | The kind of a box: its colour comes from the design's `kinds` |
| `classDef red stroke:#c62828` | The class's colour is read for what it means: a kind the design has no colour for takes the design's own nearest colour (this red becomes `risk`) |
| `style`, `linkStyle`, `click`, `direction` | Read past: the look comes from the design |

Where the Mermaid is kept decides how it is found: fenced `mermaid` blocks in Markdown (`.md`, `.mdx`); the whole
of a `.mmd` file; and, in any other file (an `.astro` page, a script), a string between backticks that starts as
a flowchart does. A string put together with `${…}` when the page runs cannot be read.

Not read yet, each named in a `note,` line when met: a group inside a group (drawn as part of the outer one),
`A & B --> C`, a link from a box to itself.

## Merlive's own lines

All are Mermaid comments, anywhere in the block.

| Line | What it does |
|---|---|
| `%% note A: words` | What box `A` means. Shown when the box is picked, and printed as an appendix |
| `%% step: Title \| A>B>C \| words` | A step of the walkthrough along the links A to B to C |
| `%% step: Title \| loop 1 \| words` | A step along the shortest loop; `loop 2` is the next shortest |
| `%% step: Title \| - \| words` | A step with nothing lit, for an opening or closing remark |
| `%% main: A>B>C>D` | The path that gets the straight line. Without it, the longest path does |
| `%% side: left` | Branches and loops go to the left of the main path (above it, left to right). Default `right` |

A step's path must follow links that exist; one that does not is named in a `note,` line and that part is left out.

## The design file

`merlive.design.json` in the project's folder. `--setup` writes it from the project's own site, so most projects
never write one by hand. Everything in it is optional, and what is left out comes from Merlive's own look.

```json
{
  "name": "storm",
  "from": "src/styles/global.css",
  "modes": "both",
  "motion": "calm",
  "depth": "soft",
  "ground": "dots",
  "output": { "format": "html", "steps": true, "legend": true, "source": true },
  "font": "\"IBM Plex Sans\", system-ui, sans-serif",
  "weight": 500,
  "radius": 6,
  "light": {
    "bg": "#f4f6fa",
    "node": "#ffffff",
    "stroke": "#c3cad5",
    "text": "#18202b",
    "muted": "#566070",
    "edge": "#7a8696",
    "accent": "#0a5cc2",
    "kinds": { "decision": "#b87a00", "rework": "#a8327a", "vendor": "#5a4fcf" }
  },
  "dark": { "bg": "#11141a", "node": "#1a1f27", "text": "#eceef2" }
}
```

| Choice | What it sets |
|---|---|
| `modes` | `light`, `dark` or `both` (follow the reader's system). `dark` and `both` need dark colours |
| `motion` | `none`: nothing moves. `calm`: one dot follows a path when the reader presses play. `lively`: the path flows too |
| `depth` | `flat`: boxes lie on the page. `soft`: a shadow lifts them off it. Setup follows the site: `soft` only where the site has shadows |
| `ground` | `plain`: the page as it is. `dots`: the grid the boxes are placed on, shown faintly. Setup leaves a site's page `plain` |
| `output.format` | What is written for each diagram: `html` (a live page), `svg` (a still picture) or `both` |
| `output.steps` | Whether a page carries the walkthrough, when the diagram has `%% step` lines |
| `output.legend` | Whether a page carries the legend of kinds of box |
| `output.source` | Whether a page carries the Mermaid it was drawn from |
| `font`, `weight`, `radius` | The face (a list of faces), its weight (100 to 900) and a box's corner in px (0 to 40) |
| `from` | Where setup read the colours. Not used in drawing; it says where to look again |

| Colour | What it is |
|---|---|
| `bg` | The page behind the drawing |
| `node`, `stroke` | A plain box's fill and its edge |
| `text`, `muted` | Words, and quieter words (link labels, the legend) |
| `edge` | A line |
| `accent` | The picked thing and the path being shown |
| `kinds` | A colour for each kind of box that means something |

- Colours are six-digit hex. A colour that is not is refused, with its name.
- `kinds` names are yours: any name used in a `class` line can have a colour. A box's edge is its kind's colour,
  and its fill is that colour thinned into `node`. Merlive's own kinds are `decision`, `terminal` (a start or
  end), `rework`, `external`, `data` and `risk`.
- **Light and dark.** A file that sets `light` and no `dark` gives one look whatever the reader's system asks
  for. Give `dark` too for both. A file that touches no colour (only `radius`, say) keeps Merlive's light and dark.
- `font` is a CSS font stack. The page fetches nothing, so name faces the reader is likely to have, and end with
  a system face.
- `motion`: `none`, `calm` or `lively`.
- `--check` holds the file to two rules before anything is drawn: D1, words and lines can be read, and D2, the
  kinds can be told apart, also by people who do not see red and green apart. The message names the colour.

## What setup reads

`--setup` looks, in this order, at: the site, stylesheet or folder of stylesheets named with `--from`; the folder
of the project's own stylesheet with the most to say (any `.css` up to five folders down, leaving out what was
installed or built), all of its sheets read together; the `homepage` in
`package.json`, unless it is where the code lives (GitHub and the like). From a site's address it reads the page,
the stylesheets it links to and the styles written in it.

| It looks for | Where |
|---|---|
| Page and text colours | What `body` sets, following `var()`; else tokens named like `--bg`, `--background`, `--paper`, `--text`, `--foreground`, `--ink` |
| Accent | The colour of links when it is a colour; else a token named like `--accent`, `--primary`, `--brand`, `--mark`; else the strongest colour among the tokens |
| Dark mode | The same, inside `prefers-color-scheme: dark`, `.dark` or `[data-theme="dark"]` |
| Face, corner and shadows | `body`'s `font-family`; the most common `border-radius`; whether anything has a `box-shadow` |

Colours are read as hex, `rgb()`, `hsl()`, bare `H S% L%` and `oklch()`. What a diagram needs and a site does not
have (a box's fill and edge, lines, quiet text, the colours of kinds) is made from the page and text colours and
held to both colour rules. A site with one look gets diagrams with one look. Nothing found is never guessed: the
script says so and draws in Merlive's own look.

It does not yet read colours kept only in a Tailwind config, in a component's own `<style>`, or set by script.

## How it ends

| Ends with | Means |
|---|---|
| 0 | Every flowchart was drawn (or, with `--check`, would be) |
| 1 | A diagram broke a rule and was not written; the rule and the place are named |
| 2 | Something is missing: the file, an option's value, the design file |
| 3 | The file has no flowchart to draw |

## The rules it checks

P1 the main path is straight. P2 boxes are one size with room between. P3 no line through a box. P4 few
crossings. P5 no two lines share a path. P6 words fit. P7 link labels sit clear. D1 contrast. D2 kinds can be told apart. Each is set out,
with what passes and fails, in `docs/PLACEMENT.md` of the repository.
