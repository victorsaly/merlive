# What Merlive draws of Mermaid

Written by `npm run coverage`. Do not edit it by hand: change the code or the corpus and run it again.

The syntax pages of mermaid-js/mermaid at 6374e52 (2026-11-23): one row for every kind of diagram it documents and every feature its flowchart, state diagram and sequence diagram pages set out. The samples are our own.

## In short

- **Flowcharts:** of 70 features, 46 are drawn as written, 22 are drawn less something Merlive leaves out on purpose or does not have yet, 2 are only partly read, and 0 are refused.
- **State diagrams:** of 27 features, 16 are drawn as written, 10 are drawn less something, 1 are only partly read, and 0 are refused.
- **Sequence diagrams:** of 42 features, 35 are drawn as written, 5 are drawn less something, 2 are only partly read, and 0 are refused.
- **Every kind of diagram:** of 32, 2 drawn (flowcharts, state diagrams and sequence diagrams, which have their own lists above), and 30 left as Mermaid and named.

## Flowcharts, feature by feature

A sample is **drawn** when every box, link, group and word the corpus says it has is read, nothing is said about
what could not be read, and every rule passes. **Drawn, less something** is the same, with one thing known to be
missing, named beside it. **Partly read** and **refused** are what there is to fix.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A flowchart, declared with "flowchart" | Drawn |  | [source](../corpus/flowchart/declare-flowchart.mmd) | [picture](../corpus/drawn/declare-flowchart.svg) |
| A flowchart, declared with "graph" | Drawn |  | [source](../corpus/flowchart/declare-graph.mmd) | [picture](../corpus/drawn/declare-graph.svg) |
| Direction TB: top to bottom | Drawn |  | [source](../corpus/flowchart/direction-tb.mmd) | [picture](../corpus/drawn/direction-tb.svg) |
| Direction TD: top down | Drawn |  | [source](../corpus/flowchart/direction-td.mmd) | [picture](../corpus/drawn/direction-td.svg) |
| Direction LR: left to right | Drawn |  | [source](../corpus/flowchart/direction-lr.mmd) | [picture](../corpus/drawn/direction-lr.svg) |
| Direction BT: bottom to top | Partly read | line 1: BT is drawn as TD | [source](../corpus/flowchart/direction-bt.mmd) | [picture](../corpus/drawn/direction-bt.svg) |
| Direction RL: right to left | Partly read | line 1: RL is drawn as LR | [source](../corpus/flowchart/direction-rl.mmd) | [picture](../corpus/drawn/direction-rl.svg) |
| A title and settings in front matter | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/flowchart/frontmatter.mmd) | [picture](../corpus/drawn/frontmatter.svg) |
| Settings in an init directive | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/flowchart/init-directive.mmd) | [picture](../corpus/drawn/init-directive.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/flowchart/comments.mmd) | [picture](../corpus/drawn/comments.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/flowchart/accessibility.mmd) | [picture](../corpus/drawn/accessibility.svg) |
| A description written over several lines | Drawn |  | [source](../corpus/flowchart/accessibility-block.mmd) | [picture](../corpus/drawn/accessibility-block.svg) |
| Statements ended with semicolons, and no spaces | Drawn |  | [source](../corpus/flowchart/semicolons.mmd) | [picture](../corpus/drawn/semicolons.svg) |
| Boxes named by their id alone | Drawn |  | [source](../corpus/flowchart/node-id-only.mmd) | [picture](../corpus/drawn/node-id-only.svg) |
| A box with words | Drawn |  | [source](../corpus/flowchart/node-text.mmd) | [picture](../corpus/drawn/node-text.svg) |
| Words in other alphabets | Drawn |  | [source](../corpus/flowchart/node-unicode.mmd) | [picture](../corpus/drawn/node-unicode.svg) |
| Brackets and signs inside quotes | Drawn |  | [source](../corpus/flowchart/node-quoted.mmd) | [picture](../corpus/drawn/node-quoted.svg) |
| Characters written as entity codes | Drawn |  | [source](../corpus/flowchart/node-entities.mmd) | [picture](../corpus/drawn/node-entities.svg) |
| A line break in a label | Drawn |  | [source](../corpus/flowchart/node-line-break.mmd) | [picture](../corpus/drawn/node-line-break.svg) |
| Markdown strings: bold, italic and a real line break | Drawn, less something | Bold and italic are drawn as plain words | [source](../corpus/flowchart/node-markdown.mmd) | [picture](../corpus/drawn/node-markdown.svg) |
| A Font Awesome icon in a label | Drawn, less something | The icons are Merlive's own drawings of a truck and a tick, not Font Awesome's | [source](../corpus/flowchart/node-fontawesome.mmd) | [picture](../corpus/drawn/node-fontawesome.svg) |
| Shape: Round edges | Drawn, less something | Its corners are the design's, the same as every box | [source](../corpus/flowchart/shape-round.mmd) | [picture](../corpus/drawn/shape-round.svg) |
| Shape: Stadium | Drawn |  | [source](../corpus/flowchart/shape-stadium.mmd) | [picture](../corpus/drawn/shape-stadium.svg) |
| Shape: Subroutine | Drawn |  | [source](../corpus/flowchart/shape-subroutine.mmd) | [picture](../corpus/drawn/shape-subroutine.svg) |
| Shape: Cylinder, a database | Drawn |  | [source](../corpus/flowchart/shape-cylinder.mmd) | [picture](../corpus/drawn/shape-cylinder.svg) |
| Shape: Circle | Drawn, less something | Drawn as a pill: a circle the height of a box would hold three letters | [source](../corpus/flowchart/shape-circle.mmd) | [picture](../corpus/drawn/shape-circle.svg) |
| Shape: Asymmetric, a flag | Drawn |  | [source](../corpus/flowchart/shape-asymmetric.mmd) | [picture](../corpus/drawn/shape-asymmetric.svg) |
| Shape: Rhombus, a decision | Drawn |  | [source](../corpus/flowchart/shape-rhombus.mmd) | [picture](../corpus/drawn/shape-rhombus.svg) |
| Shape: Hexagon | Drawn |  | [source](../corpus/flowchart/shape-hexagon.mmd) | [picture](../corpus/drawn/shape-hexagon.svg) |
| Shape: Parallelogram | Drawn |  | [source](../corpus/flowchart/shape-parallelogram.mmd) | [picture](../corpus/drawn/shape-parallelogram.svg) |
| Shape: Parallelogram, leaning back | Drawn |  | [source](../corpus/flowchart/shape-parallelogram-alt.mmd) | [picture](../corpus/drawn/shape-parallelogram-alt.svg) |
| Shape: Trapezoid | Drawn |  | [source](../corpus/flowchart/shape-trapezoid.mmd) | [picture](../corpus/drawn/shape-trapezoid.svg) |
| Shape: Trapezoid, upside down | Drawn |  | [source](../corpus/flowchart/shape-trapezoid-alt.mmd) | [picture](../corpus/drawn/shape-trapezoid-alt.svg) |
| Shape: Double circle | Drawn |  | [source](../corpus/flowchart/shape-double-circle.mmd) | [picture](../corpus/drawn/shape-double-circle.svg) |
| Shapes written as @{ shape: … }, with a label | Drawn |  | [source](../corpus/flowchart/shape-at-syntax.mmd) | [picture](../corpus/drawn/shape-at-syntax.svg) |
| Every one of the 53 newer shapes | Drawn, less something | Those Merlive has a drawing for are drawn as themselves; the rest are boxes | [source](../corpus/flowchart/shape-at-every.mmd) | [picture](../corpus/drawn/shape-at-every.svg) |
| A box that is an icon | Drawn, less something | The icon is Merlive's own drawing of a user, beside the label and not above it | [source](../corpus/flowchart/shape-icon.mmd) | [picture](../corpus/drawn/shape-icon.svg) |
| A box that is an image | Drawn, less something | The image is left out (a page of Merlive fetches nothing); its label is kept | [source](../corpus/flowchart/shape-image.mmd) | [picture](../corpus/drawn/shape-image.svg) |
| Boxes given a row and a column | Drawn, less something | The rows and columns are read past: placement is Merlive's | [source](../corpus/flowchart/grid-layout.mmd) | [picture](../corpus/drawn/grid-layout.svg) |
| A link with an arrowhead | Drawn |  | [source](../corpus/flowchart/link-arrow.mmd) | [picture](../corpus/drawn/link-arrow.svg) |
| A link with no arrowhead | Drawn |  | [source](../corpus/flowchart/link-open.mmd) | [picture](../corpus/drawn/link-open.svg) |
| Words on a link, between bars | Drawn |  | [source](../corpus/flowchart/link-text-bars.mmd) | [picture](../corpus/drawn/link-text-bars.svg) |
| Words on a link, written into it | Drawn |  | [source](../corpus/flowchart/link-text-inline.mmd) | [picture](../corpus/drawn/link-text-inline.svg) |
| A dotted link, with and without words | Drawn |  | [source](../corpus/flowchart/link-dotted.mmd) | [picture](../corpus/drawn/link-dotted.svg) |
| A thick link, with and without words | Drawn |  | [source](../corpus/flowchart/link-thick.mmd) | [picture](../corpus/drawn/link-thick.svg) |
| An invisible link, used to nudge placement | Drawn, less something | Its boxes are read and the link is left out: it is only there to nudge Mermaid's placement, and placement is Merlive's | [source](../corpus/flowchart/link-invisible.mmd) | [picture](../corpus/drawn/link-invisible.svg) |
| Links chained in one line | Drawn |  | [source](../corpus/flowchart/link-chain.mmd) | [picture](../corpus/drawn/link-chain.svg) |
| One line linking to several boxes with & | Drawn |  | [source](../corpus/flowchart/link-chain-and.mmd) | [picture](../corpus/drawn/link-chain-and.svg) |
| Several boxes to several boxes with & | Drawn |  | [source](../corpus/flowchart/link-and-both.mmd) | [picture](../corpus/drawn/link-and-both.svg) |
| A link ending in a circle or a cross | Drawn |  | [source](../corpus/flowchart/link-circle-cross.mmd) | [picture](../corpus/drawn/link-circle-cross.svg) |
| Arrows at both ends | Drawn |  | [source](../corpus/flowchart/link-both-ways.mmd) | [picture](../corpus/drawn/link-both-ways.svg) |
| Links drawn longer, to push a box further on | Drawn, less something | The extra length is read past: placement is Merlive's | [source](../corpus/flowchart/link-length.mmd) | [picture](../corpus/drawn/link-length.svg) |
| A link from a box to itself | Drawn |  | [source](../corpus/flowchart/link-self.mmd) | [picture](../corpus/drawn/link-self.svg) |
| A link given an id | Drawn |  | [source](../corpus/flowchart/link-id.mmd) | [picture](../corpus/drawn/link-id.svg) |
| A link set to animate | Drawn, less something | Mermaid's animation is read past: movement is the design's, and starts when a reader asks | [source](../corpus/flowchart/link-animate.mmd) | [picture](../corpus/drawn/link-animate.svg) |
| Links played one step after another | Drawn, less something | The step numbers are read past; a walkthrough is written with "%% step" | [source](../corpus/flowchart/link-steps.mmd) | [picture](../corpus/drawn/link-steps.svg) |
| A link given a curve of its own | Drawn, less something | The curve is read past: lines turn at right angles by rule | [source](../corpus/flowchart/link-curve.mmd) | [picture](../corpus/drawn/link-curve.svg) |
| A group named by its title | Drawn |  | [source](../corpus/flowchart/subgraph-title.mmd) | [picture](../corpus/drawn/subgraph-title.svg) |
| A group with an id and a title | Drawn |  | [source](../corpus/flowchart/subgraph-id.mmd) | [picture](../corpus/drawn/subgraph-id.svg) |
| Links to a group and between groups | Drawn |  | [source](../corpus/flowchart/subgraph-links.mmd) | [picture](../corpus/drawn/subgraph-links.svg) |
| A group with a direction of its own | Drawn, less something | The group's own direction is read past; it runs the way the rest does | [source](../corpus/flowchart/subgraph-direction.mmd) | [picture](../corpus/drawn/subgraph-direction.svg) |
| A group inside a group | Drawn |  | [source](../corpus/flowchart/subgraph-nested.mmd) | [picture](../corpus/drawn/subgraph-nested.svg) |
| A group shown collapsed | Drawn, less something | Drawn open: a picture cannot be opened and closed | [source](../corpus/flowchart/subgraph-collapsed.mmd) | [picture](../corpus/drawn/subgraph-collapsed.svg) |
| A box styled on its own | Drawn, less something | Its outline is broken, heavy and red as written, in the design's own red; its fill is the design's | [source](../corpus/flowchart/style-node.mmd) | [picture](../corpus/drawn/style-node.svg) |
| Links styled by their number | Drawn, less something | The link is heavy and red as written, in the design's own red; a default for every link is read past | [source](../corpus/flowchart/style-link.mmd) | [picture](../corpus/drawn/style-link.svg) |
| A class made and given to boxes | Drawn |  | [source](../corpus/flowchart/class-def.mmd) | [picture](../corpus/drawn/class-def.svg) |
| A class given with ::: | Drawn |  | [source](../corpus/flowchart/class-inline.mmd) | [picture](../corpus/drawn/class-inline.svg) |
| A default class for every box | Drawn, less something | The default class is read past: the look is the design's | [source](../corpus/flowchart/class-default.mmd) | [picture](../corpus/drawn/class-default.svg) |
| A box that calls a function when clicked | Drawn, less something | The click is left out: a page of Merlive runs no code of yours | [source](../corpus/flowchart/click-callback.mmd) | [picture](../corpus/drawn/click-callback.svg) |
| A box that opens a link when clicked | Drawn, less something | The link is left out | [source](../corpus/flowchart/click-link.mmd) | [picture](../corpus/drawn/click-link.svg) |

