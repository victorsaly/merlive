# Where the work stands

For whoever picks Merlive up next, a person or an agent, with no memory of the sessions before. It says what is
done, what is half done and how to finish it, what waits on Victor, and what was decided and why.
[ROADMAP.md](ROADMAP.md) is where Merlive is going; this is where it is. Change this page in the same pull
request as the work it describes: a plan nobody keeps is worse than none.

Last brought up to date: 28 November 2026, with 0.4.0 released and 0.5.0 in hand.

## Released

**0.1.0** (25 November 2026). Flowcharts, state diagrams and sequence diagrams: read, placed by rules that are
checked, drawn in a project's own design, with the Mermaid left as the source. What each draws of Mermaid, feature
by feature, is in [COVERAGE.md](COVERAGE.md), which the tests hold to the code.

**0.2.0** (25 November 2026), the pull request from the branch `class-er`. Class diagrams and entity diagrams:
a box that lists rows (`rows`, and `table` for an entity's cells), links that end in "is a", "has" or how many,
two readers (`class.mjs`, `er.mjs`) behind one table (`READERS` in `parse.mjs`). And what Victor found beside
Mermaid's own drawings on the comparison page: a picture's title, a class diagram's notes, entities as ruled
tables, a sequence diagram's people, typed participants, feet, dots and half arrows, a group's title in the
design's colour, bottom to top and right to left, a composite state's regions, bold and italic. Every sample of
the corpus that Merlive draws is read in full: none is partly read, none refused.

What 0.2.0 left, each said by the command when met or named on the comparison page:

- **What is known to be missing**, each said by the command when met: a direction other than top to bottom,
  for either kind (boxes of different heights are only placed top to bottom); attributes written on the line
  that opens an entity.
- **An attribute's comment is not on the picture.** An entity is drawn as a table of type, name and keys. A
  comment (`string number PK "As printed"`) is Mermaid's fourth column; here it is in the note on the entity,
  since one sentence would make every box of the diagram as wide as itself. To draw it, a comment column needs
  to wrap inside its cell and make only its own row taller.
- **Notes in a state diagram are not drawn yet.** A class diagram's notes are (a `note` shape, a box of kind
  `note`, a dotted link with nothing at its ends: `class.mjs`). A state diagram's (`note right of X`) are still
  only what a reader sees on picking the state. Drawing them the same way needs one thing first: a state
  diagram has a main path and steps, and a note's link must not be taken for part of the flow (a note has
  nothing coming in, so it looks like a place to start). A note is drawn in the design's own colours, not
  Mermaid's yellow: the colours are the user's.
- **One thing the class reader changed for flowcharts too**: two groups with one id are now one group
  (`frame()` in `parse.mjs` reopens a group whose id exists). Dotted namespaces need it. Nothing in the corpus
  or in Victor's diagrams has two subgraphs with one id, but it is a change of behaviour, so say so in the pull
  request.

