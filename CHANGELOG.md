# Changelog

## 0.5.2 (unreleased)

- **A group's name sits beside the line into its frame**, not with the line behind its letters. Where a line
  comes into a frame through where its name would go, the name wraps narrower, to three lines, to sit beside it,
  and the frame keeps the room for those lines ("Checks before sending", "Build the agent", "Back office"). A
  name that fits beside no line (a single long word, a line each side) is still on a plate, as before.

## 0.5.1 (2026-11-28)

What 0.4.0 and 0.5.0 left in flowcharts.

- **A class may have a hyphen in its name** (`classDef read-only …`, `class B read-only`, `A:::read-only`), as a
  kind named with `%% kind read-only: …` already could. A hyphen counts only between letters, so `A:::x-->B` is
  still a link.
- **The main path takes the usual way, not the longest.** A link with words out of a box that also has one
  without ("daily limit gone" beside the plain way on) is the exception, and the main path no longer takes it,
  however long its way is: Groq, then the answer, is the straight line, and the fallback to OpenAI sits beside it.
  Of two ways as long, it takes the one that reaches more of the flow, so a note is no longer a class diagram's
  main path. P1 refuses a main path that takes an exception, unless `%% main:` named it.
- **A group's name wraps in a flow too**, as it does on a grid: to three lines at the left of its frame, the
  frame taller by the lines it takes, instead of running past a narrow frame ("Checks before sending", a C4
  boundary's "Buying [department]", a deployment node's "Buyer's phone [iOS or Android]"). P8 holds every frame's
  name inside it, in a flow as on a grid. Left to right, the lane beside the frame moves over for the name's
  lines; a word longer than its frame (`Internationalisation`) makes the frame wider, and what is beside it moves
  over (review of pull request 12).
- **A design file may give a colour to a kind with a hyphen in its name** (`"kinds": { "read-only": "#445566" }`).

## 0.5.0 (2026-11-28)

More kinds that the two placements there are can draw: mindmaps, kanban boards, timelines and packets.

- **Mindmaps are drawn**, as a tree grown from its root to the right: every shape Mermaid has for a node (a bang
  and a cloud in the nearest there is, and said), icons, classes, bold and italic.
- **Kanban boards are drawn**: columns side by side, cards down each, a card's ticket, who has it and its
  priority listed under its words. An empty column keeps its name.
- **Timelines are drawn**: periods in a row with their events under them, sections as groups round their
  periods, an arrow from each period to the next, left to right or top to bottom.
- **Packets are drawn**: each field as wide as the bits it takes, its bits over its name, in rows of as many
  bits as the packet says. A field that runs past the end of a row is drawn in parts, and each part says so.
- **A tree is placed as a tree.** What a box leads to keeps together, in lanes of its own, and the box is in line
  with the first of them, so no line of a tree crosses another however many branches it has.
- **A grid may say its own measures**: its narrowest column, the room between its cells, and that nothing runs
  between them. A block on a grid may list rows and carry a line over its name.
- **A timeline too wide for a screen runs on in bands.** Nine periods were 1592 px across; they are now five and
  four in two bands, with time's arrow running round from the end of one into the top of the next. With sections
  a band is cut only between two. The command says so; `%% wrap: no` keeps one row.
- **A long name of a frame on a grid wraps.** A timeline's section named in a sentence made every column of the
  timeline as wide as the sentence (469 px); its name now goes onto up to three lines at the left of its frame, and
  the columns are 180 px.
- **No line runs along the edge of a frame (P5).** A link into a section of the next band ran two pixels inside the
  top of its frame; links on a grid now take the gap outside the frames round the box they go into.
- **A packet is about as wide as Mermaid draws it.** A TCP header was 2408 px across; it is 1140. A field is a
  cell, which keeps 4 px of room either side of its words where a box of a flow keeps 14, and fields sit 4 px apart
  as Mermaid's do: P2 holds the blocks of a grid with nothing linked, whose author set its gap, to their cells
  and to not lying on one another. P6 holds the line of bits over a field's name to the field's own width, so a
  column of a bit no longer has to be as wide as "192–255".
