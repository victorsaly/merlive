# What Merlive draws of Mermaid

Written by `npm run coverage`. Do not edit it by hand: change the code or the corpus and run it again.

The syntax pages of mermaid-js/mermaid at 6374e52 (2026-11-23): one row for every kind of diagram it documents and every feature its flowchart, state diagram, class diagram, entity diagram and sequence diagram pages set out. The samples are our own.

## In short

- **Flowcharts:** of 70 features, 49 are drawn as written, 21 are drawn less something Merlive leaves out on purpose or does not have yet, 0 are only partly read, and 0 are refused.
- **State diagrams:** of 27 features, 17 are drawn as written, 10 are drawn less something, 0 are only partly read, and 0 are refused.
- **Class diagrams:** of 36 features, 28 are drawn as written, 8 are drawn less something, 0 are only partly read, 0 are refused.
- **Entity diagrams:** of 48 features, 38 are drawn as written, 10 are drawn less something, 0 are only partly read, 0 are refused.
- **Requirement diagrams:** of 46 features, 37 are drawn as written, 9 are drawn less something, 0 are only partly read, 0 are refused.
- **C4 diagrams:** of 41 features, 25 are drawn as written, 16 are drawn less something, 0 are only partly read, 0 are refused.
- **Architecture diagrams:** of 28 features, 17 are drawn as written, 11 are drawn less something, 0 are only partly read, 0 are refused.
- **Block diagrams:** of 36 features, 31 are drawn as written, 5 are drawn less something, 0 are only partly read, 0 are refused.
- **Mindmaps:** of 38 features, 33 are drawn as written, 5 are drawn less something, 0 are only partly read, 0 are refused.
- **Kanban boards:** of 25 features, 17 are drawn as written, 8 are drawn less something, 0 are only partly read, 0 are refused.
- **Timelines:** of 29 features, 29 are drawn as written, 0 are drawn less something, 0 are only partly read, 0 are refused.
- **Packets:** of 22 features, 22 are drawn as written, 0 are drawn less something, 0 are only partly read, 0 are refused.
- **Sequence diagrams:** of 42 features, 38 are drawn as written, 4 are drawn less something, 0 are only partly read, and 0 are refused.
- **Every kind of diagram:** of 32, 12 drawn (those with their own lists above), and 20 left as Mermaid and named.

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
| Direction BT: bottom to top | Drawn |  | [source](../corpus/flowchart/direction-bt.mmd) | [picture](../corpus/drawn/direction-bt.svg) |
| Direction RL: right to left | Drawn |  | [source](../corpus/flowchart/direction-rl.mmd) | [picture](../corpus/drawn/direction-rl.svg) |
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
| Markdown strings: bold, italic and a real line break | Drawn |  | [source](../corpus/flowchart/node-markdown.mmd) | [picture](../corpus/drawn/node-markdown.svg) |
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
| A box styled on its own | Drawn, less something | Its outline is broken, heavy and red as written, and its fill a wash of that red, in the design's own red | [source](../corpus/flowchart/style-node.mmd) | [picture](../corpus/drawn/style-node.svg) |
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
| Concurrency: regions of a composite state parted by -- | Drawn |  | [source](../corpus/state/state-concurrency.mmd) | [picture](../corpus/drawn/state-concurrency.svg) |
| The direction of the diagram | Drawn |  | [source](../corpus/state/state-direction.mmd) | [picture](../corpus/drawn/state-direction.svg) |
| A composite state with a direction of its own | Drawn, less something | The composite state's own direction is read past; it runs the way the rest does | [source](../corpus/state/state-direction-composite.mmd) | [picture](../corpus/drawn/state-direction-composite.svg) |
| Comments, on a line of their own and at the end of one | Drawn |  | [source](../corpus/state/state-comments.mmd) | [picture](../corpus/drawn/state-comments.svg) |
| A class made with classDef and given with class | Drawn |  | [source](../corpus/state/state-class.mmd) | [picture](../corpus/drawn/state-class.svg) |
| A class given with ::: | Drawn |  | [source](../corpus/state/state-class-inline.mmd) | [picture](../corpus/drawn/state-class-inline.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/state/state-accessibility.mmd) | [picture](../corpus/drawn/state-accessibility.svg) |
| A title and settings in front matter | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/state/state-frontmatter.mmd) | [picture](../corpus/drawn/state-frontmatter.svg) |

## Class diagrams, feature by feature

A class is a box that lists its attributes and its methods under its name. Held to the same measure, and to
the rows each box lists and what each link ends in.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A class, declared with "class" | Drawn |  | [source](../corpus/class/class-declare.mmd) | [picture](../corpus/drawn/class-declare.svg) |
| Two classes made by tying one to the other | Drawn |  | [source](../corpus/class/class-declare-relation.mmd) | [picture](../corpus/drawn/class-declare-relation.svg) |
| A class diagram, declared with "classDiagram-v2" | Drawn |  | [source](../corpus/class/class-declare-v2.mmd) | [picture](../corpus/drawn/class-declare-v2.svg) |
| A title in front matter | Drawn |  | [source](../corpus/class/class-title.mmd) | [picture](../corpus/drawn/class-title.svg) |
| A class with a label | Drawn |  | [source](../corpus/class/class-label.mmd) | [picture](../corpus/drawn/class-label.svg) |
| A class named between backticks | Drawn |  | [source](../corpus/class/class-backticks.mmd) | [picture](../corpus/drawn/class-backticks.svg) |
| Members given one at a time, after a colon | Drawn |  | [source](../corpus/class/class-members-colon.mmd) | [picture](../corpus/drawn/class-members-colon.svg) |
| Members given together, between brackets | Drawn |  | [source](../corpus/class/class-members-block.mmd) | [picture](../corpus/drawn/class-members-block.svg) |
| What a method gives back | Drawn |  | [source](../corpus/class/class-return-type.mmd) | [picture](../corpus/drawn/class-return-type.svg) |
| Generic types, in a class, a member and what a method gives back | Drawn |  | [source](../corpus/class/class-generics.mmd) | [picture](../corpus/drawn/class-generics.svg) |
| Who may see a member: public, private, protected, package | Drawn |  | [source](../corpus/class/class-visibility.mmd) | [picture](../corpus/drawn/class-visibility.svg) |
| Members marked abstract or static | Drawn, less something | Abstract and static are said in words at the end of the row, where Mermaid slants or underlines it | [source](../corpus/class/class-classifiers.mmd) | [picture](../corpus/drawn/class-classifiers.svg) |
| The eight relations | Drawn |  | [source](../corpus/class/class-relations.mmd) | [picture](../corpus/drawn/class-relations.svg) |
| The eight relations written the other way round, each with words | Drawn, less something | "Is a" is drawn from the parent down to the child, whichever way it was written | [source](../corpus/class/class-relations-reversed.mmd) | [picture](../corpus/drawn/class-relations-reversed.svg) |
| Words on a relation | Drawn |  | [source](../corpus/class/class-relation-labels.mmd) | [picture](../corpus/drawn/class-relation-labels.svg) |
| A relation that says something at both ends | Drawn |  | [source](../corpus/class/class-two-way.mmd) | [picture](../corpus/drawn/class-two-way.svg) |
| A lollipop interface | Drawn, less something | A lollipop is drawn as a box of its own, named for the interface and marked «interface», with the circle on its line | [source](../corpus/class/class-lollipop.mmd) | [picture](../corpus/drawn/class-lollipop.svg) |
| How many, at either end of a relation | Drawn |  | [source](../corpus/class/class-cardinality.mmd) | [picture](../corpus/drawn/class-cardinality.svg) |
| A namespace | Drawn |  | [source](../corpus/class/class-namespace.mmd) | [picture](../corpus/drawn/class-namespace.svg) |
| A namespace with a label | Drawn |  | [source](../corpus/class/class-namespace-label.mmd) | [picture](../corpus/drawn/class-namespace-label.svg) |
| A namespace written inside another | Drawn |  | [source](../corpus/class/class-namespace-nested.mmd) | [picture](../corpus/drawn/class-namespace-nested.svg) |
| Namespaces inside one another, spelt with dots | Drawn |  | [source](../corpus/class/class-namespace-dotted.mmd) | [picture](../corpus/drawn/class-namespace-dotted.svg) |
| An annotation, on the line that declares the class | Drawn |  | [source](../corpus/class/class-annotation-inline.mmd) | [picture](../corpus/drawn/class-annotation-inline.svg) |
| An annotation, on a line of its own | Drawn |  | [source](../corpus/class/class-annotation-line.mmd) | [picture](../corpus/drawn/class-annotation-line.svg) |
| An annotation, inside the class | Drawn |  | [source](../corpus/class/class-annotation-nested.mmd) | [picture](../corpus/drawn/class-annotation-nested.svg) |
| A comment on a line of its own | Drawn |  | [source](../corpus/class/class-comments.mmd) | [picture](../corpus/drawn/class-comments.svg) |
| A direction for the whole diagram | Drawn, less something | Drawn top to bottom: boxes of different heights are only placed that way yet | [source](../corpus/class/class-direction.mmd) | [picture](../corpus/drawn/class-direction.svg) |
| A class that opens a link or calls a function when clicked | Drawn, less something | The clicks are left out: a page of Merlive opens no links and runs no code of yours | [source](../corpus/class/class-interaction.mmd) | [picture](../corpus/drawn/class-interaction.svg) |
| A note for a class | Drawn |  | [source](../corpus/class/class-note-for.mmd) | [picture](../corpus/drawn/class-note-for.svg) |
| A note for no class in particular | Drawn |  | [source](../corpus/class/class-note-general.mmd) | [picture](../corpus/drawn/class-note-general.svg) |
| A class styled on its own | Drawn, less something | Each is filled with its colour and its outline heavy or broken as written, in the design's own colour of that hue; an edge of another colour than its fill is drawn in the fill's | [source](../corpus/class/class-style.mmd) | [picture](../corpus/drawn/class-style.svg) |
| A style class made with classDef and given with cssClass | Drawn |  | [source](../corpus/class/class-classdef.mmd) | [picture](../corpus/drawn/class-classdef.svg) |
| A style class given with ::: | Drawn |  | [source](../corpus/class/class-css-inline.mmd) | [picture](../corpus/drawn/class-css-inline.svg) |
| A default style class for every class | Drawn, less something | The default class is read past: the look is the design's | [source](../corpus/class/class-default-class.mmd) | [picture](../corpus/drawn/class-default-class.svg) |
| A style class kept in the page's own stylesheet | Drawn, less something | A page's own stylesheet cannot be read from here: the class is of that kind, in the design's plain look | [source](../corpus/class/class-css-class.mmd) | [picture](../corpus/drawn/class-css-class.svg) |
| A whole diagram: classes, what they list, what they inherit, and a note | Drawn |  | [source](../corpus/class/class-whole.mmd) | [picture](../corpus/drawn/class-whole.svg) |