## State diagrams, feature by feature

A state diagram is boxes and links, so it is read into what a flowchart is read into and placed by the same
rules. Held to the same measure as the flowcharts above.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A state diagram, declared with "stateDiagram-v2" | Drawn |  | [source](../corpus/state/state-declare-v2.mmd) | [picture](../corpus/drawn/state-declare-v2.svg) |
| A state diagram, declared with "stateDiagram" | Drawn |  | [source](../corpus/state/state-declare.mmd) | [picture](../corpus/drawn/state-declare.svg) |
| States named by their id alone | Drawn |  | [source](../corpus/state/state-id.mmd) | [picture](../corpus/drawn/state-id.svg) |
| A state with words, written "state words as id" | Drawn |  | [source](../corpus/state/state-as.mmd) | [picture](../corpus/drawn/state-as.svg) |
| A state with words, written "id : words" | Drawn |  | [source](../corpus/state/state-colon.mmd) | [picture](../corpus/drawn/state-colon.svg) |
| Words given a line at a time | Drawn |  | [source](../corpus/state/state-words-lines.mmd) | [picture](../corpus/drawn/state-words-lines.svg) |
| A name with spaces, by way of an id | Drawn |  | [source](../corpus/state/state-spaces.mmd) | [picture](../corpus/drawn/state-spaces.svg) |
| Transitions | Drawn |  | [source](../corpus/state/state-transition.mmd) | [picture](../corpus/drawn/state-transition.svg) |
| Transitions with words | Drawn |  | [source](../corpus/state/state-transition-words.mmd) | [picture](../corpus/drawn/state-transition-words.svg) |
| A transition from a state to itself | Drawn |  | [source](../corpus/state/state-self.mmd) | [picture](../corpus/drawn/state-self.svg) |
| Where it starts and where it ends | Drawn, less something | Where it starts and where it ends are pills that say so, not dots | [source](../corpus/state/state-start-end.mmd) | [picture](../corpus/drawn/state-start-end.svg) |
| A composite state | Drawn, less something | A transition to a composite state is drawn to where it starts inside, and one from it from where it ends | [source](../corpus/state/state-composite.mmd) | [picture](../corpus/drawn/state-composite.svg) |
| A composite state named on a line of its own | Drawn, less something | A transition to a composite state is drawn to where it starts inside, and one from it from where it ends | [source](../corpus/state/state-composite-named.mmd) | [picture](../corpus/drawn/state-composite-named.svg) |
| A composite state inside another | Drawn |  | [source](../corpus/state/state-composite-nested.mmd) | [picture](../corpus/drawn/state-composite-nested.svg) |
| Transitions between composite states | Drawn, less something | A transition to a composite state is drawn to where it starts inside, and one from it from where it ends | [source](../corpus/state/state-composite-links.mmd) | [picture](../corpus/drawn/state-composite-links.svg) |
| A choice | Drawn, less something | A choice is a decision the size of every box, with its name in it; Mermaid draws a small diamond with none | [source](../corpus/state/state-choice.mmd) | [picture](../corpus/drawn/state-choice.svg) |
| A fork and a join | Drawn, less something | A fork and a join are boxes with their names in them, not bars | [source](../corpus/state/state-fork-join.mmd) | [picture](../corpus/drawn/state-fork-join.svg) |
| A note on one line, on either side | Drawn, less something | A note is what a reader sees on picking its box in the page, and is printed with the page; it is not drawn beside the box, and a still picture does not carry it | [source](../corpus/state/state-note-line.mmd) | [picture](../corpus/drawn/state-note-line.svg) |
| A note written over several lines | Drawn, less something | A note is what a reader sees on picking its box in the page, and is printed with the page; it is not drawn beside the box, and a still picture does not carry it | [source](../corpus/state/state-note-block.mmd) | [picture](../corpus/drawn/state-note-block.svg) |
| Concurrency: regions of a composite state parted by -- | Partly read | line 6: concurrency ("--") is not read: the regions it parts are drawn as one | [source](../corpus/state/state-concurrency.mmd) | [picture](../corpus/drawn/state-concurrency.svg) |
| The direction of the diagram | Drawn |  | [source](../corpus/state/state-direction.mmd) | [picture](../corpus/drawn/state-direction.svg) |
| A composite state with a direction of its own | Drawn, less something | The composite state's own direction is read past; it runs the way the rest does | [source](../corpus/state/state-direction-composite.mmd) | [picture](../corpus/drawn/state-direction-composite.svg) |
| Comments, on a line of their own and at the end of one | Drawn |  | [source](../corpus/state/state-comments.mmd) | [picture](../corpus/drawn/state-comments.svg) |
| A class made with classDef and given with class | Drawn |  | [source](../corpus/state/state-class.mmd) | [picture](../corpus/drawn/state-class.svg) |
| A class given with ::: | Drawn |  | [source](../corpus/state/state-class-inline.mmd) | [picture](../corpus/drawn/state-class-inline.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/state/state-accessibility.mmd) | [picture](../corpus/drawn/state-accessibility.svg) |
| A title and settings in front matter | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/state/state-frontmatter.mmd) | [picture](../corpus/drawn/state-frontmatter.svg) |

