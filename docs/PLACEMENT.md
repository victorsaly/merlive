# The placement rules

Merlive exists because Mermaid's own layout makes diagrams that look odd: boxes of every size, lines that wander,
a main path that zigzags. These are the rules Merlive places by. Each one is a check in
`skills/merlive/scripts/score.mjs`; a diagram that breaks one is not written.

There are three layers, and it matters which one a thing belongs to.

| Layer | Who decides | What is in it |
|---|---|---|
| **Rules** | Merlive | Where boxes go, their size, how lines run. This file. A design cannot switch them off. |
| **Design** | Your site, read once by `--setup`; then you, if you want | Colours, face, corner, light and dark, how much may move, what is written. `merlive.design.json`. Merlive checks it (D1, D2) but does not choose it. |
| **Hints** | The author, per diagram | Which path is the main one, which side loops go. `%%` comments in the Mermaid. |

A hint says what the author means. It never says where a box goes: no coordinates, anywhere.

## P1. The main path is one straight line

The path named by `%% main:`, or else the longest path through the flow, runs straight down (or straight across,
in a left-to-right flow). Everything else sits to one side of it.

- **Pass:** Submit, Validate, Budget?, Approve, Send, Placed all share one centre line.
- **Fail:** the third box of the main path is pushed sideways to make room for a branch.
- **Why:** a reader finds the normal case first, then the exceptions.

The main path is also drawn heavier than what branches off it, so the eye takes it first.

Off the main path, a box has a side. What leaves the main path (a branch, a loop) goes to one side of it; what
feeds it (a box nothing leads to, that comes in part-way) comes in from the other, one step before what it feeds.
So a line coming in never has to cross a line going out. A box takes another free place only when that costs less
in crossings, and the lanes it leaves empty are closed up.

## P2. Boxes are one size, on a grid, with room between them

A diagram uses one box width (128, 160, 192 or 224 px: the narrowest that fits every label in two lines) and one
height. A shape is what its author drew (a rhombus, a hexagon, a cylinder, a subroutine, a side that leans, a
double circle, a flag), in the same footprint as every other box: a rhombus is as wide and as tall as the boxes
round it, not a diamond twice their size. Each line runs on to the outline of the shape it meets. No two boxes
come closer than 16 px. Three boxes are taller than the rest: one that lists rows under its name, one that says a sentence about
itself, and a note, each by what it holds. The short line over a name is never wrapped: the box is as wide as
it needs. An entity's rows are a table: every column is as wide as its widest cell, what the box has to
spare goes to the names, and the whole table has to fit the widest box there is (384 px).

A class and an entity list rows under their name, so their boxes cannot all be one height. They keep one width
(up to 384 px, wide enough for the longest row, which is never broken), and each is as tall as what it lists. A
rank is as tall as its tallest box, its boxes sit on its middle line, and the room to the next rank is the same
whatever the heights. Such a diagram is drawn top to bottom.

- **Pass:** eight boxes, all 128 by 60.
- **Fail:** a diamond 180 px wide beside a 90 px rectangle.
- **Why:** unequal boxes are the first thing that makes a Mermaid diagram look unplanned.

## P3. No line passes through a box

A line goes round any box it does not start or end at.

A branch turns in the room between two ranks, never across a row of boxes, and two lines that share that room
each have a track of their own.

- **Fail:** a loop back to the second box is drawn straight up through the third.
- **What to do:** usually nothing, Merlive routes round. If it cannot, name the main path with `%% main:` so the
  box in the way moves aside.

## P4. Lines cross as little as the graph allows

One crossing is allowed for every eight links; with fewer than eight links, none. The order in which lines leave
each side of a box is chosen to keep crossings down.

The lines of one box never cross each other, however many there are. On the left or right of a box a line goes
out, turns once and runs along the flow, and two such lines cross unless they nest: the one that goes further out
before it turns keeps further from the way they turn. So the lines that turn back up the flow come first, the
nearest first, then those that turn down it, the furthest first. This is a rule and not a search, which matters
for a tree: a box that leads to six others has six lines that would otherwise each cross the rest.