## Entity diagrams, feature by feature

An entity is a box that lists its attributes under its name, and a relationship ends in how many. Held to the
same measure, and to the rows each box lists and what each link ends in.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| An entity diagram: entities, and the relationships between them | Drawn |  | [source](../corpus/er/er-declare.mmd) | [picture](../corpus/drawn/er-declare.svg) |
| An entity with no relationships | Drawn |  | [source](../corpus/er/er-entity-alone.mmd) | [picture](../corpus/drawn/er-entity-alone.svg) |
| Attributes: a type and a name each | Drawn |  | [source](../corpus/er/er-attributes.mmd) | [picture](../corpus/drawn/er-attributes.svg) |
| An entity declared twice, its attributes joined | Drawn |  | [source](../corpus/er/er-entity-twice.mmd) | [picture](../corpus/drawn/er-entity-twice.svg) |
| An entity declared with no attributes between its braces | Drawn |  | [source](../corpus/er/er-entity-empty.mmd) | [picture](../corpus/drawn/er-entity-empty.svg) |
| A name with a hyphen in it | Drawn |  | [source](../corpus/er/er-name-hyphen.mmd) | [picture](../corpus/drawn/er-name-hyphen.svg) |
| A name with spaces, in quotes | Drawn |  | [source](../corpus/er/er-name-quoted.mmd) | [picture](../corpus/drawn/er-name-quoted.svg) |
| Names, words and attributes in other alphabets | Drawn |  | [source](../corpus/er/er-name-unicode.mmd) | [picture](../corpus/drawn/er-name-unicode.svg) |
| A name written as Markdown | Drawn, less something | Bold and italic are drawn as plain words | [source](../corpus/er/er-name-markdown.mmd) | [picture](../corpus/drawn/er-name-markdown.svg) |
| An alias shown in place of the name | Drawn |  | [source](../corpus/er/er-alias.mmd) | [picture](../corpus/drawn/er-alias.svg) |
| Zero or one, at either end | Drawn |  | [source](../corpus/er/er-cardinality-zero-or-one.mmd) | [picture](../corpus/drawn/er-cardinality-zero-or-one.svg) |
| Exactly one, at either end | Drawn |  | [source](../corpus/er/er-cardinality-exactly-one.mmd) | [picture](../corpus/drawn/er-cardinality-exactly-one.svg) |
| Zero or more, at either end | Drawn |  | [source](../corpus/er/er-cardinality-zero-or-more.mmd) | [picture](../corpus/drawn/er-cardinality-zero-or-more.svg) |
| One or more, at either end | Drawn |  | [source](../corpus/er/er-cardinality-one-or-more.mmd) | [picture](../corpus/drawn/er-cardinality-one-or-more.svg) |
| A mark written the other way round for its end | Drawn |  | [source](../corpus/er/er-cardinality-mirrored.mmd) | [picture](../corpus/drawn/er-cardinality-mirrored.svg) |
| How many, written in words | Drawn |  | [source](../corpus/er/er-cardinality-words.mmd) | [picture](../corpus/drawn/er-cardinality-words.svg) |
| How many, in the short forms: 1, 1+, 0+, many(0), many(1) | Drawn |  | [source](../corpus/er/er-cardinality-short.mmd) | [picture](../corpus/drawn/er-cardinality-short.svg) |
| A relationship that identifies: a solid line | Drawn |  | [source](../corpus/er/er-identifying.mmd) | [picture](../corpus/drawn/er-identifying.svg) |
| A relationship that does not identify: a dotted line | Drawn |  | [source](../corpus/er/er-non-identifying.mmd) | [picture](../corpus/drawn/er-non-identifying.svg) |
| Identifying or not, written in words | Drawn |  | [source](../corpus/er/er-identifying-words.mmd) | [picture](../corpus/drawn/er-identifying-words.svg) |
| A relationship's words, in quotes | Drawn |  | [source](../corpus/er/er-label-quoted.mmd) | [picture](../corpus/drawn/er-label-quoted.svg) |
| A relationship with empty words | Drawn |  | [source](../corpus/er/er-label-empty.mmd) | [picture](../corpus/drawn/er-label-empty.svg) |
| A relationship written with no spaces | Drawn |  | [source](../corpus/er/er-no-spaces.mmd) | [picture](../corpus/drawn/er-no-spaces.svg) |
| A relationship from an entity to itself | Drawn |  | [source](../corpus/er/er-self.mmd) | [picture](../corpus/drawn/er-self.svg) |
| Keys: primary, foreign and unique | Drawn |  | [source](../corpus/er/er-attribute-keys.mmd) | [picture](../corpus/drawn/er-attribute-keys.svg) |
| Several keys on one attribute | Drawn |  | [source](../corpus/er/er-attribute-keys-several.mmd) | [picture](../corpus/drawn/er-attribute-keys-several.svg) |
| A star before a name, for a primary key | Drawn |  | [source](../corpus/er/er-attribute-star.mmd) | [picture](../corpus/drawn/er-attribute-star.svg) |
| A comment on an attribute | Drawn, less something | A comment is not in its row: it is in the note on its entity, which a reader sees on picking the box | [source](../corpus/er/er-attribute-comment.mmd) | [picture](../corpus/drawn/er-attribute-comment.svg) |
| Types with a length, a list, and two numbers | Drawn |  | [source](../corpus/er/er-attribute-types.mmd) | [picture](../corpus/drawn/er-attribute-types.svg) |
| A type that may be missing | Drawn |  | [source](../corpus/er/er-attribute-optional.mmd) | [picture](../corpus/drawn/er-attribute-optional.svg) |
| Direction: top to bottom | Drawn |  | [source](../corpus/er/er-direction-tb.mmd) | [picture](../corpus/drawn/er-direction-tb.svg) |
| Direction: left to right | Drawn, less something | Drawn top to bottom: boxes of different heights are only placed that way yet | [source](../corpus/er/er-direction-lr.mmd) | [picture](../corpus/drawn/er-direction-lr.svg) |
| A group, named by one word | Drawn |  | [source](../corpus/er/er-subgraph.mmd) | [picture](../corpus/drawn/er-subgraph.svg) |
| A group named by words in quotes | Drawn |  | [source](../corpus/er/er-subgraph-quoted.mmd) | [picture](../corpus/drawn/er-subgraph-quoted.svg) |
| A group with an id and a title | Drawn |  | [source](../corpus/er/er-subgraph-id.mmd) | [picture](../corpus/drawn/er-subgraph-id.svg) |
| A group inside a group | Drawn |  | [source](../corpus/er/er-subgraph-nested.mmd) | [picture](../corpus/drawn/er-subgraph-nested.svg) |
| Relationships to and from groups | Drawn, less something | A relationship with a group is drawn to where the group starts, or from where it ends | [source](../corpus/er/er-subgraph-links.mmd) | [picture](../corpus/drawn/er-subgraph-links.svg) |
| A group with a direction of its own | Drawn, less something | The group's own direction is read past; it runs the way the rest does | [source](../corpus/er/er-subgraph-direction.mmd) | [picture](../corpus/drawn/er-subgraph-direction.svg) |
| An entity styled on its own | Drawn, less something | Its outline is broken, heavy and red as written, and its fill a wash of that red, in the design's own red | [source](../corpus/er/er-style.mmd) | [picture](../corpus/drawn/er-style.svg) |
| Several entities styled in one line | Drawn, less something | Their outlines are heavy and blue as written, in the design's own blue | [source](../corpus/er/er-style-several.mmd) | [picture](../corpus/drawn/er-style-several.svg) |
| A class made and given to entities | Drawn |  | [source](../corpus/er/er-class-def.mmd) | [picture](../corpus/drawn/er-class-def.svg) |
| Several classes given at once | Drawn, less something | A box is of one kind: of several classes, the first is the one it is | [source](../corpus/er/er-class-several.mmd) | [picture](../corpus/drawn/er-class-several.svg) |
| A class given with ::: | Drawn |  | [source](../corpus/er/er-class-inline.mmd) | [picture](../corpus/drawn/er-class-inline.svg) |
| A class given with ::: in a relationship | Drawn |  | [source](../corpus/er/er-class-inline-relationship.mmd) | [picture](../corpus/drawn/er-class-inline-relationship.svg) |
| A default class for every entity | Drawn, less something | The default class is read past: the look is the design's | [source](../corpus/er/er-class-default.mmd) | [picture](../corpus/drawn/er-class-default.svg) |
| A title and settings in front matter | Drawn, less something | Mermaid's own settings are read past: the look and the placement are Merlive's | [source](../corpus/er/er-frontmatter.mmd) | [picture](../corpus/drawn/er-frontmatter.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/er/er-accessibility.mmd) | [picture](../corpus/drawn/er-accessibility.svg) |
| Comments, on lines of their own, between statements and between attributes | Drawn |  | [source](../corpus/er/er-comments.mmd) | [picture](../corpus/drawn/er-comments.svg) |

