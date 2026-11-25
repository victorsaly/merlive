# What Merlive draws of Mermaid

Written by `npm run coverage`. Do not edit it by hand: change the code or the corpus and run it again.

The syntax pages of mermaid-js/mermaid at 6374e52 (2026-11-23): one row for every kind of diagram it documents and every feature its flowchart page sets out. The samples are our own.

## In short

- **Flowcharts:** of 69 features, 44 are drawn as written, 22 are drawn less something Merlive leaves out on purpose or does not have yet, 3 are only partly read, and 0 are refused.
- **Other kinds of diagram:** of 32, 0 are drawn and 32 are left as Mermaid and named.

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
| A link given an id | Drawn |  | [source](../corpus/flowchart/link-id.mmd) | [picture](../corpus/drawn/link-id.svg) |
| A link set to animate | Drawn, less something | Mermaid's animation is read past: movement is the design's, and starts when a reader asks | [source](../corpus/flowchart/link-animate.mmd) | [picture](../corpus/drawn/link-animate.svg) |
| Links played one step after another | Drawn, less something | The step numbers are read past; a walkthrough is written with "%% step" | [source](../corpus/flowchart/link-steps.mmd) | [picture](../corpus/drawn/link-steps.svg) |
| A link given a curve of its own | Drawn, less something | The curve is read past: lines turn at right angles by rule | [source](../corpus/flowchart/link-curve.mmd) | [picture](../corpus/drawn/link-curve.svg) |
| A group named by its title | Drawn |  | [source](../corpus/flowchart/subgraph-title.mmd) | [picture](../corpus/drawn/subgraph-title.svg) |
| A group with an id and a title | Drawn |  | [source](../corpus/flowchart/subgraph-id.mmd) | [picture](../corpus/drawn/subgraph-id.svg) |
| Links to a group and between groups | Drawn |  | [source](../corpus/flowchart/subgraph-links.mmd) | [picture](../corpus/drawn/subgraph-links.svg) |
| A group with a direction of its own | Drawn, less something | The group's own direction is read past; it runs the way the rest does | [source](../corpus/flowchart/subgraph-direction.mmd) | [picture](../corpus/drawn/subgraph-direction.svg) |
| A group inside a group | Partly read | read 1 of 2 groups; line 4: a group inside a group is drawn as part of the outer one | [source](../corpus/flowchart/subgraph-nested.mmd) | [picture](../corpus/drawn/subgraph-nested.svg) |
| A group shown collapsed | Drawn, less something | Drawn open: a picture cannot be opened and closed | [source](../corpus/flowchart/subgraph-collapsed.mmd) | [picture](../corpus/drawn/subgraph-collapsed.svg) |
| A box styled on its own | Drawn, less something | Its outline is broken, heavy and red as written, in the design's own red; its fill is the design's | [source](../corpus/flowchart/style-node.mmd) | [picture](../corpus/drawn/style-node.svg) |
| Links styled by their number | Drawn, less something | The link is heavy and red as written, in the design's own red; a default for every link is read past | [source](../corpus/flowchart/style-link.mmd) | [picture](../corpus/drawn/style-link.svg) |
| A class made and given to boxes | Drawn |  | [source](../corpus/flowchart/class-def.mmd) | [picture](../corpus/drawn/class-def.svg) |
| A class given with ::: | Drawn |  | [source](../corpus/flowchart/class-inline.mmd) | [picture](../corpus/drawn/class-inline.svg) |
| A default class for every box | Drawn, less something | The default class is read past: the look is the design's | [source](../corpus/flowchart/class-default.mmd) | [picture](../corpus/drawn/class-default.svg) |
| A box that calls a function when clicked | Drawn, less something | The click is left out: a page of Merlive runs no code of yours | [source](../corpus/flowchart/click-callback.mmd) | [picture](../corpus/drawn/click-callback.svg) |
| A box that opens a link when clicked | Drawn, less something | The link is left out | [source](../corpus/flowchart/click-link.mmd) | [picture](../corpus/drawn/click-link.svg) |

## Other kinds of diagram

Each is left exactly as it was written, and the command names it. The family says what it would take: a diagram
of boxes and links could be placed by the rules Merlive already has; the others need a way of drawing of their own.

### Steps in order

| Kind | Result | Sample |
|---|---|---|
| Sequence diagram | Left as Mermaid | [source](../corpus/kinds/sequence.mmd) |
| ZenUML sequence diagram | Left as Mermaid | [source](../corpus/kinds/zenuml.mmd) |
| Event model | Left as Mermaid | [source](../corpus/kinds/eventmodeling.mmd) |
| User journey | Left as Mermaid | [source](../corpus/kinds/journey.mmd) |
| Timeline | Left as Mermaid | [source](../corpus/kinds/timeline.mmd) |
| Gantt chart | Left as Mermaid | [source](../corpus/kinds/gantt.mmd) |
| Git graph | Left as Mermaid | [source](../corpus/kinds/gitgraph.mmd) |

### Boxes and links

| Kind | Result | Sample |
|---|---|---|
| Class diagram | Left as Mermaid | [source](../corpus/kinds/class.mmd) |
| State diagram | Left as Mermaid | [source](../corpus/kinds/state.mmd) |
| Entity relationship diagram | Left as Mermaid | [source](../corpus/kinds/er.mmd) |
| Requirement diagram | Left as Mermaid | [source](../corpus/kinds/requirement.mmd) |
| C4 diagram | Left as Mermaid | [source](../corpus/kinds/c4.mmd) |
| Block diagram | Left as Mermaid | [source](../corpus/kinds/block.mmd) |
| Architecture diagram | Left as Mermaid | [source](../corpus/kinds/architecture.mmd) |
| Swimlane diagram | Left as Mermaid | [source](../corpus/kinds/swimlane.mmd) |
| Use case diagram | Left as Mermaid | [source](../corpus/kinds/usecase.mmd) |
| Agent flow | Left as Mermaid | [source](../corpus/kinds/agentflow.mmd) |

### Tree

| Kind | Result | Sample |
|---|---|---|
| Mindmap | Left as Mermaid | [source](../corpus/kinds/mindmap.mmd) |
| Tree view | Left as Mermaid | [source](../corpus/kinds/treeview.mmd) |
| Ishikawa (fishbone) diagram | Left as Mermaid | [source](../corpus/kinds/ishikawa.mmd) |
| Kanban board | Left as Mermaid | [source](../corpus/kinds/kanban.mmd) |

### Chart

| Kind | Result | Sample |
|---|---|---|
| Treemap | Left as Mermaid | [source](../corpus/kinds/treemap.mmd) |
| Pie chart | Left as Mermaid | [source](../corpus/kinds/pie.mmd) |
| Quadrant chart | Left as Mermaid | [source](../corpus/kinds/quadrant.mmd) |
| XY chart | Left as Mermaid | [source](../corpus/kinds/xychart.mmd) |
| Sankey diagram | Left as Mermaid | [source](../corpus/kinds/sankey.mmd) |
| Radar chart | Left as Mermaid | [source](../corpus/kinds/radar.mmd) |
| Packet diagram | Left as Mermaid | [source](../corpus/kinds/packet.mmd) |
| Venn diagram | Left as Mermaid | [source](../corpus/kinds/venn.mmd) |
| Cynefin framework | Left as Mermaid | [source](../corpus/kinds/cynefin.mmd) |
| Wardley map | Left as Mermaid | [source](../corpus/kinds/wardley.mmd) |

### Grammar

| Kind | Result | Sample |
|---|---|---|
| Railroad (syntax) diagram | Left as Mermaid | [source](../corpus/kinds/railroad.mmd) |