## Sequence diagrams, feature by feature

Held to the same measure: every participant, message, note, frame and word the corpus says a sample has is read,
and every rule in [SEQUENCE.md](SEQUENCE.md) passes.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| Participants named by the messages they are in | Drawn |  | [source](../corpus/sequence/seq-participants-implicit.mmd) | [picture](../corpus/drawn/seq-participants-implicit.svg) |
| Participants declared, in an order of their own | Drawn |  | [source](../corpus/sequence/seq-participants-declared.mmd) | [picture](../corpus/drawn/seq-participants-declared.svg) |
| Actors: people, not systems | Drawn |  | [source](../corpus/sequence/seq-actors.mmd) | [picture](../corpus/drawn/seq-actors.svg) |
| A participant with a type: boundary, control, entity, database, collections, queue | Drawn, less something | A database is a box of the kind "data". The other five are plain boxes, told apart by their names, not by a symbol | [source](../corpus/sequence/seq-participant-types.mmd) | [picture](../corpus/drawn/seq-participant-types.svg) |
| A participant with a short id and a name, written with "as" | Drawn |  | [source](../corpus/sequence/seq-alias-as.mmd) | [picture](../corpus/drawn/seq-alias-as.svg) |
| A name written inside the braces | Drawn |  | [source](../corpus/sequence/seq-alias-inline.mmd) | [picture](../corpus/drawn/seq-alias-inline.svg) |
| A name inside the braces and another after "as": the one after "as" wins | Drawn |  | [source](../corpus/sequence/seq-alias-precedence.mmd) | [picture](../corpus/drawn/seq-alias-precedence.svg) |
| A participant made part way down, and one ended | Drawn |  | [source](../corpus/sequence/seq-create-destroy.mmd) | [picture](../corpus/drawn/seq-create-destroy.svg) |
| Participants grouped in boxes, with and without a colour and a title | Drawn, less something | A group's colour is read past: the look is the design's | [source](../corpus/sequence/seq-box-groups.mmd) | [picture](../corpus/drawn/seq-box-groups.svg) |
| A message with no arrowhead, solid and dotted | Drawn |  | [source](../corpus/sequence/seq-message-line.mmd) | [picture](../corpus/drawn/seq-message-line.svg) |
| A message with an arrowhead, solid and dotted | Drawn |  | [source](../corpus/sequence/seq-message-arrow.mmd) | [picture](../corpus/drawn/seq-message-arrow.svg) |
| A message with an arrowhead at both ends | Drawn |  | [source](../corpus/sequence/seq-message-both-ways.mmd) | [picture](../corpus/drawn/seq-message-both-ways.svg) |
| A message that ends in a cross | Drawn |  | [source](../corpus/sequence/seq-message-cross.mmd) | [picture](../corpus/drawn/seq-message-cross.svg) |
| A message that does not wait: an open arrow | Drawn |  | [source](../corpus/sequence/seq-message-async.mmd) | [picture](../corpus/drawn/seq-message-async.svg) |
| A message from a participant to itself | Drawn |  | [source](../corpus/sequence/seq-message-self.mmd) | [picture](../corpus/drawn/seq-message-self.svg) |
| Half arrows | Partly read | read 0 of 2 participants; read 0 of 4 messages; line 2: half arrows are not read yet: "Buyer-\|\ERP: Top half"; line 3: half arrows are not read yet: "ERP--\|/Buyer: Bottom half"; line 4: half arrows are not read yet: "Buyer-\\ERP: Top stick"; line 5: half arrows are not read yet: "ERP--//Buyer: Bottom stick" | [source](../corpus/sequence/seq-half-arrows.mmd) |  |
| A message to or from the middle of a line | Partly read | read 0 of 3 messages; line 4: a message to the middle of a line, written with (), is not read yet: "Buyer->>()ERP: Raise order"; line 5: a message to the middle of a line, written with (), is not read yet: "Buyer()->>ERP: Chase it"; line 6: a message to the middle of a line, written with (), is not read yet: "ERP()->>()Buyer: Done" | [source](../corpus/sequence/seq-central-connection.mmd) | [picture](../corpus/drawn/seq-central-connection.svg) |
| A participant at work, written with activate and deactivate | Drawn |  | [source](../corpus/sequence/seq-activation-explicit.mmd) | [picture](../corpus/drawn/seq-activation-explicit.svg) |
| A participant at work, written with + and - | Drawn |  | [source](../corpus/sequence/seq-activation-shortcut.mmd) | [picture](../corpus/drawn/seq-activation-shortcut.svg) |
| A participant at work twice at once | Drawn |  | [source](../corpus/sequence/seq-activation-stacked.mmd) | [picture](../corpus/drawn/seq-activation-stacked.svg) |
| A note to the right or the left of a participant | Drawn |  | [source](../corpus/sequence/seq-note-beside.mmd) | [picture](../corpus/drawn/seq-note-beside.svg) |
| A note over a participant | Drawn |  | [source](../corpus/sequence/seq-note-over.mmd) | [picture](../corpus/drawn/seq-note-over.svg) |
| A note over two participants | Drawn |  | [source](../corpus/sequence/seq-note-over-two.mmd) | [picture](../corpus/drawn/seq-note-over-two.svg) |
| A line break in a message, a note and a name | Drawn |  | [source](../corpus/sequence/seq-line-breaks.mmd) | [picture](../corpus/drawn/seq-line-breaks.svg) |
| A loop | Drawn |  | [source](../corpus/sequence/seq-loop.mmd) | [picture](../corpus/drawn/seq-loop.svg) |
| One way or another: alt and else | Drawn |  | [source](../corpus/sequence/seq-alt-else.mmd) | [picture](../corpus/drawn/seq-alt-else.svg) |
| Something that may not happen: opt | Drawn |  | [source](../corpus/sequence/seq-opt.mmd) | [picture](../corpus/drawn/seq-opt.svg) |
| Things done at once: par and and | Drawn |  | [source](../corpus/sequence/seq-par.mmd) | [picture](../corpus/drawn/seq-par.svg) |
| A block inside a block | Drawn |  | [source](../corpus/sequence/seq-par-nested.mmd) | [picture](../corpus/drawn/seq-par-nested.svg) |
| What must happen, and what to do when it cannot: critical and option | Drawn |  | [source](../corpus/sequence/seq-critical.mmd) | [picture](../corpus/drawn/seq-critical.svg) |
| A critical block with no options | Drawn |  | [source](../corpus/sequence/seq-critical-plain.mmd) | [picture](../corpus/drawn/seq-critical-plain.svg) |
| Where the sequence stops: break | Drawn |  | [source](../corpus/sequence/seq-break.mmd) | [picture](../corpus/drawn/seq-break.svg) |
| Rows highlighted with a coloured background, one inside another | Drawn, less something | The highlight's colour is read past: it is drawn in the design's own tint | [source](../corpus/sequence/seq-rect.mmd) | [picture](../corpus/drawn/seq-rect.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/sequence/seq-comments.mmd) | [picture](../corpus/drawn/seq-comments.svg) |
| Characters written as entity codes | Drawn |  | [source](../corpus/sequence/seq-entity-codes.mmd) | [picture](../corpus/drawn/seq-entity-codes.svg) |
| Messages numbered | Drawn |  | [source](../corpus/sequence/seq-autonumber.mmd) | [picture](../corpus/drawn/seq-autonumber.svg) |
| Messages numbered from a start, by a step | Drawn |  | [source](../corpus/sequence/seq-autonumber-from.mmd) | [picture](../corpus/drawn/seq-autonumber-from.svg) |
| A menu of links on a participant | Drawn, less something | The menus are left out: a page of Merlive opens no links | [source](../corpus/sequence/seq-actor-menus.mmd) | [picture](../corpus/drawn/seq-actor-menus.svg) |
| A title in the diagram | Drawn |  | [source](../corpus/sequence/seq-title.mmd) | [picture](../corpus/drawn/seq-title.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/sequence/seq-accessibility.mmd) | [picture](../corpus/drawn/seq-accessibility.svg) |
| Statements parted by semicolons | Drawn |  | [source](../corpus/sequence/seq-semicolons.mmd) | [picture](../corpus/drawn/seq-semicolons.svg) |
| A title and settings in front matter | Drawn, less something | Mermaid's own settings are read past: the look and the numbering are the design's and the diagram's own | [source](../corpus/sequence/seq-frontmatter.mmd) | [picture](../corpus/drawn/seq-frontmatter.svg) |

