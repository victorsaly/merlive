# Where the work stands

For whoever picks Merlive up next, a person or an agent, with no memory of the sessions before. It says what is
done, what is half done and how to finish it, what waits on Victor, and what was decided and why.
[ROADMAP.md](ROADMAP.md) is where Merlive is going; this is where it is. Change this page in the same pull
request as the work it describes: a plan nobody keeps is worse than none.

Last brought up to date: 28 November 2026, as 0.5.3 was begun.

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

What 0.4.0 left: the setup page shows `mono` in the settings it copies, but has no control for it. (A class with
a hyphen in its name and a main path that took a fallback were fixed in 0.5.1. A state diagram's `%% kind` had been
read all along: the state reader hands its comments to parse.mjs, and a test holds it now.)

**0.5.0** (28 November 2026), more kinds the two placements can draw, the pull request from the branch `kinds-2`:
readers for mindmaps, kanban boards, timelines and packets (`mindmap.mjs`,
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
widens a column (`nameAt` in grid.mjs, `Frame.lines`).

What 0.5.0 left:

1. **A mindmap** has Mermaid's meaning and not its look: a tree to the right, not a root in the middle with a
   colour to each branch. A class in a mindmap has no colour, since a mindmap has no `classDef`. Waits on Victor.
2. **A packet of one-bit fields with four-letter names** (`packet-bit`) is still 1396px: a column is as wide as its
   widest one-bit name.
3. ~~A flow's group name does not wrap~~: done in 0.5.1.

Every sample of the four kinds was looked through beside Mermaid's own on 28 November (114: 38 mindmaps, 25
boards, 29 timelines, 22 packets). Fixed from it: a mindmap's hexagon, circle and cloud took a flowchart's kinds
(Decision, Start or end), colour and all; a card's ticket, who has it and its priority were in the face for code.
Left as the reference decides: a known priority in small letters (`priority: high`) and any other as written; a
ticket that is not a link even where `ticketBaseUrl` says where it would go; a timeline theme's colours, which
are the design's. Already known: in `timeline-direction-td-sections` the arrow into a section runs just past the
end of its name (0.5.3 keeps a name a letter from every line). A packet's bits are said over its name ("0–15")
where Mermaid puts the first and last at its corners, and its title is above, as every kind's is. Questions of
taste are under "Waiting on Victor".

**0.5.1** (28 November 2026), what 0.4.0 and 0.5.0 left in flowcharts, pull request 12 from the branch
`fix-0.5.1`:
- a class with a hyphen in its name (`classDef read-only`, `class B read-only`, `A:::read-only`), the hyphen
  counted only between letters so `A:::x-->B` is still a link (parse.mjs, state.mjs, class.mjs);
- the main path takes the usual way: a worded link out of a box that also has a plain one is the exception, and
  is not taken however long its way (`ways` in step 3 of `placedOnce()` in layout.mjs); a tie goes to the way that
  reaches more of the flow. P1 says it and refuses a main path that takes an exception unless `%% main:` named
  it. The business analyst demo's service diagram is A, P, G, ANS, the fallback to OpenAI beside it; one corpus
  picture changed (`class-whole`, whose main path was a note);
- a flow's group name wraps to three lines inside its frame, the flow placed again with room at the top of the
  frame (`placed()` and `placedOnce()` in layout.mjs, `nameAt` from grid.mjs); P8 holds every frame. Four corpus
  pictures changed, each for the better (`state-composite-named`, `c4-boundary-type`, `c4-deployment-described`,
  `c4-deployment-nodes`). From review of pull request 12: room is kept beside a frame as well as above it
  (`aside` in `settle()`), so left to right a name's lines do not run into the next lane, and a word longer than
  its frame makes the frame wider (`Fit.w`); a design file may colour a kind with a hyphen in its name.

