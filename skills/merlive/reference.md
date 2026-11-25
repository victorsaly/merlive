# Merlive reference

What only some diagrams need. SKILL.md has the everyday path.

## The Mermaid that is read

| Written | Read as |
|---|---|
| `flowchart TD`, `graph TD`, `TB` | Top to bottom |
| `flowchart LR` | Left to right |
| `BT`, `RL` | Drawn as `TD` and `LR`, with a note |
| `A[Text]`, `A(Text)` | A box |
| `A([Text])`, `A((Text))` | A start or end (a pill) |
| `A{Text}` | A rhombus, as wide and as tall as the boxes round it |
| `A{{Text}}`, `A[(Text)]`, `A[[Text]]`, `A(((Text)))`, `A>Text]` | A hexagon, a cylinder (a store of data, of the `data` kind), a subroutine, a double circle, a flag: each drawn as itself, in the footprint every box shares |
| `A[/Text/]`, `A[\Text\]`, `A[/Text\]`, `A[\Text/]` | The two that lean and the two trapezoids, drawn as themselves |
| `A["Text with (brackets)"]` | A quoted label |
| `A["one line<br/>and another"]` | A label in the author's own lines, up to four |
| ``A["`**Bold** and *italic*`"]`` | A Markdown string: its words and its own line breaks, drawn plain |
| `#quot;`, `#9829;` | An entity code becomes its character |
| `fa:fa-truck Shipped` | An icon is drawn beside its words. The drawing is Merlive's own (seventy-two of them, found by any name Font Awesome has used): nothing is fetched. One Merlive has no drawing for, or a brand's mark, is left out and named in a `note,` line |
| `A@{ shape: diam, label: "In stock?" }` | A box written the newer way, on one line or several. Its label is kept. Every shape in the rows above is drawn as itself, by any of Mermaid's names for it; a shape Merlive has no drawing for is a box |
| `A@{ icon: "fa:user", label: "Buyer" }` | A box with its label, and Merlive's own drawing of the icon beside it |
| `A@{ img: "…", label: "…" }` | A box with its label. The image is left out: a page of Merlive fetches nothing |
| `A@{ row: 1, column: 2 }`, `g@{ view: collapsed }` | Read past: placement is Merlive's, and a group is drawn open |
| `---` … `---` at the top | Front matter: its `title` is the picture's name, drawn above a still picture and as the heading of a page; Mermaid's own settings are read past |
| `accTitle: …`, `accDescr: …` | What the picture is called and what it shows, kept for readers who cannot see it |
| `A --> B`, `A --- B` | A link, with or without an arrowhead |
| `A -.-> B`, `A ==> B` | A dotted link, a thick link |
| `A --o B`, `A --x B`, `A <--> B`, `A o--o B`, `A x--x B` | A circle, a cross or an arrowhead at either end, drawn as written |
| `A ~~~ B` | An invisible link: its boxes are read, and no link is made. Where boxes go is Merlive's |
| `A -->\|Yes\| B`, `A -- Yes --> B`, `A -- "two<br/>lines" --> B` | A link with words |
| `A -. maybe .-> B`, `A == must ==> B`, `A ---> B` | Words in a dotted or thick link; an arrow drawn longer |
| `subgraph id["Title"]` … `end`, `g1 --> g2` | A group, drawn as a frame with its title; a link between groups joins the end of one to the start of the next. A group inside a group has a frame of its own inside the outer one |
| `A --> B --> C` | A chain |
| `A --> A`, `A -->\|again\| A` | A link from a box to itself: a small loop beside it. It is not one of the loops `%% step: … \| loop 1` counts |
| `A & B --> C & D` | Every box before the link, linked to every box after it |
| `A e1@--> B`, `e1@{ animate: true }` | A link with an id is a link; what Mermaid sets on it (animation, a step, a curve) is read past |
| `class A,B rework`, `A:::rework` | The kind of a box: its colour comes from the design's `kinds` |
| `classDef red stroke:#c62828` | The class's colour is read for what it means: a kind the design has no colour for takes the design's own nearest colour (this red becomes `risk`) |
| `style B stroke:#c00,stroke-width:3px,stroke-dasharray: 5 5` | What the author's own style means is kept: a broken outline, a heavy one, and a colour, named for its hue (`red`) and drawn in the design's own nearest colour. The fill is the design's |
| `linkStyle 0 stroke:#c00,stroke-width:4px` | The same for a link, by the number Mermaid gives it: heavy, broken, and in the design's nearest colour |
| `classDef default …`, `linkStyle default …` | Read past: a look for every box or every link is the design's |
| `click`, `direction` | Read past |