## Other kinds of diagram

One that is not drawn is left exactly as it was written, and the command names it. The family says what it would
take: a diagram of boxes and links could be placed by the rules Merlive already has; the others need a way of
drawing of their own.

### Steps in order

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Sequence diagram | Drawn | [source](../corpus/kinds/sequence.mmd) | [picture](../corpus/drawn/sequence.svg) |
| ZenUML sequence diagram | Left as Mermaid | [source](../corpus/kinds/zenuml.mmd) |  |
| Event model | Left as Mermaid | [source](../corpus/kinds/eventmodeling.mmd) |  |
| User journey | Left as Mermaid | [source](../corpus/kinds/journey.mmd) |  |
| Timeline | Left as Mermaid | [source](../corpus/kinds/timeline.mmd) |  |
| Gantt chart | Left as Mermaid | [source](../corpus/kinds/gantt.mmd) |  |
| Git graph | Left as Mermaid | [source](../corpus/kinds/gitgraph.mmd) |  |

### Boxes and links

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Class diagram | Left as Mermaid | [source](../corpus/kinds/class.mmd) |  |
| State diagram | Drawn | [source](../corpus/kinds/state.mmd) | [picture](../corpus/drawn/state.svg) |
| Entity relationship diagram | Left as Mermaid | [source](../corpus/kinds/er.mmd) |  |
| Requirement diagram | Left as Mermaid | [source](../corpus/kinds/requirement.mmd) |  |
| C4 diagram | Left as Mermaid | [source](../corpus/kinds/c4.mmd) |  |
| Block diagram | Left as Mermaid | [source](../corpus/kinds/block.mmd) |  |
| Architecture diagram | Left as Mermaid | [source](../corpus/kinds/architecture.mmd) |  |
| Swimlane diagram | Left as Mermaid | [source](../corpus/kinds/swimlane.mmd) |  |
| Use case diagram | Left as Mermaid | [source](../corpus/kinds/usecase.mmd) |  |
| Agent flow | Left as Mermaid | [source](../corpus/kinds/agentflow.mmd) |  |