- **Pass:** a mindmap of forty boxes, the widest of them leading to six, with no crossing.
- **Fail:** `R --> C0` to `R --> C5` drawn with ten crossings, every line from the side of `R` across every other.

A crossing the diagram forces is allowed on top of that, and counted exactly. Two boxes of one rank that are each
linked to the same two boxes of another (`A & B --> C & D`) have two lines that swap sides, and they cross once
however the boxes are ordered. One crossing is allowed for each such four, and no more: `A & B & C --> D & E`
holds three. The check says so: "1 crossing, which this diagram cannot be drawn without".

- **What to do when it fails:** the flow is too tangled for one picture. Split it into two diagrams, or name a
  different main path.

## P5. No two lines share a path

Each line has a port of its own on the side of a box it leaves or enters, and lines that go round the outside
each have a channel of their own, on whichever side crosses less; where neither side crosses anything, on the
side that saves the line a lane or more, so it does not go out past a box it has no need to pass. A straight line
keeps the middle of its side.

A box and the box under it have their ports at the same places. Where a line leaving the one and a line entering
the other would lie on each other in the room between them, the line entering steps aside by half a port.

A side has only so much room. Ports keep to the middle three fifths of it, and lines nearer than 3 px read as one
line. A box leading to more than eleven others top to bottom, or to more than five from a box off the main path
left to right, can run out of ports, and the check then says which lines run along each other.

- **Fail:** two links into the same box arrive on top of each other, so a reader cannot tell them apart.

## P6. Words fit their box

A plain label is wrapped to two lines. Where the author broke a label with `<br/>`, their lines are kept as
written, up to four, in a box wide enough for each (there are six widths, 128 to 288 px). No word is wider than
the box. A note is the one box whose words may run on, since saying more than a name is what it is for: it
keeps the lines its author broke it into when a width allows, wraps when none does, and is as tall as its lines.

- **What to do when it fails:** shorten the label and put the detail in a `%% note`.

## P7. A link's words sit clear of boxes and of each other

Where a link runs into a group from outside, the room between the two ranks is taller by the words, so they have
a row of their own above the group's name. Where a link with two lines of words or more turns between two ranks,
the room is tall enough for the words above or below the turn.

A link's words ("Yes", "No") are tried beside each run of its line, near where it leaves first: the first place
that sits on no box and no other words wins, and of those, one no line passes through. Long words are wrapped,
and wrapped again to fit a short run between two boxes, but never into a column: past two lines, and past the
lines they wrap to anyway, the rule fails. Left to right, the room between two ranks is made as wide as the words
on a link straight across it, so they keep their lines. Beside a line that runs along the flow, words are drawn
from the side next to the line, so a face narrower than the one they were measured in does not leave them adrift. Words beside a line that goes round the outside stay
inside the picture: everything moves over to give them the margin the boxes have. The few words at an end of a
link ("1", "0..*") sit beside the line just out from its box, the two ends on one side and the link's own words
on the other, and are held to the same.

- **Fail:** the words of a line round the left side are cut off by the edge of the picture.
- **Fail:** "every run is saved for Replay" squeezed between two boxes into a column of one or two words a line.

## Groups

A group the author made (`subgraph`) gets a frame round its boxes, with what it is called along the top (P8). A
link to a group is a link from the end of one to the start of the next. A group inside a group has a frame of its
own inside the outer one, and where such frames begin or end at the same rank, the gap before that rank is wider,
so each frame and its name has room. A frame that would take in a box that is not in the group, or run into a
frame it is neither inside nor round, would say something untrue: it is left out, and the script says so.

A name is never wider than its frame. It is wrapped to the frame's width, in as many lines as it needs, and the
frame keeps room along its top for every one of them: top to bottom the gap before the group's first rank is
wider by a line of words for each line more than one, and left to right the lanes stand that much further apart,
since there the top of a frame is across the flow. A word is never broken, so where a diagram has groups its boxes
are at least as wide as the longest word of any group's name needs, and a group of one box can still say what it
is called.