- **A box is called what it is.** The legend and a picked box said "Step" on a board, a class diagram, an entity
  diagram, a mindmap and a packet; they now say "Card", "Class", "Entity", "Idea" and "Field" (a timeline's
  "Event" moves to the same place), unless `%% kind step: …` says otherwise. A page with no lines asks only for a
  box to be picked, and a picked box no longer says the flow starts and ends there.

## 0.4.0 (2026-11-26)

What a real project's documents showed: diagrams hidden behind the panel, words adrift from their lines or
squeezed into a column, a legend that said "Red", and code in a face the site does not use.

- **A drawing too wide to sit beside the panel has the panel above it.** The column beside the panel is 692px;
  a drawing that would not fit it even shrunk as far as it may be (to 80%) was partly behind the panel, or had to
  be scrolled sideways to find its last boxes. The steps and the picking now sit above it, side by side, and the
  drawing has the page's width. The same for a sequence diagram.
- **Words beside a line that runs along the flow stay by their line.** They were centred on a width reckoned from
  an average glyph; in a narrower face (a hand-lettered one, say) they drifted away from the line. They are now
  drawn from the side next to it.
- **A link's words are not squeezed into a column.** Left to right, the room between two ranks is as wide as the
  words on a link straight across it. P7 now fails a label wrapped again into more than two lines, and more
  than it wraps to anyway, and says to shorten it.
- **`%% kind red: Read-only data` says what a kind of box means.** The legend and a picked box say it instead of
  "Red". A kind its author named for a colour, with no such line, is named in a `note,` line that says how.
- **Code is set in the site's own face for code.** Setup reads the `font-family` of `code` and `pre`, writes it
  as `mono` in the design file, and the Mermaid a page shows and the rows a class lists use it. An
  entity's table stays in the page's own face, which its columns are measured for.
- **The agent offers the choices once, after setup.** Motion, look, output and steps, each with setup's own as
  the recommendation (SKILL.md, section 5). A colour, a face or a corner is still never asked: it is read.

## 0.3.0 (2026-11-25)

More kinds of diagram that are boxes and links: requirement, C4, architecture and block diagrams.

- **Requirement diagrams are drawn.** The six kinds of requirement and elements, each saying what it is over its
  name, its text as a sentence under it, its id, risk and verify method as rows, and all seven relationships,
  written either way round.
- **C4 diagrams are drawn.** People, systems, containers and components with what they are, their technology
  and what they do; databases and queues in their own shapes; what is outside the firm in the design's colour
  for it; boundaries and deployment nodes as groups, nested; relations with their technology.
- **Architecture diagrams are drawn.** Services with their icons, groups inside groups, edges with the
  arrowheads written. The sides an edge leaves by say which way the diagram runs.
- **Block diagrams are drawn.** One that is a flow is placed by rule. One whose meaning is in its grid is placed
  on that grid: every block in its cell, as wide as the columns it spans, spaces left empty, a block that holds
  others as a frame round a grid of its own, block arrows as arrows, and links at right angles round the blocks
  between.
- **A junction is a dot where lines meet.**
- **An author's colour never takes the colour of a kind already in the diagram.**
- **A box can say a sentence about itself**, wrapped under its name, the box as tall as it needs.
- **Words on a link have the room they need**: a row above a group's name where a link runs into the group,
  and room above or below the turn where a link with two lines of words turns between two ranks.
- **The line over a name fits its box**, and a pill taller than a plain box keeps flat sides for its words.
- **The contrast of a shaded row is checked only where a row is drawn shaded.**

## 0.2.0 (2026-11-25)

Class diagrams and entity diagrams, and much that Mermaid drew and Merlive did not: people and feet in a
sequence diagram, titles, notes, bold, bottom to top, regions side by side.

- **A sequence diagram's participants are drawn as what they are.** An `actor` is a figure; a boundary, a
  control, an entity, a database, a collection and a queue each have a drawing of their own. Each is drawn again
  at the foot of its lifeline, unless `mirrorActors: false`.
- **Half arrows and messages to the middle of a line are read and drawn.** No message is left out of a picture
  any more.
- **A group's title can be read.** In a sequence diagram it takes the design's quiet colour in light and dark,
  sits inside its frame and wraps to it. In a still picture it was black on any page.