## Requirement diagrams, feature by feature

A requirement is a box that says what kind it is, a sentence of what it asks, and its id, risk and how it is
verified. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A requirement diagram: a requirement, an element, and how one bears on the other | Drawn |  | [source](../corpus/requirement/requirement-declare.mmd) | [picture](../corpus/drawn/requirement-declare.svg) |
| The six kinds of requirement | Drawn |  | [source](../corpus/requirement/requirement-types.mmd) | [picture](../corpus/drawn/requirement-types.svg) |
| What is said of a requirement: its id, its text, its risk and how it is verified | Drawn |  | [source](../corpus/requirement/requirement-fields.mmd) | [picture](../corpus/drawn/requirement-fields.svg) |
| What is said of a requirement, written in another order | Drawn |  | [source](../corpus/requirement/requirement-fields-order.mmd) | [picture](../corpus/drawn/requirement-fields-order.svg) |
| Requirements of which only some things are said | Drawn |  | [source](../corpus/requirement/requirement-fields-some.mmd) | [picture](../corpus/drawn/requirement-fields-some.svg) |
| The three risks: low, medium and high | Drawn |  | [source](../corpus/requirement/requirement-risk.mmd) | [picture](../corpus/drawn/requirement-risk.svg) |
| The four ways to verify: analysis, demonstration, inspection and test | Drawn |  | [source](../corpus/requirement/requirement-verify.mmd) | [picture](../corpus/drawn/requirement-verify.svg) |
| Mermaid's own words written with capitals | Drawn |  | [source](../corpus/requirement/requirement-case.mmd) | [picture](../corpus/drawn/requirement-case.svg) |
| A requirement and an element of which nothing is said | Drawn |  | [source](../corpus/requirement/requirement-empty.mmd) | [picture](../corpus/drawn/requirement-empty.svg) |
| An id with dots, and one of letters | Drawn |  | [source](../corpus/requirement/requirement-id-dotted.mmd) | [picture](../corpus/drawn/requirement-id-dotted.svg) |
| An id in quotes | Drawn |  | [source](../corpus/requirement/requirement-id-quoted.mmd) | [picture](../corpus/drawn/requirement-id-quoted.svg) |
| A text in quotes, with a colon and a comma in it | Drawn |  | [source](../corpus/requirement/requirement-text-quoted.mmd) | [picture](../corpus/drawn/requirement-text-quoted.svg) |
| A text written as Markdown | Drawn, less something | Bold and italic in a requirement's text are drawn as plain words | [source](../corpus/requirement/requirement-text-markdown.mmd) | [picture](../corpus/drawn/requirement-text-markdown.svg) |
| An element: its type and the document it points to | Drawn |  | [source](../corpus/requirement/requirement-element.mmd) | [picture](../corpus/drawn/requirement-element.svg) |
| An element's type and document in quotes | Drawn |  | [source](../corpus/requirement/requirement-element-quoted.mmd) | [picture](../corpus/drawn/requirement-element-quoted.svg) |
| Elements with a type or a document, not both | Drawn |  | [source](../corpus/requirement/requirement-element-type-only.mmd) | [picture](../corpus/drawn/requirement-element-type-only.svg) |
| The seven relationships | Drawn |  | [source](../corpus/requirement/requirement-relationships.mmd) | [picture](../corpus/drawn/requirement-relationships.svg) |
| Relationships written from their other end | Drawn |  | [source](../corpus/requirement/requirement-relationships-reversed.mmd) | [picture](../corpus/drawn/requirement-relationships-reversed.svg) |
| A requirement that contains others | Drawn, less something | The crossed ring Mermaid draws at the requirement that contains is drawn as a filled circle | [source](../corpus/requirement/requirement-contains.mmd) | [picture](../corpus/drawn/requirement-contains.svg) |
| Relationships written with no spaces | Drawn |  | [source](../corpus/requirement/requirement-relationship-tight.mmd) | [picture](../corpus/drawn/requirement-relationship-tight.svg) |
| A relationship's word written with a capital | Drawn |  | [source](../corpus/requirement/requirement-relationship-case.mmd) | [picture](../corpus/drawn/requirement-relationship-case.svg) |
| A relationship from a requirement to itself | Drawn |  | [source](../corpus/requirement/requirement-relationship-self.mmd) | [picture](../corpus/drawn/requirement-relationship-self.svg) |
| A relationship written before what it joins is declared | Drawn |  | [source](../corpus/requirement/requirement-relationship-before.mmd) | [picture](../corpus/drawn/requirement-relationship-before.svg) |
| Names in quotes, of several words | Drawn |  | [source](../corpus/requirement/requirement-name-quoted.mmd) | [picture](../corpus/drawn/requirement-name-quoted.svg) |
| Names of several words, without quotes | Drawn |  | [source](../corpus/requirement/requirement-name-words.mmd) | [picture](../corpus/drawn/requirement-name-words.svg) |
| A name and a text in another alphabet | Drawn |  | [source](../corpus/requirement/requirement-name-unicode.mmd) | [picture](../corpus/drawn/requirement-name-unicode.svg) |
| Names with a dot, and one that starts with a digit | Drawn |  | [source](../corpus/requirement/requirement-name-dot.mmd) | [picture](../corpus/drawn/requirement-name-dot.svg) |
| A name written as Markdown | Drawn |  | [source](../corpus/requirement/requirement-name-markdown.mmd) | [picture](../corpus/drawn/requirement-name-markdown.svg) |
| A requirement declared twice | Drawn |  | [source](../corpus/requirement/requirement-twice.mmd) | [picture](../corpus/drawn/requirement-twice.svg) |
| Direction: top to bottom | Drawn |  | [source](../corpus/requirement/requirement-direction-tb.mmd) | [picture](../corpus/drawn/requirement-direction-tb.svg) |
| Direction: left to right | Drawn, less something | Drawn top to bottom: boxes of different heights are only placed that way yet | [source](../corpus/requirement/requirement-direction-lr.mmd) | [picture](../corpus/drawn/requirement-direction-lr.svg) |
| Direction: bottom to top | Drawn, less something | Drawn top to bottom: boxes of different heights are only placed that way yet | [source](../corpus/requirement/requirement-direction-bt.mmd) | [picture](../corpus/drawn/requirement-direction-bt.svg) |
| A class made with classDef and given to several with class | Drawn |  | [source](../corpus/requirement/requirement-classdef.mmd) | [picture](../corpus/drawn/requirement-classdef.svg) |
| A class given with ::: where a thing is declared | Drawn |  | [source](../corpus/requirement/requirement-class-inline.mmd) | [picture](../corpus/drawn/requirement-class-inline.svg) |
| A class given with ::: to a name alone | Drawn |  | [source](../corpus/requirement/requirement-class-shorthand.mmd) | [picture](../corpus/drawn/requirement-class-shorthand.svg) |
| Several classes given at once | Drawn, less something | A box is of one kind: of several classes, the first is the one it is | [source](../corpus/requirement/requirement-class-several.mmd) | [picture](../corpus/drawn/requirement-class-several.svg) |
| A default class for every requirement | Drawn, less something | The default class is read past: the look is the design's | [source](../corpus/requirement/requirement-class-default.mmd) | [picture](../corpus/drawn/requirement-class-default.svg) |
| A requirement styled on its own | Drawn, less something | Its outline is heavy and red as written, and its fill a wash of that red, in the design's own red | [source](../corpus/requirement/requirement-style.mmd) | [picture](../corpus/drawn/requirement-style.svg) |
| Several styled in one line, one named in quotes | Drawn, less something | Their outlines are broken and red as written, in the design's own red | [source](../corpus/requirement/requirement-style-several.mmd) | [picture](../corpus/drawn/requirement-style-several.svg) |
| A title in front matter | Drawn |  | [source](../corpus/requirement/requirement-frontmatter.mmd) | [picture](../corpus/drawn/requirement-frontmatter.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/requirement/requirement-accessibility.mmd) | [picture](../corpus/drawn/requirement-accessibility.svg) |
| A description over several lines | Drawn |  | [source](../corpus/requirement/requirement-accessibility-block.mmd) | [picture](../corpus/drawn/requirement-accessibility-block.svg) |
| Comments: on lines of their own, and after the { that opens a requirement | Drawn |  | [source](../corpus/requirement/requirement-comments.mmd) | [picture](../corpus/drawn/requirement-comments.svg) |
| A directive for Mermaid's own settings | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/requirement/requirement-directive.mmd) | [picture](../corpus/drawn/requirement-directive.svg) |
| Blank lines between and inside declarations | Drawn |  | [source](../corpus/requirement/requirement-blank-lines.mmd) | [picture](../corpus/drawn/requirement-blank-lines.svg) |
| A whole diagram: requirements of three kinds, two elements, and how they bear on each other | Drawn |  | [source](../corpus/requirement/requirement-whole.mmd) | [picture](../corpus/drawn/requirement-whole.svg) |

## C4 diagrams, feature by feature

A person, a system, a container or a component is a box that says what it is and a sentence of what it does;
a boundary is a group. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A system in its context: a person, a system and one that is someone else's | Drawn |  | [source](../corpus/c4/c4-context.mmd) | [picture](../corpus/drawn/c4-context.svg) |
| People: one of the firm and one outside it | Drawn |  | [source](../corpus/c4/c4-people.mmd) | [picture](../corpus/drawn/c4-people.svg) |
| Systems: a system, one that is a database and one that is a queue | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-systems.mmd) | [picture](../corpus/drawn/c4-systems.svg) |
| Systems that are someone else's, a database and a queue among them | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-systems-external.mmd) | [picture](../corpus/drawn/c4-systems-external.svg) |
| Containers, with what each is made in and what it does | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-containers.mmd) | [picture](../corpus/drawn/c4-containers.svg) |
| Containers that are someone else's | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-containers-external.mmd) | [picture](../corpus/drawn/c4-containers-external.svg) |
| Components, with what each is made in and what it does | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-components.mmd) | [picture](../corpus/drawn/c4-components.svg) |
| Components that are someone else's | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-components-external.mmd) | [picture](../corpus/drawn/c4-components-external.svg) |
| A boundary round some of the elements | Drawn |  | [source](../corpus/c4/c4-boundary.mmd) | [picture](../corpus/drawn/c4-boundary.svg) |
| A boundary that says what kind of boundary it is | Drawn |  | [source](../corpus/c4/c4-boundary-type.mmd) | [picture](../corpus/drawn/c4-boundary-type.svg) |
| An enterprise's boundary with a system's boundary inside it | Drawn, less something | Mermaid writes [ENTERPRISE] and [SYSTEM] under the names of these boundaries; a type that was not written is not added | [source](../corpus/c4/c4-boundary-enterprise.mmd) | [picture](../corpus/drawn/c4-boundary-enterprise.svg) |
| A container's boundary | Drawn, less something | Mermaid writes [CONTAINER] under the name of this boundary; a type that was not written is not added | [source](../corpus/c4/c4-boundary-container.mmd) | [picture](../corpus/drawn/c4-boundary-container.svg) |
| Boundaries three deep | Drawn, less something | Mermaid writes [ENTERPRISE], [SYSTEM] and [CONTAINER] under the names of these boundaries; a type that was not written is not added | [source](../corpus/c4/c4-boundary-nested.mmd) | [picture](../corpus/drawn/c4-boundary-nested.svg) |
| A boundary whose { is on the line below it | Drawn |  | [source](../corpus/c4/c4-boundary-brace-below.mmd) | [picture](../corpus/drawn/c4-boundary-brace-below.svg) |
| A deployment: nodes inside a node, and what runs on each | Drawn |  | [source](../corpus/c4/c4-deployment.mmd) | [picture](../corpus/drawn/c4-deployment.svg) |
| Nodes written as Node, Node_L and Node_R | Drawn |  | [source](../corpus/c4/c4-deployment-nodes.mmd) | [picture](../corpus/drawn/c4-deployment-nodes.svg) |
| A node that is described as well as named | Drawn, less something | What a node is described as is not drawn: a group has a name and nothing more | [source](../corpus/c4/c4-deployment-described.mmd) | [picture](../corpus/drawn/c4-deployment-described.svg) |
| A relation | Drawn |  | [source](../corpus/c4/c4-rel.mmd) | [picture](../corpus/drawn/c4-rel.svg) |
| A relation that says how it is made, and one that is described | Drawn |  | [source](../corpus/c4/c4-rel-technology.mmd) | [picture](../corpus/drawn/c4-rel-technology.svg) |
| A relation that runs both ways | Drawn |  | [source](../corpus/c4/c4-rel-both-ways.mmd) | [picture](../corpus/drawn/c4-rel-both-ways.svg) |
| A relation that runs back, from the second to the first | Drawn |  | [source](../corpus/c4/c4-rel-back.mmd) | [picture](../corpus/drawn/c4-rel-back.svg) |
| Relations that say which way Mermaid should draw them | Drawn, less something | Up, down, left and right are read past: where a box goes is Merlive's to say | [source](../corpus/c4/c4-rel-directions.mmd) | [picture](../corpus/drawn/c4-rel-directions.svg) |
| A dynamic diagram: what happens, in order | Drawn |  | [source](../corpus/c4/c4-dynamic.mmd) | [picture](../corpus/drawn/c4-dynamic.svg) |
| Relations given an index | Drawn |  | [source](../corpus/c4/c4-dynamic-index.mmd) | [picture](../corpus/drawn/c4-dynamic-index.svg) |
| Arguments given by name | Drawn |  | [source](../corpus/c4/c4-named-arguments.mmd) | [picture](../corpus/drawn/c4-named-arguments.svg) |
| Tags, links and sprites | Drawn, less something | A link is not followed: a page runs nothing of an author's. Tags and sprites are read past, as Mermaid reads past them | [source](../corpus/c4/c4-tags-links-sprites.mmd) | [picture](../corpus/drawn/c4-tags-links-sprites.svg) |
| Arguments left empty | Drawn |  | [source](../corpus/c4/c4-empty-arguments.mmd) | [picture](../corpus/drawn/c4-empty-arguments.svg) |
| An element given colours of its own | Drawn, less something | It is filled with the colour written, in the design's own colour of that hue; the colours of its words and its edge are the design's | [source](../corpus/c4/c4-update-element-style.mmd) | [picture](../corpus/drawn/c4-update-element-style.svg) |
| An element given colours by name | Drawn, less something | A colour given by name is not read: only one written as #rrggbb is | [source](../corpus/c4/c4-update-element-style-named.mmd) | [picture](../corpus/drawn/c4-update-element-style-named.svg) |
| A relation given colours of its own, and its words moved | Drawn, less something | A link's colour is the design's; where its words sit is Merlive's to place | [source](../corpus/c4/c4-update-rel-style.mmd) | [picture](../corpus/drawn/c4-update-rel-style.svg) |
| A relation whose words are moved | Drawn |  | [source](../corpus/c4/c4-update-rel-offset.mmd) | [picture](../corpus/drawn/c4-update-rel-offset.svg) |
| How many elements and boundaries Mermaid should put in a row | Drawn |  | [source](../corpus/c4/c4-update-layout-config.mmd) | [picture](../corpus/drawn/c4-update-layout-config.svg) |
| A title | Drawn |  | [source](../corpus/c4/c4-title.mmd) | [picture](../corpus/drawn/c4-title.svg) |
| Front matter with a title | Drawn |  | [source](../corpus/c4/c4-frontmatter.mmd) | [picture](../corpus/drawn/c4-frontmatter.svg) |
| accTitle and accDescr | Drawn |  | [source](../corpus/c4/c4-accessibility.mmd) | [picture](../corpus/drawn/c4-accessibility.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/c4/c4-comments.mmd) | [picture](../corpus/drawn/c4-comments.svg) |
| Commas, brackets and %% inside quotes | Drawn |  | [source](../corpus/c4/c4-quotes.mmd) | [picture](../corpus/drawn/c4-quotes.svg) |
| A line break in a label and in a description | Drawn |  | [source](../corpus/c4/c4-line-breaks.mmd) | [picture](../corpus/drawn/c4-line-breaks.svg) |
| Words in quotes that run on down the lines | Drawn |  | [source](../corpus/c4/c4-across-lines.mmd) | [picture](../corpus/drawn/c4-across-lines.svg) |
| An element declared twice | Drawn |  | [source](../corpus/c4/c4-declared-twice.mmd) | [picture](../corpus/drawn/c4-declared-twice.svg) |
| A whole diagram: people, a boundary of containers, a database, a queue and a system outside | Drawn, less something | A queue is drawn as a pill: there is no cylinder on its side yet | [source](../corpus/c4/c4-whole.mmd) | [picture](../corpus/drawn/c4-whole.svg) |

## Architecture diagrams, feature by feature

A service is a box with its icon, a group is a group, and the sides an edge leaves by say which way the
diagram runs. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| Services, each with an icon and a title, and an edge between them | Drawn |  | [source](../corpus/architecture/architecture-service.mmd) | [picture](../corpus/drawn/architecture-service.svg) |
| The icons Mermaid is born with: cloud, database, disk, internet, server | Drawn, less something | A disk is drawn with the database's drawing: Merlive has no drawing of a disk of its own yet | [source](../corpus/architecture/architecture-icons-built-in.mmd) | [picture](../corpus/drawn/architecture-icons-built-in.svg) |
| An icon from a pack by its name (logos:aws-lambda) | Drawn, less something | An icon from a pack is somebody's mark, which Merlive neither fetches nor draws: the words are kept, and it is said | [source](../corpus/architecture/architecture-icon-pack.mmd) | [picture](../corpus/drawn/architecture-icon-pack.svg) |
| A service with no icon | Drawn |  | [source](../corpus/architecture/architecture-service-no-icon.mmd) | [picture](../corpus/drawn/architecture-service-no-icon.svg) |
| A service with no title | Drawn, less something | A box says something: a service with no title takes its id for its words, where Mermaid draws the icon alone | [source](../corpus/architecture/architecture-service-no-title.mmd) | [picture](../corpus/drawn/architecture-service-no-title.svg) |
| A title in quotes, with what a bare title may not hold | Drawn |  | [source](../corpus/architecture/architecture-title-quoted.mmd) | [picture](../corpus/drawn/architecture-title-quoted.svg) |
| Ids with a hyphen and an underscore | Drawn |  | [source](../corpus/architecture/architecture-id-hyphen.mmd) | [picture](../corpus/drawn/architecture-id-hyphen.svg) |
| A group, the services in it, and one outside it | Drawn, less something | A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-group.mmd) | [picture](../corpus/drawn/architecture-group.svg) |
| A group inside a group | Drawn, less something | A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-group-nested.mmd) | [picture](../corpus/drawn/architecture-group-nested.svg) |
| A group declared after the services said to be in it | Drawn, less something | A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-group-later.mmd) | [picture](../corpus/drawn/architecture-group-later.svg) |
| A group with no icon | Drawn |  | [source](../corpus/architecture/architecture-group-no-icon.mmd) | [picture](../corpus/drawn/architecture-group-no-icon.svg) |
| Edges that leave by every side: right to left, left to right, bottom to top | Drawn |  | [source](../corpus/architecture/architecture-edge-sides.mmd) | [picture](../corpus/drawn/architecture-edge-sides.svg) |
| An edge that leaves by the top and meets a side | Drawn |  | [source](../corpus/architecture/architecture-edge-right-angle.mmd) | [picture](../corpus/drawn/architecture-edge-right-angle.svg) |
| Arrowheads: into the second, into the first, into both | Drawn |  | [source](../corpus/architecture/architecture-edge-arrows.mmd) | [picture](../corpus/drawn/architecture-edge-arrows.svg) |
| Words on an edge | Drawn |  | [source](../corpus/architecture/architecture-edge-label.mmd) | [picture](../corpus/drawn/architecture-edge-label.svg) |
| Words on an edge with arrowheads | Drawn |  | [source](../corpus/architecture/architecture-edge-label-arrows.mmd) | [picture](../corpus/drawn/architecture-edge-label-arrows.svg) |
| Edges written with no spaces | Drawn |  | [source](../corpus/architecture/architecture-edge-no-spaces.mmd) | [picture](../corpus/drawn/architecture-edge-no-spaces.svg) |
| An edge out of a group and into a group ({group}) | Drawn, less something | A link out of a group is drawn from the service its author named, not from the frame: a line ends at a box. A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-edge-group.mmd) | [picture](../corpus/drawn/architecture-edge-group.svg) |
| An edge from a service to itself | Drawn |  | [source](../corpus/architecture/architecture-edge-self.mmd) | [picture](../corpus/drawn/architecture-edge-self.svg) |
| A junction: where edges meet and part | Drawn, less something | A junction is drawn as a round box with no words, the size of every other box, not as the point where lines meet | [source](../corpus/architecture/architecture-junction.mmd) | [picture](../corpus/drawn/architecture-junction.svg) |
| A junction in a group | Drawn, less something | A junction is drawn as a round box with no words, the size of every other box, not as the point where lines meet. A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-junction-group.mmd) | [picture](../corpus/drawn/architecture-junction-group.svg) |
| Services lined up in a column (align) | Drawn, less something | Lining services up in a row or a column is read past: where a box goes is by rule. A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-align.mmd) | [picture](../corpus/drawn/architecture-align.svg) |
| A title written in the diagram | Drawn |  | [source](../corpus/architecture/architecture-title.mmd) | [picture](../corpus/drawn/architecture-title.svg) |
| Front matter: a title, and Mermaid's own settings | Drawn |  | [source](../corpus/architecture/architecture-frontmatter.mmd) | [picture](../corpus/drawn/architecture-frontmatter.svg) |
| accTitle and accDescr, on a line and over several | Drawn |  | [source](../corpus/architecture/architecture-accessibility.mmd) | [picture](../corpus/drawn/architecture-accessibility.svg) |
| Comments, on a line of their own and after a line | Drawn |  | [source](../corpus/architecture/architecture-comments.mmd) | [picture](../corpus/drawn/architecture-comments.svg) |
| A diagram whose edges run top to bottom | Drawn |  | [source](../corpus/architecture/architecture-direction-down.mmd) | [picture](../corpus/drawn/architecture-direction-down.svg) |
| A whole diagram: groups in groups, services, a junction, edges with arrowheads and words | Drawn, less something | A junction is drawn as a round box with no words, the size of every other box, not as the point where lines meet. A link out of a group is drawn from the service its author named. A group's icon is not drawn: a frame is named by its title | [source](../corpus/architecture/architecture-whole.mmd) | [picture](../corpus/drawn/architecture-whole.svg) |