## P8. A group's name can be read

A group's name goes along the top of its frame, in the first stretch no line runs through: at the left, then at
the right, then anywhere between. A link's words keep off it. Where every stretch has a line in it (a narrow
frame, a long name, a line coming in at the middle), the name stays at the left on a plate of the frame's own
colour, and the line passes behind it.

The check holds a name to five things: it lies inside its frame, inside the picture, on no other group's name, on
no box, and under no line unless it is on a plate. What it says names the group and what to do.

- **Pass:** "Traditional Development (20% AI Autonomy)" over a frame one box wide, in three lines, with the first
  box below the last of them.
- **Fail:** a line is drawn through the letters of a group's name.
- **Fail:** a name that runs out past the right of its frame, over the box beside it or off the picture.
- **What to do when it fails:** shorten the name, or break its longest word; a word longer than any frame is the
  one thing wrapping cannot mend.

## On a grid its author placed

A block diagram is the one kind whose author says where each box goes: a grid of columns, filled row by row. Where
what it says is where each block is (a block joined to nothing, one that spans columns, a space that holds a cell
open, an arrow drawn as a block), Merlive keeps the grid, and the rules above are held like this:

- **P1** has nothing to hold: a grid has no main path, and no line is drawn heavier.
- **P2**, one size, is one size of cell. Every column of a grid is as wide as every other (128 to 288 px: the
  narrowest in which every block's words fit as they must in any box), every row as tall as its tallest block,
  and gaps of 48 px between, wider where a link's words need it. **A block is exactly its cells**: as wide as the
  columns it spans and the gaps between them, as tall as its row. A block that holds others is a frame that is
  exactly its cells too, round a grid of its own that shares the frame's width. The check works this out again
  from the grid and compares it with every block and frame.
- **P3** and **P5** are unchanged. Links are routed at right angles in the gaps: straight where two blocks face
  each other across a gap, else round one corner, or along the gap beside one block and into the other, each
  line of a gap a track step from the next. A space is free room. A link with no clear way is said, and P3
  stops the diagram being written with a line through a block.
- **P4** counts every crossing against the same one in eight. None is forgiven as forced: the author chose where
  the blocks are, so a crossing is theirs to remove by moving one.
- **P6**, **P7** and **P8** are unchanged; a block that spans columns has the room of its own width.

- **What to do when it fails:** give a link room with a `space`, or move a block to another cell. To have the
  diagram placed by rule instead, join every block to another with a link and take out the spans.

## D1. Words and lines can be read against what is behind them

Text against its box is at least 4.5 to 1 (WCAG AA), in every kind of box the diagram uses. Lines, box edges and
the accent are at least 3 to 1 against the page. Checked in light and in dark when the design has both.

- **What to do when it fails:** change the colour named in the message, in the design file.

## D2. Kinds of box can be told apart

Every two kinds of box a diagram uses (decision, rework, your own) have colours at least 12 apart in CIELAB, as
most people see them and as someone with either common form of red-green colour blindness does, about one man in
twelve. Checked in light and in dark. Only kinds the design gives a colour are compared.

- **Pass:** Merlive's own colours: the closest two are 24 apart in light and 18 in dark.
- **Fail:** a red "rework" and a green "done" of the same lightness. Plain to most readers, one colour to some.
- **Why 12:** the sets made for colour-blind readers (Okabe-Ito, Paul Tol's bright) keep their closest pair at 16
  to 17. Twelve lets those through with room and stops what is clearly too close.
- **What to do when it fails:** change one of the two colours the message names, in the design file. Making one
  lighter or darker helps more than changing its hue.
- **And never colour alone:** a decision and a start or end also differ in shape, the legend names every kind,
  and a picked box says its kind in words.

### An author's colour survives as a colour

A box or a link its author coloured (`style D fill:#F44336`, `classDef`, `linkStyle 0 stroke:#c00`) said
something with it: red for refused, green for passed. It is never drawn like a plain one. Which colour it is
drawn in is the first of these that there is:

1. the colour the design file names for that hue (`kinds.red`), which always wins;
2. the design's own colour of that hue, when no other kind in the diagram has it, so the diagram fits the site.
   One hue is one name (red, orange, yellow, green, teal, blue, purple, pink, grey) or within 20 degrees round
   the colour wheel: an amber is the design's orange, a red is not its vermilion;
3. the author's own colour, darkened on a light page or lightened on a dark one only until its edge is 3 to 1
   against the page, when it can be told (D2) from every colour already in the diagram;
4. the design's own nearest colour that no other kind in the diagram has: told apart, at the cost of its hue.

How it is drawn is how it was written. A box its author filled is filled: 45 parts in 100 of the colour in the
box's own fill, and the outline in the colour. A box they only edged, or gave a wash paler than 25 in CIELAB
with a stronger edge (`fill:#e1f5fe,stroke:#01579b`), has its edge in the colour over a wash of it, 13 in 100,
as a kind of Merlive's own has. A link is drawn in the colour, line and head. The colour written for a box's
words (`color:#fff`) is read past: the words are the design's, and D1 holds them.

- **The checks:** D1, on every such fill: where the words would be under 4.5 to 1 the fill is thinned, 3 parts
  at a time and no further than a wash, until they are read, so a diagram is not failed for its author's colour
  when a paler fill passes. D2, for every two such colours, and this besides: a filled box's fill is at least 8
  apart in CIELAB from a plain box's, and an edged box's edge at least 8 from a plain edge. Under that, D2 fails
  with "a red box is drawn like a plain one, though its author gave it a colour".
- **Pass:** a red, a green and an amber box, in Merlive's own colours: fills 29 or more from a plain box in
  light and in dark, words on each at 5.5 to 1 or better.
- **Fail:** a design file whose `kinds.red` is the colour of its own boxes.
- **Why 45, and not the author's own fill whole:** found by looking at a red, a green, an amber and a purple at
  the size of a phone. Under 40 the light page's are pastels a glance does not sort; over 50 the dark page's
  shout over the boxes round them. Whole, the words on it would need the author's `color:`, which nothing holds
  to a contrast.
- **What to do when it fails:** give that hue a colour in the design file (`kinds.red`) that shows on a box.

## What a diagram looks like says something

Nothing is there for decoration. Each difference a reader can see means one thing:

| What is seen | What it means |
|---|---|
| A heavier line | The main path |
| A stripe of colour down a box's edge, and its tint | A box of a kind that means something (rework, risk, your own) |
| Cut corners, a pill | A decision, a start or end |
| A dashed frame with a faint fill and a title | A group the author made |
| A dotted line | A link the author drew dotted |
| A ground of dots (`ground: dots`) | The grid every box is placed on |
| A soft shadow (`depth: soft`) | A box, lifted off the ground it sits on |

The last two are the design's to switch off. A design read from a site keeps the site's manners: a shadow only
where the site has shadows, and the page behind the diagram left plain.

## Motion is not a placement rule, but it has one of its own

Nothing moves until the reader asks. With the design's `motion` at `calm` (the default), pressing play sends one
dot along the path of the step being shown; a loop repeats until paused. `lively` also makes that path's line
flow. `none` shows no play button at all. A reader who has asked their system for less motion gets no flowing
lines whatever the design says.

## What is not here yet

- A group inside a group: it is drawn as part of the outer one.
- A long chain is one long column or row. A group's own direction (a row inside a column) is not followed.
- Tracks in the room between two lanes: two loops up the same side of a box can still lie on each other.
- A box with more than four lines on one side: its own lines nest by rule, but the order of its ports against
  other boxes' lines is not tried exhaustively.
- A box with more lines on a side than the side has ports for: it is not made taller or wider to hold them, and
  its lines do not yet share a trunk.