- **Bold and italic are drawn.** What a Markdown string stresses (`**Urgent** order`, `Pick *today*`) stays bold
  or italic in its box, on whichever line its words are wrapped to. It was drawn as plain words.
- **A composite state's regions are drawn.** What `--` parts are frames side by side inside the composite
  state, each with a start of its own, and a link into the composite state goes into every one. They were drawn
  as one, with a note.
- **Bottom to top and right to left are drawn as written.** `flowchart BT`, `flowchart RL` and a state diagram's
  `direction BT` or `RL` were drawn top to bottom and left to right, with a note. They are now the same flow
  begun at the far end, every arrow pointing the way its author drew it.
- **A title is drawn on a still picture.** The `title` in a diagram's front matter (and a sequence diagram's own
  `title`) sits above the picture, wrapped to its width. A page already had it as its heading; a still picture
  had it only in what a screen reader is told. `accTitle` stays unseen, as it was written to be.
- **A class diagram's notes are drawn.** `note for Order "…"` is a sheet with a folded corner beside its class,
  joined by a dotted line; `note "…"` is one joined to nothing. A note keeps its author's lines and is as tall
  as its words.
- **Class diagrams are drawn.** Classes with what they hold and what they do, annotations («interface»), every
  relation Mermaid has (is a, is made of, has, uses, depends on, in either direction) with the words and the
  counts at its ends, namespaces as groups, and notes on a class. A parent sits above its children whichever
  way the relation was written.
- **Entity diagrams are drawn.** Entities as tables (a row for each attribute, a column each for its type, its
  name and its keys, ruled into cells, every second row shaded), and relationships that say how many at each
  end, in the crow's foot marks or in words, solid or dotted. The words on a shaded row are held to the same
  contrast as words on any box. An attribute's comment goes in the note on
  its entity, so a sentence does not make every box as wide as itself.
- **A box can list rows under its name.** A class's attributes and methods, an entity's columns: each row on a
  line of its own, in a face where columns stay in line, under a rule. Boxes keep one width and are as tall as
  what they list; a rank is as tall as its tallest box. A short line above a name says what it is («interface»).
- **A link can end in more than an arrowhead**: the hollow triangle of "is a", the filled diamond of "is made
  of", the open one of "has", and how many an entity's line means: one, none or one, one or more, any. The few
  words at each end of a link ("1", "0..*") sit beside it, clear of the boxes and of its own words.
- **No path is drawn heavier in a diagram of things.** A class diagram has no way through it.

## 0.1.0 (2026-11-25)

The first version. It draws flowcharts, state diagrams and sequence diagrams, and says what it leaves.

- **A Mermaid flowchart becomes one page.** `merlive.mjs` reads a Markdown file's `mermaid` blocks (or a `.mmd`
  file) and writes one self-contained HTML page for each flowchart, or a still SVG with `--format svg`. Nothing is
  fetched when the page opens. The Mermaid block is never changed.
- **Placement is by rule, and the rules are checked.** The main path is one straight line, every box is the same
  size on a grid, lines turn at right angles, leave from ports of their own and go round boxes, loops go to one
  side. Eight placement rules and two for colour are checked before anything is written; a diagram that breaks
  one is not written, and the message says which rule, where, and what to change. `--check` reports without
  writing; `--force` writes anyway.
- **It was run on a diagram somebody really wrote**, the paper trail on blog.victorsaly.com, and what that broke
  is fixed and held by tests. A branch now turns in the room between two ranks, with a track of its own, where
  it used to cut across a row of boxes. What feeds the main path comes in from one side and what leaves it goes
  out the other, and a box moves to a better lane when that removes a crossing. A box nothing leads to sits one
  step before what it feeds.
- **A label's own lines are kept**, up to four, where the author wrote `<br/>`, in a box wide enough for each. `accTitle` and `accDescr` are read and written into the picture for readers who cannot
  see it. A line that cannot be read leaves no box behind, and a `;` inside quotes no longer cuts a label.