**0.5.2** (28 November 2026), pull request 13 from the branch `fix-0.5.2`:
- a group's name that a line would pass behind wraps narrower, to three lines, to sit beside the line instead
  (`clearOf` and the search after it in `placedOnce()`; `placed()` places the flow a third time when the narrower
  name needs more lines than were kept for it). Six corpus pictures changed (`state-composite-named`,
  `c4-deployment`, `c4-deployment-described`, `c4-deployment-nodes`, `c4-boundary-enterprise`,
  `block-nested-label`) and the business analyst demo's 13 steps ("Build the agent"): each name is clear of the
  line into its frame, the frame a line or two taller. A name that fits beside no line in three lines (a single
  long word, a line on each side) is still on a plate.
- the lanes off the main path in the service diagram were looked into and left: see "Waiting on Victor".

**0.5.3** (not released yet), the pull request from the branch `fix-0.5.3`:
- a group's name keeps 8px from every line (`measure.nameClear`), where it kept the 4 a box keeps
  (`measure.clear`): "Web shop" and "The firm" (`c4-boundary-container`, `c4-boundary`) ended against the arrow
  into their frames. Looked into as "a grid's name is not wrapped narrower", the timeline in
  `timeline-direction-td-sections` had no line through its name at all: the arrow ran 4px past its end.
- a name is placed by `nameAlong` and `nameBeside` in layout.mjs, which a flow, a grid (step 6 of grid.mjs, and
  `placeGrid` placing again where a narrower name needs more lines than its row keeps) and P8 all use. P8 refuses
  a line within 8px of a name, and a plate where the top of the frame has a clear place, on a grid as in a flow.
  Three corpus pictures changed. In the timeline, "Delivery" is now at the right of its frame and "Buying"
  above it at the left: see "Waiting on Victor".

## Waiting on Victor

- **Bands, and how much past a screen.** `timeline-whole` was 1108px in one row, 8px past the 1,100 a flow is
  turned at, and is now two bands with a long arrow between them. Should a timeline have some slack before it
  wraps, or is one limit for every kind right?
- **How a tree's lines leave a box** (from looking through the mindmaps). A box's lines to its children each leave
  by a port of their own, so four children make a comb of four lines a few pixels apart (`mindmap-bushy`). A tree
  is usually drawn with one trunk the branches leave from, but that is lines sharing a path, which P5 refuses. Is a
  shared trunk wanted, for a tree's lines that have nothing at their ends? And in `mindmap-tree` one parent's line
  to its second child leaves its bottom and the other's its right side: both clear, not alike.

- **Section names that do not line up.** In `timeline-direction-td-sections` the arrow from Tuesday into
  Friday comes in under the start of "Delivery", so the name went to the right end of its frame, as a flow's
  name does when the left is taken; "Buying" above is at the left. Should frames stacked in one column keep their
  names at one end (on a plate where a line comes in under one), or is the name clear of the line worth it?
- **Lanes off the main path, short lines or no crossing.** In the business analyst demo's service diagram OpenAI
  (linked to the question, Groq and the answer) is in the far lane and "Live AI stops" (linked to Groq only) in
  the near one, so two lines run long. Swapped, the "yes" line into OpenAI crosses Groq's line to "Live AI
  stops", which P4 refuses (checked: one crossing where none is forced). The one way with short lines and no
  crossing puts "Live AI stops" on the other side of the main path, where what feeds it goes, not what leaves it
  (P1). Is a box leaving to the other side worth shorter lines, or is the picture right as it is?
- **The site.** [skills pull request 11](https://github.com/victorsaly/skills/pull/11), which took "not released
  yet" off Merlive's page, was merged on 25 November. Whether the site was then built and deployed is not known
  here. If not, in the skills repository: `npm install`,
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
- **The main path is the usual case, not the longest way.** A fallback written as a worded link beside a plain
  one ("daily limit gone") was on the straight line in the business analyst demo; `%% main:` could fix it by hand,
  and 0.4.0's plan asked for it by rule. Where every link out of a box has words (a question's yes and no), there
  is no usual case to tell from them, and the longest way still is the main path.
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
