# The placement rules

Merlive exists because Mermaid's own layout makes diagrams that look odd: boxes of every size, lines that wander,
a main path that zigzags. These are the rules Merlive places by. Each one is a check in
`skills/merlive/scripts/score.mjs`; a diagram that breaks one is not written.

There are three layers, and it matters which one a thing belongs to.

| Layer | Who decides | What is in it |
|---|---|---|
| **Rules** | Merlive | Where boxes go, their size, how lines run. This file. A design cannot switch them off. |
| **Design** | You, once | Colours, face, corner, how much may move. `merlive.design.json`. Merlive checks it (D1, D2) but does not choose it. |
| **Hints** | The author, per diagram | Which path is the main one, which side loops go. `%%` comments in the Mermaid. |

A hint says what the author means. It never says where a box goes: no coordinates, anywhere.

## P1. The main path is one straight line

The path named by `%% main:`, or else the longest path through the flow, runs straight down (or straight across,
in a left-to-right flow). Everything else sits to one side of it.

- **Pass:** Submit, Validate, Budget?, Approve, Send, Placed all share one centre line.
- **Fail:** the third box of the main path is pushed sideways to make room for a branch.
- **Why:** a reader finds the normal case first, then the exceptions.

## P2. Boxes are one size, on a grid, with room between them

A diagram uses one box width (128, 160, 192 or 224 px: the narrowest that fits every label in two lines) and one
height. Decisions are the same box with its corners cut, not a diamond twice the size of its neighbours. No two
boxes come closer than 16 px.

- **Pass:** eight boxes, all 128 by 60.
- **Fail:** a diamond 180 px wide beside a 90 px rectangle.
- **Why:** unequal boxes are the first thing that makes a Mermaid diagram look unplanned.

## P3. No line passes through a box

A line goes round any box it does not start or end at.

- **Fail:** a loop back to the second box is drawn straight up through the third.
- **What to do:** usually nothing, Merlive routes round. If it cannot, name the main path with `%% main:` so the
  box in the way moves aside.

## P4. Lines cross as little as the graph allows

One crossing is allowed for every eight links; with fewer than eight links, none. The order in which lines leave
each side of a box is chosen to keep crossings down.

- **What to do when it fails:** the flow is too tangled for one picture. Split it into two diagrams, or name a
  different main path.

## P5. No two lines share a path

Each line has a port of its own on the side of a box it leaves or enters, and loops that go round the outside
each have a channel of their own. A straight line keeps the middle of its side.

- **Fail:** two links into the same box arrive on top of each other, so a reader cannot tell them apart.

## P6. Words fit their box

A label takes at most three lines, and no word is wider than the box.

- **What to do when it fails:** shorten the label and put the detail in a `%% note`.

## P7. A link's words sit clear of boxes and of each other

A link's label ("Yes", "No") sits beside the first run of its line, close to where it leaves, with a clear
background behind it.

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

## Motion is not a placement rule, but it has one of its own

Nothing moves until the reader asks. With the design's `motion` at `calm` (the default), pressing play sends one
dot along the path of the step being shown; a loop repeats until paused. `lively` also makes that path's line
flow. `none` shows no play button at all. A reader who has asked their system for less motion gets no flowing
lines whatever the design says.

## What is not here yet

- Subgraph boxes: the nodes are placed, the group's outline is not drawn.
- Balancing branches on both sides of the spine: everything goes to one side.
- A box with more than four lines on one side: the order of its ports is not tried exhaustively.