- **Then on seventeen more**, every flowchart in the docs of business-analyst-agent-demo and correlateAI. All
  seventeen now draw, with no crossings. What they needed: words written into a link (`-- "words" -->`,
  `-. words .->`, `== words ==>`) and arrows drawn longer; a store of data (`[("…")]`) as a box of the data kind;
  groups (`subgraph`) drawn as frames with their titles, and a link between two groups; a class's colour read for
  what it means, so a class the design does not know takes the design's own nearest colour; a link's words set
  down where they sit on no box and no other words, wrapped to fit; and a line round the outside going round
  whichever side crosses less.
- **Mermaid kept in code is found**: a flowchart in a string in an `.astro` page or a script is drawn like one
  in Markdown.
- **A diagram has character, and each part of it means something.** The main path is drawn heavier. A box of a
  kind carries a stripe of its colour down its edge. A group's frame has a faint fill. In Merlive's own look,
  boxes lift off the page with a soft shadow and sit on a ground of dots, the grid they are placed on. Both are
  the design's to switch (`depth`, `ground`), both are on the setup page, and a design read from a site follows
  the site: a shadow only where the site has shadows, its page left plain.
- **Steps and notes live in the Mermaid source**, as `%%` comments other renderers ignore: `%% step:` for a
  walkthrough, `%% note X:` for what a box means, `%% main:` to name the main path, `%% side:` for where loops go.
- **A reader can pick a box or a line** to see only what it connects to, and walk the steps. Nothing moves until
  they press play, and then one dot follows the path; a loop repeats until paused.
- **It sets itself up.** `--setup` reads the project's own stylesheets, a folder of them together, or the site named in `package.json` or
  with `--from`, and writes `merlive.design.json` with nobody choosing a colour: the site's page, text and accent
  colours, its face and corner, a dark mode when the site has one, and the rest a diagram needs made from them.
  Whatever would break a colour rule is put right and said. It reads hex, `rgb()`, `hsl()`, bare hsl numbers and
  `oklch()`, and never writes over a design a project already has.
- **Setup shows a page**, `diagrams/merlive-setup.html`: the project's own diagram in light and dark, what was
  read and what was made, and every choice there is, with the two colour rules checked as a colour changes.
- **A project's choices are in its design file**: `modes` (light, dark or both), `motion`, `output.format` (a
  page, a picture or both), and `output.steps`, `output.legend`, `output.source` for what a page carries.
  `--format` takes `both`. Until a project has a design, Merlive draws in a look of its own, sea water and
  coral, in light and dark.
- **Any palette is held to two rules.** D1: words and lines can be read against what is behind them. D2: every
  two kinds of box a diagram uses can be told apart, as most people see them and with either common form of
  red-green colour blindness. The message names the two colours. Merlive's own kinds were chosen by that measure:
  in dark they are six of the Okabe-Ito colours.
- **A picked box says its kind in words**, so colour is never the only thing that carries it.
- **State diagrams are drawn.** `stateDiagram` and `stateDiagram-v2` are read into the same boxes and links as a
  flowchart and placed by the same rules: states and their words, transitions, a start and an end as pills that
  say so, a composite state as a group with links joined to where it starts and ends, a choice as a decision, a
  fork and a join as boxes, a note as the note on its box, direction and classes. A transition from a state to
  itself, a composite state inside another and concurrency are said and not drawn. The corpus has a sample for
  each feature of Mermaid's state page, and `docs/COVERAGE.md` a list of its own for them.
- **More of a flowchart is read**, the first three things the corpus found: a flowchart with front matter is
  drawn, and its `title` kept; `A & B --> C` links every box before the link to every box after it; and anything
  written with `@{ … }` is read, on one line or several: a box's shape and label, an icon or image kept as its
  label, a link's id, and what Mermaid sets on a link or a group read past.
- **A shape is what its author drew.** A rhombus, a hexagon, a cylinder, a subroutine, the two that lean, the
  two trapezoids, a double circle and a flag are each drawn as themselves, written the old way or with
  `@{ shape: … }`. All share the one footprint every box has, so the grid holds and no shape is bigger than its
  neighbours, and every line runs on to the outline it meets.
- **An author's own styling is kept as what it means.** `style` and `classDef` give a box a broken outline, a
  heavy one, and a colour; `linkStyle` does the same for a link, by Mermaid's number for it. The colour is named
  for its hue and drawn in the design's own nearest colour, so the colour rules still hold.