**0.3.0** (25 November 2026). Requirement, C4, architecture and block diagrams (`requirement.mjs`, `c4.mjs`,
`architecture.mjs`, `block.mjs`, and `grid.mjs` for a block diagram placed on its author's grid), a box's
sentence (`Node.text`), a junction as a dot, room for words that run into a group or sit by a turn. Most of it went to
`main` with 0.2.0 in one pull request (`class-er`); block grids, the junction and the release itself followed
in a pull request of their own, since they were merged into that branch seconds after it went to `main`. Every sample Merlive reads is drawn with no rule broken.

What 0.3.0 left, in the order worth doing:


1. **A grid its author placed** is drawn (`grid.mjs`, `model.placedBy = 'grid'`). What is weak in it: the room
   between cells holds three lines, and a fourth through one gap is not routed (a warning, and P3 refuses);
   a link to a block that holds others is joined to a block inside it, so two lines can run side by side where
   Mermaid draws one to the frame; a block fills its whole cell, so a circle in a wide column is a wide pill; a
   grid inside a frame stretches its columns to the frame and not its rows; a flow written with `columns 2` is
   still one chain placed by rank.
2. **A junction** is a dot (the `point` shape) in a footprint as big as any box, so the room round it is a
   box's. A box smaller than the one box size would let the diagram close up round it.
3. **Smaller things**: an edge out of a group (`a{group}:R`) is drawn from the service named, not from the frame;
   a group has nowhere to keep an icon or a description (a Deployment_Node's); `disk` is drawn with the database
   icon; `contains` in a requirement diagram ends in a circle where Mermaid has a crossed ring; emphasis inside a
   box's sentence is dropped; the page's side panel does not show a box's sentence.
4. **Look, sample by sample**, at the requirement samples on `corpus/compare.html`: the C4, architecture and
   block samples were looked through on contact sheets, the requirement ones only by their rules passing.
**0.4.0** (26 November 2026), what a real project's documents showed. Found by drawing the diagrams of a business analyst demo (its
`docs/index.md` and `docs/running-the-app.md`, held in `test/fit.test.mjs` and `test/real.test.mjs`) in that
project's own hand-lettered design: the panel above a drawing too wide for the column beside it
(`draw.column` in render.mjs); words beside a line that runs along the flow drawn from the side next to it
(`Words.align`); room for words across a left-to-right rank gap, and a P7 check for words squeezed into a
column; `%% kind name: meaning` (`model.meanings`) and a note for a kind named for its colour; the site's face
for code (`mono`); the choices offered once after setup (SKILL.md, section 5, and the rule in AGENTS.md).

What 0.4.0 left: `classDef` with a hyphen in its name (`classDef read-only …`) is not read, though a kind may
have one; the setup page shows `mono` in the settings it copies, but has no control for it; a state diagram's reader
does not read `%% kind` yet; the main path is still the longest one, which in a flow with a fallback (Groq,
then OpenAI when its limit is reached) puts the fallback on the straight line. `%% main:` fixes it by hand;
picking the path that takes no decision's exception would fix it by rule.

## In hand: 0.5.0, more kinds the two placements can draw

On the branch `kinds-2`. Done: readers for mindmaps, kanban boards, timelines and packets (`mindmap.mjs`,
`kanban.mjs`, `timeline.mjs`, `packet.mjs`), each with its tests, its list in `corpus/index.json` and its section
in `skills/merlive/reference.md`; a tree placed as a tree (step 5 of `placed()` in layout.mjs); a grid that says
its own least column, its gap, and that its cells are close (`grid.mjs`); a plain box named for what it is in
each kind (the third column of `READERS` in parse.mjs: a card, a class, an entity, an idea, a field, an event),
and a page with no lines that says nothing of a flow (`linked` in the page's data); a packet near Mermaid's width
(a TCP header 1140px, was 2408): a `cell` shape with less room round its words, fields 4px apart with P2 holding a
grid with nothing linked to its cells, and P6 holding the line over a name to its block's own width.
A timeline too wide for a screen runs on in bands (`wraps` on the model, the fewest that fit chosen in
`layout()`; `%% wrap: no` keeps one row), and no line runs along a frame's edge (P5; the grid router takes the gap
outside the frames round a box, `rim` in grid.mjs). A frame's name on a grid wraps to three lines before it
widens a column (`nameAt` in grid.mjs, `Frame.lines`). In a flow placed by rule a group's name still does not wrap.

Left:

1. **A mindmap** has Mermaid's meaning and not its look: a tree to the right, not a root in the middle with a
   colour to each branch. A class in a mindmap has no colour, since a mindmap has no `classDef`.
2. **Look, sample by sample**, beside Mermaid's. Mindmaps are done (28 November): all 38 looked through. Found
   and fixed: a hexagon, a circle and a cloud took a flowchart's kinds (Decision, Start or end), colour and all.
   Found and left for Victor (below): the comb, and a sibling whose line leaves another side. Kanban boards are
   done too, all 25: a card's ticket, who has it and its priority were in the face for code, and are in the page's
   face now. Left as decided in the reference: a known priority is listed in small letters (`priority: high`) and
   any other as written, and a ticket is not a link even where `ticketBaseUrl` says where it would go. Timelines
   and packets are still to look through. A packet of one-bit fields with four-letter names
   (`packet-bit`) is still 1396px: a column is as wide as its widest one-bit name.

## Waiting on Victor

- **How a tree's lines leave a box** (from looking through the mindmaps). A box's lines to its children each leave
  by a port of their own, so four children make a comb of four lines a few pixels apart (`mindmap-bushy`). A tree
  is usually drawn with one trunk the branches leave from, but that is lines sharing a path, which P5 refuses. Is a
  shared trunk wanted, for a tree's lines that have nothing at their ends? And in `mindmap-tree` one parent's line
  to its second child leaves its bottom and the other's its right side: both clear, not alike.

- **The tags.** No session so far could push a tag: the push is refused where the sessions run. None exists
  yet. In a clone:
  `git tag -a v0.1.0 c2de18e -m "Merlive 0.1.0"`, `git tag -a v0.2.0 faa35cd -m "Merlive 0.2.0"`,
  `git tag -a v0.3.0 cf1fee7 -m "Merlive 0.3.0"`, `v0.4.0` on the commit that merges its release, then
  `git push origin v0.1.0 v0.2.0 v0.3.0 v0.4.0`.
- **The site.** [skills pull request 11](https://github.com/victorsaly/skills/pull/11) takes "not released
  yet" off Merlive's page; merge it after the tag. Then, in the skills repository: `npm install`,
  `npm run build` (the Merlive page has never been built: it could not be, where it was written),
  `npm run cards` (the share card `public/og/merlive.png` is missing and the hub's card shows two skills), and
  `npm run deploy` (the site deploys by hand, so skills.victorsaly.com does not show Merlive until then).
- **The About box** of the Merlive repository on GitHub is empty. Description: "Your Mermaid diagrams, placed by
  rule and made live. Turns the Mermaid already in your Markdown into well placed, interactive diagrams in your
  own design, as an agent skill for Claude Code, Codex, Cursor and OpenCode." Website:
  `https://skills.victorsaly.com/merlive`. Topics: agent-skill, agent-skills, claude-code, codex, cursor,
  mermaid, diagrams, flowchart, markdown, documentation, visualization.
- **His own diagrams turn.** A flow written left to right and wider than 1,100 px is now drawn top to bottom. Nine
  of the fifteen diagrams in his blog and the business-analyst demo do. He has not said whether the blog's should
  (`%% turn: no` keeps one as written).
- **Open questions on the site page**: the mark and the wordmark are proposals; whether Merlive wants a film as
  SideShot has.

## Next, in this order

1. **Where Mermaid still reads better**, from the comparison page:
   - in a sequence diagram: a participant that is destroyed is not drawn again where it ends; the figure and the
     marks are smaller than Mermaid's; the page's legend names only three kinds of participant; a foot is picked
     by pointer and not by keyboard; a note over two participants may sit on an activation bar (not checked
     whether that is new); an author's highlight colours become the design's tint;
   - a state diagram's fork and join are boxes, not bars;
   - `A & B --> C & D`: the crossing sits beside a bend; three to three is refused (it forces nine crossings and
     placement finds eleven);
   - the name of a narrow group usually has its line pass behind it, and the arrowhead sits close under it;
   - a group's own direction is read past;
   - of the newer `@{ shape }` list, twelve shapes are drawn and the rest are boxes.
2. **The other kinds**, picked by what Victor's own repositories use, not by Mermaid's list. Twenty are left
   as Mermaid (the `kinds` list of `corpus/index.json`): gantt and journey, the charts (pie, xychart, quadrant,
   sankey, radar, treemap), gitgraph, zenuml and the rest. Each needs a way of drawing of its own.
   A kind of boxes and links (requirement, C4, block, architecture) can use the placement there is; a chart or a
   tree needs a way of drawing of its own, as a sequence diagram did (`sequence.mjs` is the pattern: read, place,
   check, with its rules written down first).
3. **What 0.1 left for later**: setup that reads colours from a Tailwind config; pan, zoom and search for big
   diagrams; a build step for docs sites; evals for the skill.

## What was decided, and why

Each of these was a choice somebody could reopen. The reason is here so that nobody reopens one by accident.

- **Mermaid stays the source, and no script changes it.** Merlive's own instructions are `%%` comments.
- **Placement is by rules that are checked, and a diagram that breaks one is not written.** A picture that passes
  and still looks wrong gets a new rule and its check.
- **Colours are the project's, read from its site, never chosen from palettes.** An author's own colour
  (`style B stroke:#c00`) is drawn in the design's nearest colour and named for its hue, so the contrast and
  colour-blind checks stay true. Victor was told and did not ask for the exact hex.
- **A shape is what its author drew, in the one footprint every box shares.** Victor asked for this after seeing
  rhombuses drawn as cut-corner boxes; a rhombus is as wide and as tall as its neighbours, not twice their size.
- **A crossing the diagram forces is allowed, and counted exactly** (P4): one for every two boxes of a rank that
  are each linked to the same two of another. Victor agreed; any other crossing in a small diagram is refused.
- **A flow too wide for a screen is turned top to bottom.** Victor agreed; the alternative was narrower boxes,
  which wrap labels onto more lines.
- **Icons are Merlive's own drawings**, found by Font Awesome's names. Nothing is fetched, and Font Awesome's art
  has its own licence. Brand marks are never drawn.
- **A class or entity box has one width for the diagram and its own height** (P2 keeps its columns, not its
  rows). Victor chose this over refusing such diagrams.
- **After 0.1.0, one pull request is one release**, and nothing goes straight to `main`.

## How to pick it up

```bash
npm run check      # every test, with coverage: must pass before and after
npm run examples   # draw the examples again
npm run coverage   # what is drawn of Mermaid, and the comparison page's Merlive side
npm run compare    # Mermaid's side of the comparison (needs mermaid-cli and Chrome), about three minutes
```

[AGENTS.md](../AGENTS.md) says how the code is laid out and written. Read it first. Then open
`corpus/compare.html` in a browser: it is the quickest way to see what Merlive does and where it falls short.
