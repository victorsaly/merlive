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
| `A --> B`, `A --- B` | A link, with or without an arrowhead |
| `A -.-> B`, `A ==> B` | A dotted link, a thick link |
| `A -->\|Yes\| B`, `A -- Yes --> B` | A link with words |
| `A --> B --> C` | A chain |
| `class A,B rework`, `A:::rework` | The kind of a box: its colour comes from the design's `kinds` |
| `classDef`, `style`, `linkStyle`, `click`, `direction` | Read past: the look comes from the design |

Not read yet, each named in a `note,` line when met: `subgraph` outlines (the boxes inside are still placed),
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

The colours are the project's own. `merlive.design.json` in the project's folder sets them; everything in it is
optional, and what is left out comes from Merlive's own look.

```json
{
  "name": "storm",
  "font": "\"IBM Plex Sans\", system-ui, sans-serif",
  "weight": 500,
  "radius": 6,
  "motion": "calm",
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