- **Every push is checked.** GitHub runs `npm run check` on Linux and macOS for every push and pull request,
  with nothing installed.
- **A group inside a group has a frame of its own**, inside the outer one, each with its name on a line of its
  own. Where frames inside one another begin or end at the same rank, that rank sits further on to make room.
  The same goes for a composite state inside another.
- **A group's name is never struck through.** It sits where no line runs along the top of its frame, a link's
  words keep off it, and where a line has to pass it passes behind the name. P8 checks it.
- **A link from a box to itself is drawn**, as a small loop beside its box, in a flowchart and in a state
  diagram, where a retry is written that way.
- **A flow too wide for a screen is turned.** Written left to right and wider than 1,100 px, a flow is drawn top
  to bottom, and the command says so and how wide it would have been. `%% turn: no` keeps it as written.
- **A link's words never run off the picture.** Words beside a line that goes round the near outside were cut
  off by the edge. Everything now moves over to give them their margin, and P7 checks it.
- **An icon in a label is drawn.** `fa:fa-truck Shipped` gets a truck beside its words, and `@{ icon: "fa:user" }`
  a user. The drawings are Merlive's own: seventy-two line icons of the things flowcharts point at, on a 16px grid
  in the weight of a box's edge, found by any name Font Awesome has given them across versions 4, 5 and 6.
  Nothing is fetched, Font Awesome's own drawings are not used, a brand's mark is never drawn, and an icon
  Merlive has no drawing for is left out and said.
- **The README opens on one real pair**: the example's Mermaid block as Mermaid draws it, beside what Merlive
  draws of it. `npm run compare` draws Mermaid's half, so it is never made by hand.
- **Links are drawn with what their author put at each end**: an arrowhead, a circle or a cross, at either end
  or both (`--o`, `--x`, `<-->`, `o--o`, `x--x`), solid, dotted or thick. An invisible link (`~~~`) gives its
  boxes and no link.
- **Every bracket shape is read**: the flag, the double circle and the four that lean join the rest. They are
  drawn as boxes and a pill, with their words and nothing else.
- **Words are read as a reader should see them**: entity codes become their characters, a Markdown string keeps
  its words and its own line breaks, and a Font Awesome icon is left out with its words kept.
- **A crossing a diagram forces is allowed, and only that one.** Two boxes that each lead to the same two
  (`A & B --> C & D`) cannot be drawn without two lines crossing once. P4 counts such crossings exactly and
  allows them on top of one for every eight links; any other crossing is refused as before. The two lines no
  longer lie on each other on the way: a line entering a box steps aside from one leaving the box above it.
- **Mermaid's drawing and Merlive's can be looked at side by side.** `corpus/compare.html` shows every sample in
  the corpus drawn twice, on one page that reads on a phone, with what Merlive left out said beside each.
  `npm run compare` draws Mermaid's side with its own command; `npm run coverage` keeps Merlive's side current.
- **What Merlive draws of Mermaid is written down, and checked.** `corpus/` holds one sample of each of the 32
  other kinds of diagram Mermaid documents and of 69 features of its flowcharts; `npm run coverage` runs Merlive
  over all of it and writes `docs/COVERAGE.md` and a picture of each flowchart sample. The tests fail when the
  page no longer says what the code does.
- **Sequence diagrams are drawn**, by rules of their own (`docs/SEQUENCE.md`, S1 to S7), each one checked:
  participants one size and one step apart; one message or note to a row; a message's words beside its sender
  and off every lifeline, however far it goes; frames that hold exactly what is in them, their names clear of
  lifelines; bars that stack. Read: participants, actors and typed participants, aliases, every message arrow
  but the half arrows, messages to self, activations, notes, `loop`, `alt`, `opt`, `par`, `critical`, `break`
  and `rect` inside one another, groups (`box`), `create` and `destroy`, `autonumber`. The page goes through
  the messages one at a time; nothing moves until a reader asks. 42 samples in the corpus hold it, one for each
  feature on Mermaid's sequence page.
- **What Merlive does not draw is left as Mermaid and named**: class diagrams, timelines and the rest come later.