### Tree

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Mindmap | Left as Mermaid | [source](../corpus/kinds/mindmap.mmd) |  |
| Tree view | Left as Mermaid | [source](../corpus/kinds/treeview.mmd) |  |
| Ishikawa (fishbone) diagram | Left as Mermaid | [source](../corpus/kinds/ishikawa.mmd) |  |
| Kanban board | Left as Mermaid | [source](../corpus/kinds/kanban.mmd) |  |

### Chart

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Treemap | Left as Mermaid | [source](../corpus/kinds/treemap.mmd) |  |
| Pie chart | Left as Mermaid | [source](../corpus/kinds/pie.mmd) |  |
| Quadrant chart | Left as Mermaid | [source](../corpus/kinds/quadrant.mmd) |  |
| XY chart | Left as Mermaid | [source](../corpus/kinds/xychart.mmd) |  |
| Sankey diagram | Left as Mermaid | [source](../corpus/kinds/sankey.mmd) |  |
| Radar chart | Left as Mermaid | [source](../corpus/kinds/radar.mmd) |  |
| Packet diagram | Left as Mermaid | [source](../corpus/kinds/packet.mmd) |  |
| Venn diagram | Left as Mermaid | [source](../corpus/kinds/venn.mmd) |  |
| Cynefin framework | Left as Mermaid | [source](../corpus/kinds/cynefin.mmd) |  |
| Wardley map | Left as Mermaid | [source](../corpus/kinds/wardley.mmd) |  |

### Grammar

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Railroad (syntax) diagram | Left as Mermaid | [source](../corpus/kinds/railroad.mmd) |  |
