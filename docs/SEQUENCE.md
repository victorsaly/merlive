# The rules for a sequence diagram

A sequence diagram is who says what to whom, in order. Mermaid's own sets the words of a long message across the
lifelines in between, spaces participants by whatever falls out, and lets a frame's name sit on a line. These are
the rules Merlive places a sequence by. Each one is a check in `skills/merlive/scripts/sequence.mjs`; a diagram
that breaks one is not written. They sit beside [the rules for a flowchart](PLACEMENT.md), and the three layers
there hold here too: the rules are Merlive's, the design is your site's, and the Mermaid is the author's.

There are no hints for a sequence. The order of participants is the order the author named them in, and the order
of messages is the order they were written. Nothing else needs saying.

## S1. Participants stand in one row, one size, one step apart

Every participant has the same footprint: the narrowest of six widths (96 to 224 px) in which every name takes
two lines or fewer, and as tall as the tallest of them needs. From each lifeline to the next is one step, the
same all the way across: wide enough for the widest words that sit in a gap, and never less than a box and 32 px.

What is drawn in that footprint says what the participant is. A plain participant is a box round its name. A
person (`actor`) is a figure; a boundary, a control and an entity are each a circle with its own mark; a database
is a cylinder. These five are small drawings centred on the lifeline, with the name under them, and the lifeline
starts under the name. A collection is two sheets and a queue is a cylinder on its side, each with its name
inside. A diagram that has none of the small drawings is no taller for them.

Every participant is drawn again at the foot of its lifeline, the same drawing, below everything that was said:
in a long diagram a reader scrolled down still knows whose line is whose, and in a short one the lifelines end
in something. An author who turned this off for Mermaid (`mirrorActors: false`, in front matter or a
directive) has it off here.

- **Pass:** Buyer, ERP and Supplier, each 96 px wide, 144 px apart.
- **Fail:** the gap after ERP is wider than the one before it, because one message there has more to say.
- **Why:** an even row is read as a list of who is there. An uneven one is read as if the gaps meant something.

- **Fail:** a participant at the foot sits on the last message, or runs off the drawing.

A participant made part way down (`create`) keeps its place in the row, and its box, or the middle of its
drawing, sits on the message that makes it. One that is ended (`destroy`) has no foot: its line stopped at its
cross.

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

## S5. A note sits clear of messages and of other notes, and covers a bar wholly or not at all

A note has a row of its own. Beside a participant it sits 10 px from the lifeline, in the gap; over one it is
centred on the lifeline; over two it reaches from one to the other. It wraps at 28 characters.

Over a participant at work, a note lies on its bars, as Mermaid's does, and covers them wholly: bars stack to the
right, so it reaches past the outermost as far as it would past one. Beside one, it starts past the outermost.

- **Fail:** the edge of a note falls on a bar, and a sliver of the bar shows past it.
- **What to do when it fails:** a note placed by Merlive does not; one moved by hand is moved clear of the bar, or
  over it.

## S6. Bars on one participant stack side by side, and never lie on each other

A bar shows a participant at work, from the message that starts it to the message that ends it. A second bar on
the same participant sits half a bar to the right of the first. A line to or from a participant at work stops at
the edge of its bar.

A bar that is never ended runs to the foot, as Mermaid's does. One that is ended and never began is said, with
its line, and left out.

## S7. Names, words and notes fit where they sit

A plain name is wrapped to two lines; one its author broke is kept as written, up to four. A note runs to six
lines at most.

The title of a group of participants (`box`) is a name too. It sits inside its frame, centred, above the
participants it is over and clear of them, and wraps to the width of the frame. Every participant is made wide
enough for the longest word of any title to fit across its group. The row of titles is as tall as the longest
title needs, so every group starts at the same height. A group with no title has none.

- **Fail:** "Outside the firm" on one line over one narrow participant, running past its frame and off the
  picture.
- **What to do when it fails:** give the participant a shorter name with `as`; shorten the note, or put the
  detail in the document; shorten a word of a group's title that is too long for any frame.

## D1 and D2. The two colour rules

The same as a flowchart's, with the same sums: words and lines can be read against what is behind them, and the
kinds of box can be told apart, also by someone who does not see red and green apart. A person (`actor`) is of
the design's `external` kind and a database of its `data` kind; every other participant is plain. The drawing
and the name carry the difference as well as colour: the small drawings are line work in the colour of a line,
or of their kind when the design gives it one, and both are held to be seen on the page.

One thing is checked that a flowchart has not: the title of a group is quiet text on the group's own fill, which
is a little off the page's, and it must be readable there, in light and in dark.

## What a sequence looks like

- **Lifelines are dashed and quiet**, in the colour of a box's edge. Messages are the lines that matter.
- **A filled arrowhead waits for an answer; an open one does not; a cross is a message that is lost or ends its
  receiver.** They are drawn as the author wrote them.
- **Half an arrowhead, or one stroke of an open one, is drawn on the side its author chose** (`-|\`, `-|/`,
  `-\\`, `-//`). "Top" is above a line that goes right and below one that goes left: the head turns with its
  line, as Mermaid's does. The reversed ones (`/|-`, `\|-`, `//-`, `\\-`) are a line back to the participant
  named first, as Mermaid draws them, and are read as a message that way.
- **A message written to or from the middle of a line (`()`) ends in a dot on the lifeline**, with whatever is
  at that end stopping at the dot's edge. It meets the middle of the line even when the participant is at work.
- **A participant that is destroyed ends in a cross**, and its lifeline stops there.
- **Numbers**, when the author asks for them with `autonumber`, sit in a disc at the start of each message.

## The live page

Everything is shown until a reader asks for less. **Next** goes through the messages one at a time: the one being
said is lit, and what is still to come is faint. Picking a participant leaves only what it sends and receives;
picking a message leaves it and its two ends. A participant may be picked at the head of its line or at the foot;
the keyboard reaches the one at the head, and a screen reader is told what each is (a person, a database, a queue). With motion allowed by the design, one dot runs once along a
message as it is reached. On a phone the card that goes through the messages stays at the foot of the screen.

## What is not here yet

- A participant that is ended is not drawn again where it ends, as Mermaid draws it: its line stops at a cross.
- An author's own colours for a `rect` or a `box`: both are drawn in the design's tint.
- The menus of links Mermaid hangs on a participant: a page of Merlive opens no links.
- Playing a sequence over a flowchart in the same document when the names match.