Where the Mermaid is kept decides how it is found: fenced `mermaid` blocks in Markdown (`.md`, `.mdx`); the whole
of a `.mmd` file; and, in any other file (an `.astro` page, a script), a string between backticks that starts as
a flowchart does. A string put together with `${…}` when the page runs cannot be read.

Not read yet, each named in a `note,` line when met: `BT` and `RL`, which are drawn the other way round.
[What is and is not drawn](https://github.com/victorsaly/merlive/blob/main/docs/COVERAGE.md), feature by feature.

## A state diagram

`stateDiagram` and `stateDiagram-v2` are read into the same boxes and links as a flowchart, so everything else on
this page holds for them: the rules, the design, Merlive's own lines.

| Written | Read as |
|---|---|
| `Draft`, `state "Being written" as Draft`, `Draft : Being written` | A state: a box. Words given a line at a time are kept as lines |
| `Draft --> Sent`, `Draft --> Sent : send` | A transition: a link, with its words |
| `[*] --> Draft`, `Sent --> [*]` | Where it starts and where it ends: one pill each, saying `Start` and `End`. In Merlive's own lines they are `start` and `end` (`%% main: start>Draft>Sent>end`) |
| `state Review { … }` | A composite state: a group, with a start and an end of its own (`Review_start`, `Review_end`). A transition to it is drawn to where it starts inside, and one from it from where it ends |
| `Review : In review`, `state "In review" as Review {` | What a composite state is called |
| `state enough <<choice>>` | A decision, with its name or its words in it |
| `state split <<fork>>`, `state together <<join>>` | A box, with its name or its words in it |
| `note right of Draft : words`, `note left of Draft` … `end note` | The note on that box: what a reader sees on picking it |
| `direction LR` | The way the diagram runs. A composite state's own direction is read past |
| `classDef`, `class Held, Lost stopped`, `Held:::stopped` | Kinds, as in a flowchart |
| `%% words` after a line, `hide empty description`, `scale 350 width` | Read past |

Not read yet, named in a `note,` line when met: concurrency (`--`), whose regions are drawn as one. A composite
state inside another is a group inside a group.

## A class diagram

`classDiagram` and `classDiagram-v2` are read into the same boxes and links as a flowchart, so everything else on
this page holds for them: the rules, the design, Merlive's own lines.

| Written | Read as |
|---|---|
| `class Order`, or a name first met in a relation | A class: a box named by its name |
| `class Order["A purchase order"]`, `` class `Purchase order!` `` | A class with a label, or with a name no bare name could be. In Merlive's own lines it is the name without the backticks |
| `class Basket~Item~` | A class called `Basket<Item>`. What it is generic over is no part of its name: relations and Merlive's own lines say `Basket` |
| `Order : +String number`, `class Order { +String number … }` | A member: one row of the box. Rows that end in brackets are what the class does and come second; the rest are what it holds and come first. A class that only holds, or only does, has one compartment |
| `+`, `-`, `#`, `~` before a member; `total() Money` | Kept as written: who may see the member, and what it gives back |
| `List~Item~`, `List~List~Item~~` in a member | `List<Item>`, `List<List<Item>>` |
| `check()*`, `total() Money*`, `count()$`, `String prefix$` | The row ends in the words `{abstract}` or `{static}` |
| `class Payable <<interface>>`, `<<interface>> Payable`, `<<interface>>` inside the brackets | What the class is, over its name: `«interface»` |
| `Document <\|-- Order`, `Order --\|> Document` | Inheritance: a link with a triangle at the parent. It is drawn from the parent down to the child, whichever way it was written |
| `Payable <\|.. Invoice`, `Invoice ..\|> Payable` | Realisation: the same, dotted |
| `Order *-- OrderLine`, `Warehouse o-- Product` | Composition and aggregation: a filled or an open diamond at the class that holds |
| `Invoice --> Order`, `Order ..> PriceList` | Association and dependency: an arrow, on a solid or a dotted line |
| `Supplier -- Contact`, `Buyer .. Note` | A link with nothing at either end |
| `Supplier <--> Buyer`, `Bundle *--o Product` | A relation that says something at both ends |
| `Order "1" *-- "1..*" OrderLine : holds` | How many, beside each end, and the words on the link |
| `Payable ()-- Invoice`, `Order --() Printable` | A lollipop: a small box of its own for each class that offers it, named for the interface, marked `«interface»`, with a circle on its line. In Merlive's own lines it is `Invoice_Payable` |
| `namespace Buying { … }`, `namespace Auth["Signing in"] { … }` | A group of the classes declared in it, called by its label when it has one |
| A namespace inside another, `namespace Shop.Ordering.Buying { … }` | A group inside a group. A dotted name makes every group it spells out, each once, called by its last word; in Merlive's own lines a group is its whole dotted name |
| `note for Order "words"`, `note "words"` | A note drawn on the picture: a sheet with a folded corner, joined to its class by a dotted line, or to nothing. A `\n` or `<br>` in it is a new line. It is as tall as its words need |
| `classDef`, `cssClass "Order,Invoice" late`, `Order:::late`, `style Order …` | Kinds and outlines, as in a flowchart |
| `click`, `link`, `callback` | Read past |

Not read yet, each named in a `note,` line when met: a direction other than top to bottom (`direction LR`), since boxes of different heights
are only placed that way for now; a lollipop at both ends of one line. A line that is none of the above is said
with its line number and nothing is drawn from it.

## An entity diagram

A block that starts `erDiagram` is read into the same boxes and links as a flowchart, so everything else on this
page holds for it: the rules, the design, Merlive's own lines. An entity is a box that lists its attributes under
its name; a relationship is a link that says, at each end, how many.

| Written | Read as |
|---|---|
| `ORDER`, `ORDER-LINE`, `"Purchase order"` | An entity: a box. In Merlive's own lines it is named with `_` for whatever an id cannot hold (`%% note ORDER_LINE: …`, `%% main: Purchase_order>ORDER_LINE`) |
| `s[Supplier]`, `a["Supplier account"]` | An alias, shown in place of the name |
| `ORDER {` … `}` | Its attributes as a table under its name: a row for each, a column for types, one for names and one for keys when any has a key, ruled into cells with every second row shaded. Declared twice, the two lists are joined |
| `int number`, `string(40) reference`, `string[] barcodes`, `decimal(10,2) price`, `date? paid` | An attribute: its type, then its name, shown as written |
| `int number PK`, `string code PK, FK`, `string *code` | Its keys, after its name. A star before a name is a primary key, and is shown as `PK` |
| `string reference "Only 40 characters"` | Its comment, kept out of the table so the boxes stay narrow: it is in the note on its entity, after whatever note its author wrote (`reference: Only 40 characters`) |
| `SUPPLIER \|\|--o{ ORDER : receives` | A relationship: a link from the first entity to the second, with its words. They may be in quotes, empty, or left out |
| `\|\|`, `\|o` `o\|`, `}\|` `\|{`, `}o` `o{` | How many, at the end it is written at: one; none or one; one or more; any number. Either spelling at either end |
| `only one`, `1`, `zero or one`, `one or zero`, `one or more`, `one or many`, `1+`, `many(1)`, `zero or more`, `zero or many`, `0+`, `many(0)` | The same, in words |
| `--`, `to` | A relationship that gives the second entity its identity: a solid line |
| `..`, `optionally to` | One that does not: a dotted line |
| `SUPPLIER }o..o\| SUPPLIER : "buys from"` | A relationship from an entity to itself: a small loop beside it |
| `subgraph Buying` … `end`, `subgraph "Paying up"`, `subgraph pay ["Paying up"]`, `Buying \|\|--\|\| Paying : …` | A group, one inside another if written so, as in a flowchart; a relationship with a group goes to where it starts or from where it ends |
| `classDef late stroke:#c62828`, `class ORDER,INVOICE late`, `ORDER:::late` | Kinds, as in a flowchart. A box is of one kind: of several classes (`late,held`), the first |
| `style ORDER stroke:#c00,stroke-width:4px,stroke-dasharray: 5 5` | What the style says of its outline, as in a flowchart |
| `direction TB` | The way it runs. An entity diagram is drawn top to bottom for now: any other direction is read past, and said once. A group's own direction is read past |
| `title:` in front matter, `accTitle`, `accDescr`, `%%` comments | As in a flowchart |

Not read, each named in a `note,` line when met: attributes written on the line that opens them
(`ORDER { int number }`), and a line between the braces that is not a type and a name. A name written as Markdown
(`"A **firm** order"`) is drawn as plain words.

## A sequence diagram

A block that starts `sequenceDiagram` is read, placed and checked by rules of its own (S1 to S7, with D1 and D2).

| Written | Read as |
|---|---|
| `participant B as Buyer`, `actor B`, or a name first met in a message | Who is in it, left to right in the order named. An actor is a pill; `@{ "type": "database" }` is a box of the `data` kind; the other types are plain boxes |
| `A->B`, `A-->B`, `A->>B`, `A-->>B`, `A<<->>B`, `A-xB`, `A-)B` | A message: solid or dotted, with nothing, an arrowhead, an arrowhead at both ends, a cross or an open arrow |
| `A->>A: words` | A message to itself: a loop to the right |
| `A->>+B`, `B-->>-A`, `activate B`, `deactivate B` | A bar on a participant at work; a second on the same one sits beside the first |
| `Note right of A: …`, `Note left of A: …`, `Note over A: …`, `Note over A,B: …` | A note, on a row of its own |
| `loop`, `alt` / `else`, `opt`, `par` / `and`, `critical` / `option`, `break` … `end` | A frame round its rows, named, one inside another |
| `rect rgb(…)` … `end` | A highlight behind its rows, in the design's tint: the colour is read past |
| `box Aqua Buying` … `end` | A group of participants, framed and titled: the colour is read past |
| `create participant J`, `destroy J` | A participant that starts at the message that makes it, and ends in a cross |
| `autonumber`, `autonumber 10 5` | Each message numbered, from a start and by a step |
| `title: …`, `accTitle`, `accDescr`, front matter, `%%` comments, `<br/>`, `#9829;` | As in a flowchart |
| `link A: … @ url`, `links A: {…}` | Read past: a page of Merlive opens no links |

Not read yet, each named in a `note,` line when met: half arrows (`-|\`, `-//`) and a message to the middle of a
line (`()`). There are no `%%` lines of Merlive's own for a sequence: its page goes through the messages in order
without being told.

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
| `%% turn: no` | A flow written left to right that would be wider than a screen (1,100 px) is drawn top to bottom, and the command says so. This keeps it as written |

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
crossings. P5 no two lines share a path. P6 words fit. P7 link labels sit clear. P8 a group's name can be read. D1 contrast. D2 kinds can be told apart. Each is set out,
with what passes and fails, in `docs/PLACEMENT.md` of the repository.

A sequence diagram has its own: S1 participants in one row, one size, one step apart. S2 one message or note to
a row, evenly down the page. S3 a message's words beside its sender, off every lifeline. S4 a frame holds exactly
what is in it. S5 notes sit clear. S6 bars stack and never overlap. S7 names, words and notes fit. D1 and D2 as
above. They are set out in `docs/SEQUENCE.md`.