## Block diagrams, feature by feature

Blocks joined by links are read as a flowchart is and placed by rule. One whose meaning is in its grid is
placed on that grid, each block in the cell its author gave it.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A block diagram that is a flow: blocks in a row, each joined to the next | Drawn |  | [source](../corpus/block/block-flow.mmd) | [picture](../corpus/drawn/block-flow.svg) |
| The older name of the kind: block-beta | Drawn |  | [source](../corpus/block/block-beta.mmd) | [picture](../corpus/drawn/block-beta.svg) |
| columns 1: blocks one under the other, joined | Drawn |  | [source](../corpus/block/block-flow-down.mmd) | [picture](../corpus/drawn/block-flow-down.svg) |
| No columns given: one row | Drawn |  | [source](../corpus/block/block-flow-no-columns.mmd) | [picture](../corpus/drawn/block-flow-no-columns.svg) |
| columns auto: one row, each column as wide as it needs | Drawn |  | [source](../corpus/block/block-columns-auto.mmd) | [picture](../corpus/drawn/block-columns-auto.svg) |
| Blocks that wrap to a second row, joined in the order written | Drawn |  | [source](../corpus/block/block-columns-wrap.mmd) | [picture](../corpus/drawn/block-columns-wrap.svg) |
| Blocks with no words: each is called by its id | Drawn |  | [source](../corpus/block/block-ids-only.mmd) | [picture](../corpus/drawn/block-ids-only.svg) |
| Words broken with <br/>, and an entity code | Drawn |  | [source](../corpus/block/block-line-break.mmd) | [picture](../corpus/drawn/block-line-break.svg) |
| A link with no arrowhead | Drawn |  | [source](../corpus/block/block-link-plain.mmd) | [picture](../corpus/drawn/block-link-plain.svg) |
| Words written into a link | Drawn |  | [source](../corpus/block/block-link-words.mmd) | [picture](../corpus/drawn/block-link-words.svg) |
| Links thick and dotted, ending in a circle, a cross, an arrow at both ends, and dotted with words | Drawn |  | [source](../corpus/block/block-link-kinds.mmd) | [picture](../corpus/drawn/block-link-kinds.svg) |
| Blocks given their shape and words in the link that joins them | Drawn |  | [source](../corpus/block/block-link-inline-labels.mmd) | [picture](../corpus/drawn/block-link-inline-labels.svg) |
| A link to a block not written anywhere else, which makes it | Drawn |  | [source](../corpus/block/block-link-new-block.mmd) | [picture](../corpus/drawn/block-link-new-block.svg) |
| A space between two blocks, to make room for the link that joins them (how Mermaid says to draw a link) | Drawn |  | [source](../corpus/block/block-link-space.mmd) | [picture](../corpus/drawn/block-link-space.svg) |
| A space between two blocks one under the other, for the link that joins them | Drawn |  | [source](../corpus/block/block-space-down.mmd) | [picture](../corpus/drawn/block-space-down.svg) |
| space:3 between two joined blocks: more room for the same link | Drawn |  | [source](../corpus/block/block-space-wide.mmd) | [picture](../corpus/drawn/block-space-wide.svg) |
| Every shape of a block, joined in a chain | Drawn, less something | A block with round corners is a box, and a circle is a pill, as in a flowchart | [source](../corpus/block/block-shapes.mmd) | [picture](../corpus/drawn/block-shapes.svg) |
| A block that holds others: a group | Drawn |  | [source](../corpus/block/block-nested.mmd) | [picture](../corpus/drawn/block-nested.svg) |
| A block that holds others, with a name and columns of its own | Drawn, less something | Merlive draws the name its author gave the block; Mermaid 11 draws none | [source](../corpus/block/block-nested-label.mmd) | [picture](../corpus/drawn/block-nested-label.svg) |
| A block that holds others and has no id | Drawn |  | [source](../corpus/block/block-nested-anonymous.mmd) | [picture](../corpus/drawn/block-nested-anonymous.svg) |
| Blocks that hold others, inside one that holds them | Drawn |  | [source](../corpus/block/block-nested-deep.mmd) | [picture](../corpus/drawn/block-nested-deep.svg) |
| Links to and from a block that holds others: joined to what is inside it | Drawn |  | [source](../corpus/block/block-nested-link.mmd) | [picture](../corpus/drawn/block-nested-link.svg) |
| A block styled on its own: a heavy outline, a broken one | Drawn, less something | Each is filled with its colour, in the design's own colour of that hue; an edge of another colour than its fill is drawn in the fill's | [source](../corpus/block/block-style.mmd) | [picture](../corpus/drawn/block-style.svg) |
| A class, and the blocks that are of it | Drawn, less something | The class is filled with its colour, in the design's own colour of that hue | [source](../corpus/block/block-classdef.mmd) | [picture](../corpus/drawn/block-classdef.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/block/block-comments.mmd) | [picture](../corpus/drawn/block-comments.svg) |
| Front matter with a title | Drawn |  | [source](../corpus/block/block-frontmatter.mmd) | [picture](../corpus/drawn/block-frontmatter.svg) |
| A grid of blocks with no links: what it says is where each block is | Drawn |  | [source](../corpus/block/block-grid.mmd) | [picture](../corpus/drawn/block-grid.svg) |
| Every shape of a block, laid out in a grid with no links | Drawn |  | [source](../corpus/block/block-shapes-grid.mmd) | [picture](../corpus/drawn/block-shapes-grid.svg) |
| One block on its own | Drawn |  | [source](../corpus/block/block-alone.mmd) | [picture](../corpus/drawn/block-alone.svg) |
| Blocks that span columns: a wide block over two narrower ones | Drawn |  | [source](../corpus/block/block-span.mmd) | [picture](../corpus/drawn/block-span.svg) |
| A block that spans the grid under two others, a space between them and an empty row | Drawn |  | [source](../corpus/block/block-space.mmd) | [picture](../corpus/drawn/block-space.svg) |
| Spaces that put a block under the one it belongs to | Drawn |  | [source](../corpus/block/block-space-offset.mmd) | [picture](../corpus/drawn/block-space-offset.svg) |
| Block arrows between cells: arrows drawn as blocks, placed by the grid | Drawn |  | [source](../corpus/block/block-arrows.mmd) | [picture](../corpus/drawn/block-arrows.svg) |
| A block arrow pointing every way it can | Drawn, less something | An arrow that points across and down is drawn pointing both ways across: Merlive draws an arrow along one line | [source](../corpus/block/block-arrow-directions.mmd) | [picture](../corpus/drawn/block-arrow-directions.svg) |
| Blocks that hold grids of their own, and span columns of the grid they are in | Drawn |  | [source](../corpus/block/block-nested-columns.mmd) | [picture](../corpus/drawn/block-nested-columns.svg) |
| A grid with a block arrow, a block that holds others, a space and links (from Mermaid's own guide) | Drawn |  | [source](../corpus/block/block-mixed.mmd) | [picture](../corpus/drawn/block-mixed.svg) |

## Mindmaps, feature by feature

A mindmap is a tree: each line a box under the nearest line above that is further left, grown from its root
to the right. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A mindmap: a root, and what is under it by how far in each line is written | Drawn |  | [source](../corpus/mindmap/mindmap-tree.mmd) | [picture](../corpus/drawn/mindmap-tree.svg) |
| A root with nothing under it | Drawn |  | [source](../corpus/mindmap/mindmap-root-alone.mmd) | [picture](../corpus/drawn/mindmap-root-alone.svg) |
| Five steps in from the root | Drawn |  | [source](../corpus/mindmap/mindmap-deep.mmd) | [picture](../corpus/drawn/mindmap-deep.svg) |
| Lines written unevenly: each is under the nearest line above it that is further left | Drawn |  | [source](../corpus/mindmap/mindmap-uneven.mmd) | [picture](../corpus/drawn/mindmap-uneven.svg) |
| Lines set in with tabs | Drawn |  | [source](../corpus/mindmap/mindmap-tabs.mmd) | [picture](../corpus/drawn/mindmap-tabs.svg) |
| A root written at the margin | Drawn |  | [source](../corpus/mindmap/mindmap-margin.mmd) | [picture](../corpus/drawn/mindmap-margin.svg) |
| Empty lines between the lines of a tree | Drawn |  | [source](../corpus/mindmap/mindmap-blank-lines.mmd) | [picture](../corpus/drawn/mindmap-blank-lines.svg) |
| The first word with a semicolon after it | Drawn |  | [source](../corpus/mindmap/mindmap-semicolon.mmd) | [picture](../corpus/drawn/mindmap-semicolon.svg) |
| A line of bare words: the shape Mermaid gives when none is written | Drawn |  | [source](../corpus/mindmap/mindmap-shape-default.mmd) | [picture](../corpus/drawn/mindmap-shape-default.svg) |
| A square | Drawn |  | [source](../corpus/mindmap/mindmap-shape-square.mmd) | [picture](../corpus/drawn/mindmap-shape-square.svg) |
| A rounded square | Drawn |  | [source](../corpus/mindmap/mindmap-shape-rounded.mmd) | [picture](../corpus/drawn/mindmap-shape-rounded.svg) |
| A circle | Drawn |  | [source](../corpus/mindmap/mindmap-shape-circle.mmd) | [picture](../corpus/drawn/mindmap-shape-circle.svg) |
| A hexagon | Drawn |  | [source](../corpus/mindmap/mindmap-shape-hexagon.mmd) | [picture](../corpus/drawn/mindmap-shape-hexagon.svg) |
| A bang | Drawn, less something | A bang is a box with a heavy outline, not a burst | [source](../corpus/mindmap/mindmap-shape-bang.mmd) | [picture](../corpus/drawn/mindmap-shape-bang.svg) |
| A cloud | Drawn, less something | A cloud is a round-ended box with a dashed outline, not a cloud | [source](../corpus/mindmap/mindmap-shape-cloud.mmd) | [picture](../corpus/drawn/mindmap-shape-cloud.svg) |
| A circle, a hexagon, a square and bare words in one tree | Drawn |  | [source](../corpus/mindmap/mindmap-shapes.mmd) | [picture](../corpus/drawn/mindmap-shapes.svg) |
| A square and a rounded square in one tree | Drawn, less something | A square and a rounded square are the same box: its corners are the design's | [source](../corpus/mindmap/mindmap-shapes-alike.mmd) | [picture](../corpus/drawn/mindmap-shapes-alike.svg) |
| An id apart from its words | Drawn |  | [source](../corpus/mindmap/mindmap-id-label.mmd) | [picture](../corpus/drawn/mindmap-id-label.svg) |
| An id of several words | Drawn |  | [source](../corpus/mindmap/mindmap-id-words.mmd) | [picture](../corpus/drawn/mindmap-id-words.svg) |
| A shape with no id before it | Drawn |  | [source](../corpus/mindmap/mindmap-no-id.mmd) | [picture](../corpus/drawn/mindmap-no-id.svg) |
| Bare words with a bracket in them: what is before it is the id | Drawn |  | [source](../corpus/mindmap/mindmap-bare-brackets.mmd) | [picture](../corpus/drawn/mindmap-bare-brackets.svg) |
| Words in quotes, with a colon and brackets in them | Drawn |  | [source](../corpus/mindmap/mindmap-quoted.mmd) | [picture](../corpus/drawn/mindmap-quoted.svg) |
| Two lines of the same words: two boxes | Drawn |  | [source](../corpus/mindmap/mindmap-same-words.mmd) | [picture](../corpus/drawn/mindmap-same-words.svg) |
| An icon, on the line under its box | Drawn |  | [source](../corpus/mindmap/mindmap-icon.mmd) | [picture](../corpus/drawn/mindmap-icon.svg) |
| An icon Merlive has no drawing for | Drawn, less something | The icon is left out | [source](../corpus/mindmap/mindmap-icon-unknown.mmd) | [picture](../corpus/drawn/mindmap-icon-unknown.svg) |
| A class, on the line under its box | Drawn, less something | A class has no colour of its own: Mermaid takes one from the page it is on | [source](../corpus/mindmap/mindmap-class.mmd) | [picture](../corpus/drawn/mindmap-class.svg) |
| A class for the root | Drawn |  | [source](../corpus/mindmap/mindmap-class-root.mmd) | [picture](../corpus/drawn/mindmap-class-root.svg) |
| A Markdown string: bold and italic | Drawn |  | [source](../corpus/mindmap/mindmap-markdown.mmd) | [picture](../corpus/drawn/mindmap-markdown.svg) |
| A Markdown string of several lines | Drawn |  | [source](../corpus/mindmap/mindmap-markdown-lines.mmd) | [picture](../corpus/drawn/mindmap-markdown-lines.svg) |
| Bold and italic with no Markdown string round them | Drawn |  | [source](../corpus/mindmap/mindmap-markdown-plain.mmd) | [picture](../corpus/drawn/mindmap-markdown-plain.svg) |
| A line broken with <br/> | Drawn |  | [source](../corpus/mindmap/mindmap-line-break.mmd) | [picture](../corpus/drawn/mindmap-line-break.svg) |
| Words long enough to be wrapped | Drawn |  | [source](../corpus/mindmap/mindmap-long-words.mmd) | [picture](../corpus/drawn/mindmap-long-words.svg) |
| Words in other scripts, and an emoji | Drawn |  | [source](../corpus/mindmap/mindmap-unicode.mmd) | [picture](../corpus/drawn/mindmap-unicode.svg) |
| A comment on a line of its own, and %% after words, which Mermaid keeps as words | Drawn |  | [source](../corpus/mindmap/mindmap-comments.mmd) | [picture](../corpus/drawn/mindmap-comments.svg) |
| A title in front matter | Drawn |  | [source](../corpus/mindmap/mindmap-frontmatter.mmd) | [picture](../corpus/drawn/mindmap-frontmatter.svg) |
| Merlive's own lines: a note on a box, by its id | Drawn |  | [source](../corpus/mindmap/mindmap-notes.mmd) | [picture](../corpus/drawn/mindmap-notes.svg) |
| A tree of many leaves | Drawn |  | [source](../corpus/mindmap/mindmap-bushy.mmd) | [picture](../corpus/drawn/mindmap-bushy.svg) |
| A whole mindmap: shapes, icons, a class, bold and broken lines | Drawn |  | [source](../corpus/mindmap/mindmap-whole.mmd) | [picture](../corpus/drawn/mindmap-whole.svg) |

## Kanban boards, feature by feature

A column is a group and a card a box that lists its ticket, who has it and its priority, on the grid the
board is. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| A kanban board: columns side by side, and the cards of each down it | Drawn |  | [source](../corpus/kanban/kanban-columns.mmd) | [picture](../corpus/drawn/kanban-columns.svg) |
| Columns and cards written with no brackets: each is called by what was written | Drawn |  | [source](../corpus/kanban/kanban-bare.mmd) | [picture](../corpus/drawn/kanban-bare.svg) |
| Ids with a hyphen or a dot in them, a card called by its id, and one id written for two cards | Drawn |  | [source](../corpus/kanban/kanban-ids.mmd) | [picture](../corpus/drawn/kanban-ids.svg) |
| A column with no cards in it yet | Drawn |  | [source](../corpus/kanban/kanban-empty-column.mmd) | [picture](../corpus/drawn/kanban-empty-column.svg) |
| Who has a card: assigned | Drawn |  | [source](../corpus/kanban/kanban-assigned.mmd) | [picture](../corpus/drawn/kanban-assigned.svg) |
| The ticket a card is for, bare, in quotes or a number | Drawn |  | [source](../corpus/kanban/kanban-ticket.mmd) | [picture](../corpus/drawn/kanban-ticket.svg) |
| How pressing a card is: the four priorities Mermaid draws | Drawn, less something | A priority is said in words on its card, where Mermaid draws a colour down the side of the card | [source](../corpus/kanban/kanban-priority.mmd) | [picture](../corpus/drawn/kanban-priority.svg) |
| A priority Mermaid has no mark for | Drawn, less something | Kept as written and said, where Mermaid draws nothing for it | [source](../corpus/kanban/kanban-priority-other.mmd) | [picture](../corpus/drawn/kanban-priority-other.svg) |
| A ticket, who has it and how pressing it is, all on one card, in any order | Drawn, less something | A priority is said in words on its card, where Mermaid draws a colour down the side of the card | [source](../corpus/kanban/kanban-metadata.mmd) | [picture](../corpus/drawn/kanban-metadata.svg) |
| What is set on a card, written over several lines | Drawn, less something | A priority is said in words on its card, where Mermaid draws a colour down the side of the card | [source](../corpus/kanban/kanban-metadata-lines.mmd) | [picture](../corpus/drawn/kanban-metadata-lines.svg) |
| Something set on a card that a board has no place for | Drawn, less something | Passed over and said, where Mermaid passes over it and says nothing | [source](../corpus/kanban/kanban-metadata-other.mmd) | [picture](../corpus/drawn/kanban-metadata-other.svg) |
| A card's words set as its label | Drawn |  | [source](../corpus/kanban/kanban-label.mmd) | [picture](../corpus/drawn/kanban-label.svg) |
| Something set on a column, which neither Mermaid nor Merlive draws | Drawn, less something | Passed over and said, where Mermaid passes over it and says nothing | [source](../corpus/kanban/kanban-column-metadata.mmd) | [picture](../corpus/drawn/kanban-column-metadata.svg) |
| Tickets with a place they link to, set in front matter | Drawn, less something | A ticket is listed on its card and is not a link out: a picture of Merlive's goes nowhere | [source](../corpus/kanban/kanban-ticket-base-url.mmd) | [picture](../corpus/drawn/kanban-ticket-base-url.svg) |
| Front matter with a title | Drawn |  | [source](../corpus/kanban/kanban-frontmatter.mmd) | [picture](../corpus/drawn/kanban-frontmatter.svg) |
| Words in quotes, with a comma, a bracket and a parenthesis in them | Drawn |  | [source](../corpus/kanban/kanban-quoted.mmd) | [picture](../corpus/drawn/kanban-quoted.svg) |
| A Markdown string: bold and italic on a card | Drawn |  | [source](../corpus/kanban/kanban-markdown.mmd) | [picture](../corpus/drawn/kanban-markdown.svg) |
| A line its author broke, with <br/> and by going on to the next line inside quotes | Drawn |  | [source](../corpus/kanban/kanban-line-break.mmd) | [picture](../corpus/drawn/kanban-line-break.svg) |
| Entity codes in the words of a column and of a card | Drawn |  | [source](../corpus/kanban/kanban-entity.mmd) | [picture](../corpus/drawn/kanban-entity.svg) |
| Every way Mermaid lets the words of a card be written, each drawn as a card | Drawn |  | [source](../corpus/kanban/kanban-shapes.mmd) | [picture](../corpus/drawn/kanban-shapes.svg) |
| Comments, on lines of their own and after a card | Drawn |  | [source](../corpus/kanban/kanban-comments.mmd) | [picture](../corpus/drawn/kanban-comments.svg) |
| Cards written at different depths, and with a tab: anything further in than a column is its card | Drawn |  | [source](../corpus/kanban/kanban-deep.mmd) | [picture](../corpus/drawn/kanban-deep.svg) |
| Long words on a card and in the name of a column | Drawn |  | [source](../corpus/kanban/kanban-long-words.mmd) | [picture](../corpus/drawn/kanban-long-words.svg) |
| Merlive's own lines on a board: a note on a card | Drawn |  | [source](../corpus/kanban/kanban-note.mmd) | [picture](../corpus/drawn/kanban-note.svg) |
| A whole board: five columns, one of them empty, cards with and without tickets, people and priorities, a title and a place tickets link to | Drawn, less something | A priority is said in words on its card, where Mermaid draws a colour down the side; a ticket is not a link out | [source](../corpus/kanban/kanban-whole.mmd) | [picture](../corpus/drawn/kanban-whole.svg) |

## Timelines, feature by feature

A period is a box with its events under it and a section a group round its periods, on the grid a timeline
is. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| Periods, each with one event: a period is a box, its event a box under it | Drawn |  | [source](../corpus/timeline/timeline-periods.mmd) | [picture](../corpus/drawn/timeline-periods.svg) |
| A title, drawn above the picture | Drawn |  | [source](../corpus/timeline/timeline-title.mmd) | [picture](../corpus/drawn/timeline-title.svg) |
| Several events of one period on its line | Drawn |  | [source](../corpus/timeline/timeline-events-same-line.mmd) | [picture](../corpus/drawn/timeline-events-same-line.svg) |
| Events on the lines after their period, each line a colon and what happened | Drawn |  | [source](../corpus/timeline/timeline-events-following-lines.mmd) | [picture](../corpus/drawn/timeline-events-following-lines.svg) |
| Periods in which nothing is said to have happened | Drawn |  | [source](../corpus/timeline/timeline-period-alone.mmd) | [picture](../corpus/drawn/timeline-period-alone.svg) |
| No space before a colon | Drawn |  | [source](../corpus/timeline/timeline-no-spaces.mmd) | [picture](../corpus/drawn/timeline-no-spaces.svg) |
| A colon with no space after it is part of the words (09:30) | Drawn |  | [source](../corpus/timeline/timeline-colon-in-event.mmd) | [picture](../corpus/drawn/timeline-colon-in-event.svg) |
| The code for a colon in a period (#colon;) | Drawn |  | [source](../corpus/timeline/timeline-colon-code.mmd) | [picture](../corpus/drawn/timeline-colon-code.svg) |
| Periods that are words, not dates | Drawn |  | [source](../corpus/timeline/timeline-words-not-dates.mmd) | [picture](../corpus/drawn/timeline-words-not-dates.svg) |
| A line break in a period and in an event (<br>) | Drawn |  | [source](../corpus/timeline/timeline-line-break.mmd) | [picture](../corpus/drawn/timeline-line-break.svg) |
| Events too long for one line, wrapped in their box | Drawn |  | [source](../corpus/timeline/timeline-long-text.mmd) | [picture](../corpus/drawn/timeline-long-text.svg) |
| Sections: each a group round the periods after it | Drawn |  | [source](../corpus/timeline/timeline-sections.mmd) | [picture](../corpus/drawn/timeline-sections.svg) |
| Sections of one period and of several, with events of different numbers | Drawn |  | [source](../corpus/timeline/timeline-sections-uneven.mmd) | [picture](../corpus/drawn/timeline-sections-uneven.svg) |
| A section with a long name | Drawn |  | [source](../corpus/timeline/timeline-section-long-name.mmd) | [picture](../corpus/drawn/timeline-section-long-name.svg) |
| Left to right, said (timeline LR) | Drawn |  | [source](../corpus/timeline/timeline-direction-lr.mmd) | [picture](../corpus/drawn/timeline-direction-lr.svg) |
| Top to bottom (timeline TD): periods one under another, events beside each | Drawn |  | [source](../corpus/timeline/timeline-direction-td.mmd) | [picture](../corpus/drawn/timeline-direction-td.svg) |
| Top to bottom with sections, one under another | Drawn |  | [source](../corpus/timeline/timeline-direction-td-sections.mmd) | [picture](../corpus/drawn/timeline-direction-td-sections.svg) |
| A title in front matter | Drawn |  | [source](../corpus/timeline/timeline-frontmatter.mmd) | [picture](../corpus/drawn/timeline-frontmatter.svg) |
| One colour for every period (disableMulticolor), read past: the colours are the design's | Drawn |  | [source](../corpus/timeline/timeline-one-colour.mmd) | [picture](../corpus/drawn/timeline-one-colour.svg) |
| A theme and its colours in front matter, read past: the colours are the design's | Drawn |  | [source](../corpus/timeline/timeline-theme.mmd) | [picture](../corpus/drawn/timeline-theme.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/timeline/timeline-comments.mmd) | [picture](../corpus/drawn/timeline-comments.svg) |
| What the picture is called and shows, for one who cannot see it | Drawn |  | [source](../corpus/timeline/timeline-accessible.mmd) | [picture](../corpus/drawn/timeline-accessible.svg) |
| A description over several lines (accDescr { }) | Drawn |  | [source](../corpus/timeline/timeline-accessible-lines.mmd) | [picture](../corpus/drawn/timeline-accessible-lines.svg) |
| Merlive's own lines: a note for a period and for an event, and what a kind means | Drawn |  | [source](../corpus/timeline/timeline-notes.mmd) | [picture](../corpus/drawn/timeline-notes.svg) |
| Two periods of one name: each is its own | Drawn |  | [source](../corpus/timeline/timeline-same-names.mmd) | [picture](../corpus/drawn/timeline-same-names.svg) |
| Nine periods: a timeline as long as it was written | Drawn |  | [source](../corpus/timeline/timeline-many-periods.mmd) | [picture](../corpus/drawn/timeline-many-periods.svg) |
| Six events in one period | Drawn |  | [source](../corpus/timeline/timeline-many-events.mmd) | [picture](../corpus/drawn/timeline-many-events.svg) |
| A single period | Drawn |  | [source](../corpus/timeline/timeline-one-period.mmd) | [picture](../corpus/drawn/timeline-one-period.svg) |
| A whole timeline: a title, three sections, periods with none, one and two events, a line break | Drawn |  | [source](../corpus/timeline/timeline-whole.mmd) | [picture](../corpus/drawn/timeline-whole.svg) |

## Packets, feature by feature

A field is a box as wide as the bits it takes, with its bits over its name, in rows of as many bits as the
packet says. Held to the same measure.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| Fields by the bits they take, first to last | Drawn |  | [source](../corpus/packet/packet-fields.mmd) | [picture](../corpus/drawn/packet-fields.svg) |
| A packet that opens "packet", not "packet-beta" | Drawn |  | [source](../corpus/packet/packet-keyword.mmd) | [picture](../corpus/drawn/packet-keyword.svg) |
| A title on a line of its own | Drawn |  | [source](../corpus/packet/packet-title.mmd) | [picture](../corpus/drawn/packet-title.svg) |
| A title in front matter | Drawn |  | [source](../corpus/packet/packet-title-frontmatter.mmd) | [picture](../corpus/drawn/packet-title-frontmatter.svg) |
| Fields of one bit, among wider ones | Drawn |  | [source](../corpus/packet/packet-bit.mmd) | [picture](../corpus/drawn/packet-bit.svg) |
| Fields by how many bits each takes (+16), each starting where the last ended | Drawn |  | [source](../corpus/packet/packet-lengths.mmd) | [picture](../corpus/drawn/packet-lengths.svg) |
| Fields by their bits and by their length, mixed | Drawn |  | [source](../corpus/packet/packet-lengths-mixed.mmd) | [picture](../corpus/drawn/packet-lengths-mixed.svg) |
| A field that runs past the end of a row: drawn on both rows, each part with its own bits | Drawn |  | [source](../corpus/packet/packet-split.mmd) | [picture](../corpus/drawn/packet-split.svg) |
| A field of several whole rows | Drawn |  | [source](../corpus/packet/packet-split-rows.mmd) | [picture](../corpus/drawn/packet-split-rows.svg) |
| Sixteen bits to a row, said in front matter | Drawn |  | [source](../corpus/packet/packet-bits-per-row.mmd) | [picture](../corpus/drawn/packet-bits-per-row.svg) |
| Eight bits to a row, said in a directive | Drawn |  | [source](../corpus/packet/packet-bits-per-row-directive.mmd) | [picture](../corpus/drawn/packet-bits-per-row-directive.svg) |
| Sixty-four bits to a row | Drawn |  | [source](../corpus/packet/packet-bits-per-row-wide.mmd) | [picture](../corpus/drawn/packet-bits-per-row-wide.svg) |
| The bits left off the picture (showBits: false) | Drawn |  | [source](../corpus/packet/packet-show-bits.mmd) | [picture](../corpus/drawn/packet-show-bits.svg) |
| Mermaid's own sizes for a packet (bitWidth, rowHeight, padding), read past | Drawn |  | [source](../corpus/packet/packet-settings.mmd) | [picture](../corpus/drawn/packet-settings.svg) |
| Comments on lines of their own and after a field | Drawn |  | [source](../corpus/packet/packet-comments.mmd) | [picture](../corpus/drawn/packet-comments.svg) |
| A title and a description for a reader who cannot see the picture | Drawn |  | [source](../corpus/packet/packet-accessible.mmd) | [picture](../corpus/drawn/packet-accessible.svg) |
| Names in single quotes, with brackets in them, and one with no name | Drawn |  | [source](../corpus/packet/packet-names.mmd) | [picture](../corpus/drawn/packet-names.svg) |
| A last row that is not full | Drawn |  | [source](../corpus/packet/packet-short-row.mmd) | [picture](../corpus/drawn/packet-short-row.svg) |
| One field, a whole row | Drawn |  | [source](../corpus/packet/packet-one-field.mmd) | [picture](../corpus/drawn/packet-one-field.svg) |
| Spaces round the dash and the colon, or none | Drawn |  | [source](../corpus/packet/packet-spacing.mmd) | [picture](../corpus/drawn/packet-spacing.svg) |
| Merlive's own notes on fields, by the bit each starts at | Drawn |  | [source](../corpus/packet/packet-notes.mmd) | [picture](../corpus/drawn/packet-notes.svg) |
| A whole header: a title, fields from one bit to two rows, thirty-two columns | Drawn |  | [source](../corpus/packet/packet-whole.mmd) | [picture](../corpus/drawn/packet-whole.svg) |

## Sequence diagrams, feature by feature

Held to the same measure: every participant, message, note, frame and word the corpus says a sample has is read,
and every rule in [SEQUENCE.md](SEQUENCE.md) passes.

| Feature | Result | What is missing | Sample | Picture |
|---|---|---|---|---|
| Participants named by the messages they are in | Drawn |  | [source](../corpus/sequence/seq-participants-implicit.mmd) | [picture](../corpus/drawn/seq-participants-implicit.svg) |
| Participants declared, in an order of their own | Drawn |  | [source](../corpus/sequence/seq-participants-declared.mmd) | [picture](../corpus/drawn/seq-participants-declared.svg) |
| Actors: people, not systems | Drawn |  | [source](../corpus/sequence/seq-actors.mmd) | [picture](../corpus/drawn/seq-actors.svg) |
| A participant with a type: boundary, control, entity, database, collections, queue | Drawn |  | [source](../corpus/sequence/seq-participant-types.mmd) | [picture](../corpus/drawn/seq-participant-types.svg) |
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
| Half arrows | Drawn |  | [source](../corpus/sequence/seq-half-arrows.mmd) | [picture](../corpus/drawn/seq-half-arrows.svg) |
| A message to or from the middle of a line | Drawn |  | [source](../corpus/sequence/seq-central-connection.mmd) | [picture](../corpus/drawn/seq-central-connection.svg) |
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
| Timeline | Drawn | [source](../corpus/kinds/timeline.mmd) | [picture](../corpus/drawn/timeline.svg) |
| Gantt chart | Left as Mermaid | [source](../corpus/kinds/gantt.mmd) |  |
| Git graph | Left as Mermaid | [source](../corpus/kinds/gitgraph.mmd) |  |

### Boxes and links

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Class diagram | Drawn | [source](../corpus/kinds/class.mmd) | [picture](../corpus/drawn/class.svg) |
| State diagram | Drawn | [source](../corpus/kinds/state.mmd) | [picture](../corpus/drawn/state.svg) |
| Entity relationship diagram | Drawn | [source](../corpus/kinds/er.mmd) | [picture](../corpus/drawn/er.svg) |
| Requirement diagram | Drawn | [source](../corpus/kinds/requirement.mmd) | [picture](../corpus/drawn/requirement.svg) |
| C4 diagram | Drawn | [source](../corpus/kinds/c4.mmd) | [picture](../corpus/drawn/c4.svg) |
| Block diagram | Drawn | [source](../corpus/kinds/block.mmd) | [picture](../corpus/drawn/block.svg) |
| Architecture diagram | Drawn | [source](../corpus/kinds/architecture.mmd) | [picture](../corpus/drawn/architecture.svg) |
| Swimlane diagram | Left as Mermaid | [source](../corpus/kinds/swimlane.mmd) |  |
| Use case diagram | Left as Mermaid | [source](../corpus/kinds/usecase.mmd) |  |
| Agent flow | Left as Mermaid | [source](../corpus/kinds/agentflow.mmd) |  |

### Tree

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Mindmap | Drawn | [source](../corpus/kinds/mindmap.mmd) | [picture](../corpus/drawn/mindmap.svg) |
| Tree view | Left as Mermaid | [source](../corpus/kinds/treeview.mmd) |  |
| Ishikawa (fishbone) diagram | Left as Mermaid | [source](../corpus/kinds/ishikawa.mmd) |  |
| Kanban board | Drawn | [source](../corpus/kinds/kanban.mmd) | [picture](../corpus/drawn/kanban.svg) |

### Chart

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Treemap | Left as Mermaid | [source](../corpus/kinds/treemap.mmd) |  |
| Pie chart | Left as Mermaid | [source](../corpus/kinds/pie.mmd) |  |
| Quadrant chart | Left as Mermaid | [source](../corpus/kinds/quadrant.mmd) |  |
| XY chart | Left as Mermaid | [source](../corpus/kinds/xychart.mmd) |  |
| Sankey diagram | Left as Mermaid | [source](../corpus/kinds/sankey.mmd) |  |
| Radar chart | Left as Mermaid | [source](../corpus/kinds/radar.mmd) |  |
| Packet diagram | Drawn | [source](../corpus/kinds/packet.mmd) | [picture](../corpus/drawn/packet.svg) |
| Venn diagram | Left as Mermaid | [source](../corpus/kinds/venn.mmd) |  |
| Cynefin framework | Left as Mermaid | [source](../corpus/kinds/cynefin.mmd) |  |
| Wardley map | Left as Mermaid | [source](../corpus/kinds/wardley.mmd) |  |

### Grammar

| Kind | Result | Sample | Picture |
|---|---|---|---|
| Railroad (syntax) diagram | Left as Mermaid | [source](../corpus/kinds/railroad.mmd) |  |
