# The rules for a sequence diagram

A sequence diagram is who says what to whom, in order. Mermaid's own sets the words of a long message across the
lifelines in between, spaces participants by whatever falls out, and lets a frame's name sit on a line. These are
the rules Merlive places a sequence by. Each one is a check in `skills/merlive/scripts/sequence.mjs`; a diagram
that breaks one is not written. They sit beside [the rules for a flowchart](PLACEMENT.md), and the three layers
there hold here too: the rules are Merlive's, the design is your site's, and the Mermaid is the author's.

There are no hints for a sequence. The order of participants is the order the author named them in, and the order
of messages is the order they were written. Nothing else needs saying.

## S1. Participants stand in one row, one size, one step apart

Every participant's box is the same size: the narrowest of six widths (96 to 224 px) in which every name takes two
lines or fewer. From each lifeline to the next is one step, the same all the way across: wide enough for the
widest words that sit in a gap, and never less than a box and 32 px.

- **Pass:** Buyer, ERP and Supplier, each 96 px wide, 144 px apart.
- **Fail:** the gap after ERP is wider than the one before it, because one message there has more to say.
- **Why:** an even row is read as a list of who is there. An uneven one is read as if the gaps meant something.

A participant made part way down (`create`) keeps its place in the row, and its box sits on the message that
makes it.

## S2. Every row is one message or one note, an even gap apart

Everything written takes a row of its own, in the order it was written, 22 px from the row before. A frame's name
takes a row, and so does the start of each of its later sections, half a gap from what they are about.

- **Fail:** two messages share a line, or a note sits beside a message it comes after.
- **Why:** down the page is time. Two things on one row say they happen at once.

## S3. A message's words sit beside its sender, clear of every lifeline and of each other

Words sit above their line, in the gap between the sender and the next lifeline towards the receiver, however far
the message goes. They wrap at 26 characters; where the author broke them with `<br/>`, their lines are kept.

- **Pass:** "Send order" from ERP to Supplier, past Orders, sits between ERP and Orders.
- **Fail:** the same words centred on the whole line, with the Orders lifeline through the middle of "order".
- **What to do when it fails:** the words are too long for any gap. Break them with `<br/>` or shorten them.

A message to itself goes out to the right, down and back, and its words sit beside the loop.

## S4. A frame holds exactly what is in it, and frames nest without touching

A `loop`, `alt`, `opt`, `par`, `critical` or `break` is a frame round its rows. It takes in the lane of every
participant its messages and notes are about, half a box either side of the lifeline, and nothing else. A frame
inside a frame sits clear inside it. Two frames that are not one inside the other do not touch.

The tab that names a frame's kind sits clear to the left of the first lifeline the frame is about, and what the
author called it starts just past that lifeline. Names are drawn over lifelines, never under them, so no line
strikes one through.

- **Fail:** a frame's corner tab reads "OOP" because a lifeline runs through the L.

A `rect` is a frame with no name: a highlight behind its rows, in the design's own tint. One inside another shows
darker.

## S5. A note sits clear of messages and of other notes

A note has a row of its own. Beside a participant it sits 10 px from the lifeline, in the gap; over one it is
centred on the lifeline; over two it reaches from one to the other. It wraps at 28 characters.

## S6. Bars on one participant stack side by side, and never lie on each other

A bar shows a participant at work, from the message that starts it to the message that ends it. A second bar on
the same participant sits half a bar to the right of the first. A line to or from a participant at work stops at
the edge of its bar.

A bar that is never ended runs to the foot, as Mermaid's does. One that is ended and never began is said, with
its line, and left out.

## S7. Names, words and notes fit where they sit

A plain name is wrapped to two lines; one its author broke is kept as written, up to four. A note runs to six
lines at most.

- **What to do when it fails:** give the participant a shorter name with `as`; shorten the note, or put the
  detail in the document.

## D1 and D2. The two colour rules

The same as a flowchart's, with the same sums: words and lines can be read against what is behind them, and the
kinds of box can be told apart, also by someone who does not see red and green apart. A person (`actor`) is a
pill of the design's `external` kind; a database is a box of its `data` kind; every other participant is a plain
box. Shape and name carry the difference as well as colour.

## What a sequence looks like

- **Lifelines are dashed and quiet**, in the colour of a box's edge. Messages are the lines that matter.
- **A filled arrowhead waits for an answer; an open one does not; a cross is a message that is lost or ends its
  receiver.** They are drawn as the author wrote them.
- **A participant that is destroyed ends in a cross**, and its lifeline stops there.
- **Past 480 px of lifeline the participants are drawn again at the foot**, so a reader scrolled down still knows
  whose line is whose. A short diagram is not given a second row it does not need.
- **Numbers**, when the author asks for them with `autonumber`, sit in a disc at the start of each message.

## The live page

Everything is shown until a reader asks for less. **Next** goes through the messages one at a time: the one being
said is lit, and what is still to come is faint. Picking a participant leaves only what it sends and receives;
picking a message leaves it and its two ends. With motion allowed by the design, one dot runs once along a
message as it is reached. On a phone the card that goes through the messages stays at the foot of the screen.

## What is not here yet

- Half arrows and messages to the middle of a line (`()`): said, with their line, and left out.
- The symbols Mermaid has for a boundary, a control, an entity, a collection and a queue: they are plain boxes.
- An author's own colours for a `rect` or a `box`: both are drawn in the design's tint.
- The menus of links Mermaid hangs on a participant: a page of Merlive opens no links.
- Playing a sequence over a flowchart in the same document when the names match.
