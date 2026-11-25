# What Merlive draws of Mermaid

Written by `npm run coverage`. Do not edit it by hand: change the code or the corpus and run it again.

The syntax pages of mermaid-js/mermaid at 6374e52 (2026-11-23): one row for every kind of diagram it documents and every feature its flowchart page sets out. The samples are our own.

## In short

- **Flowcharts:** of 69 features, 28 are drawn as written, 13 are drawn less something Merlive leaves out on purpose or does not have yet, 28 are only partly read, and 0 are refused.
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
| A title and settings in front matter | Partly read | not taken for a flowchart: it is read as "---" and left as Mermaid | [source](../corpus/flowchart/frontmatter.mmd) |  |
| Settings in an init directive | Drawn, less something | Mermaid's own settings are read past: the look is the design's | [source](../corpus/flowchart/init-directive.mmd) | [picture](../corpus/drawn/init-directive.svg) |
| Comments on lines of their own | Drawn |  | [source](../corpus/flowchart/comments.mmd) | [picture](../corpus/drawn/comments.svg) |
| A title and a description for readers who cannot see it | Drawn |  | [source](../corpus/flowchart/accessibility.mmd) | [picture](../corpus/drawn/accessibility.svg) |
| A description written over several lines | Drawn |  | [source](../corpus/flowchart/accessibility-block.mmd) | [picture](../corpus/drawn/accessibility-block.svg) |
| Statements ended with semicolons, and no spaces | Drawn |  | [source](../corpus/flowchart/semicolons.mmd) | [picture](../corpus/drawn/semicolons.svg) |
| Boxes named by their id alone | Drawn |  | [source](../corpus/flowchart/node-id-only.mmd) | [picture](../corpus/drawn/node-id-only.svg) |
| A box with words | Drawn |  | [source](../corpus/flowchart/node-text.mmd) | [picture](../corpus/drawn/node-text.svg) |
| Words in other alphabets | Drawn |  | [source](../corpus/flowchart/node-unicode.mmd) | [picture](../corpus/drawn/node-unicode.svg) |
| Brackets and signs inside quotes | Drawn |  | [source](../corpus/flowchart/node-quoted.mmd) | [picture](../corpus/drawn/node-quoted.svg) |
| Characters written as entity codes | Partly read | "Marked "rush"" is not among its words; "Thanks ♥" is not among its words | [source](../corpus/flowchart/node-entities.mmd) | [picture](../corpus/drawn/node-entities.svg) |
| A line break in a label | Drawn |  | [source](../corpus/flowchart/node-line-break.mmd) | [picture](../corpus/drawn/node-line-break.svg) |
| Markdown strings: bold, italic and a real line break | Partly read | read 0 of 2 boxes; read 0 of 1 links; "Urgent order" is not among its words; "Pick today and pack" is not among its words; line 2: not read: "A["`**Urgent** order`"] --> B["`Pick *today*"; line 3: not read: "and pack`"]" | [source](../corpus/flowchart/node-markdown.mmd) |  |
| A Font Awesome icon in a label | Partly read | "Shipped" is not among its words; "Delivered" is not among its words | [source](../corpus/flowchart/node-fontawesome.mmd) | [picture](../corpus/drawn/node-fontawesome.svg) |
| Shape: Round edges | Drawn, less something | Its corners are the design's, the same as every box | [source](../corpus/flowchart/shape-round.mmd) | [picture](../corpus/drawn/shape-round.svg) |
| Shape: Stadium | Drawn |  | [source](../corpus/flowchart/shape-stadium.mmd) | [picture](../corpus/drawn/shape-stadium.svg) |
| Shape: Subroutine | Drawn, less something | Drawn as a plain box | [source](../corpus/flowchart/shape-subroutine.mmd) | [picture](../corpus/drawn/shape-subroutine.svg) |
| Shape: Cylinder, a database | Drawn, less something | Drawn as a box of the kind "data", not as a cylinder | [source](../corpus/flowchart/shape-cylinder.mmd) | [picture](../corpus/drawn/shape-cylinder.svg) |
| Shape: Circle | Drawn, less something | Drawn as a pill | [source](../corpus/flowchart/shape-circle.mmd) | [picture](../corpus/drawn/shape-circle.svg) |
| Shape: Asymmetric, a flag | Partly read | read 0 of 3 boxes; read 0 of 2 links; "Before" is not among its words; "Flagged" is not among its words; "After" is not among its words; line 2: not read: "A[Before] --> B>Flagged] --> C[After]" | [source](../corpus/flowchart/shape-asymmetric.mmd) |  |
| Shape: Rhombus, a decision | Drawn |  | [source](../corpus/flowchart/shape-rhombus.mmd) | [picture](../corpus/drawn/shape-rhombus.svg) |
| Shape: Hexagon | Drawn, less something | Drawn as a decision | [source](../corpus/flowchart/shape-hexagon.mmd) | [picture](../corpus/drawn/shape-hexagon.svg) |
| Shape: Parallelogram | Partly read | "Input" is not among its words | [source](../corpus/flowchart/shape-parallelogram.mmd) | [picture](../corpus/drawn/shape-parallelogram.svg) |
| Shape: Parallelogram, leaning back | Partly read | "Output" is not among its words | [source](../corpus/flowchart/shape-parallelogram-alt.mmd) | [picture](../corpus/drawn/shape-parallelogram-alt.svg) |
| Shape: Trapezoid | Partly read | "Manual step" is not among its words | [source](../corpus/flowchart/shape-trapezoid.mmd) | [picture](../corpus/drawn/shape-trapezoid.svg) |
| Shape: Trapezoid, upside down | Partly read | "Priority" is not among its words | [source](../corpus/flowchart/shape-trapezoid-alt.mmd) | [picture](../corpus/drawn/shape-trapezoid-alt.svg) |
| Shape: Double circle | Partly read | read 0 of 3 boxes; read 0 of 2 links; "Before" is not among its words; "Stop" is not among its words; "After" is not among its words; line 2: not read: "A[Before] --> B(((Stop))) --> C[After]" | [source](../corpus/flowchart/shape-double-circle.mmd) |  |
| Shapes written as @{ shape: … }, with a label | Partly read | read 0 of 5 boxes; read 0 of 4 links; "Take the order" is not among its words; "In stock?" is not among its words; "Orders" is not among its words; "Back order note" is not among its words; "Done" is not among its words; line 2: not read: "A@{ shape: rect, label: "Take the order" } --> B@{ shape: diam, label: "In stock?" }"; line 3: not read: "B --> C@{ shape: cyl, label: "Orders" }"; line 4: not read: "B --> D@{ shape: doc, label: "Back order note" }"; line 5: not read: "D --> E@{ shape: stadium, label: "Done" }" | [source](../corpus/flowchart/shape-at-syntax.mmd) |  |
| Every one of the 53 newer shapes | Partly read | read 12 of 53 boxes; line 2: not read: "n0@{ shape: bang, label: "bang" }"; line 3: not read: "n1@{ shape: browser, label: "browser" }"; line 4: not read: "n2@{ shape: bucket, label: "bucket" }"; line 5: not read: "n3@{ shape: notch-rect, label: "notch-rect" }"; line 6: not read: "n4@{ shape: cloud, label: "cloud" }"; line 7: not read: "n5@{ shape: hourglass, label: "hourglass" }"; line 8: not read: "n6@{ shape: bolt, label: "bolt" }"; line 9: not read: "n7@{ shape: brace, label: "brace" }"; line 10: not read: "n8@{ shape: brace-r, label: "brace-r" }"; line 11: not read: "n9@{ shape: braces, label: "braces" }"; line 12: not read: "n10@{ shape: console, label: "console" }"; line 13: not read: "n11@{ shape: lean-r, label: "lean-r" }"; line 14: not read: "n12@{ shape: lean-l, label: "lean-l" }"; line 15: not read: "n13@{ shape: datastore, label: "datastore" }"; line 16: not read: "n14@{ shape: cyl, label: "cyl" }"; line 17: not read: "n15@{ shape: diam, label: "diam" }"; line 18: not read: "n16@{ shape: delay, label: "delay" }"; line 19: not read: "n17@{ shape: h-cyl, label: "h-cyl" }"; line 20: not read: "n18@{ shape: lin-cyl, label: "lin-cyl" }"; line 21: not read: "n19@{ shape: curv-trap, label: "curv-trap" }"; line 22: not read: "n20@{ shape: div-rect, label: "div-rect" }"; line 23: not read: "n21@{ shape: doc, label: "doc" }"; line 24: not read: "n22@{ shape: rounded, label: "rounded" }"; line 25: not read: "n23@{ shape: tri, label: "tri" }"; line 26: not read: "n24@{ shape: folder, label: "folder" }"; line 27: not read: "n25@{ shape: fork, label: "fork" }"; line 28: not read: "n26@{ shape: win-pane, label: "win-pane" }"; line 29: not read: "n27@{ shape: f-circ, label: "f-circ" }"; line 30: not read: "n28@{ shape: lin-doc, label: "lin-doc" }"; line 31: not read: "n29@{ shape: lin-rect, label: "lin-rect" }"; line 32: not read: "n30@{ shape: notch-pent, label: "notch-pent" }"; line 33: not read: "n31@{ shape: flip-tri, label: "flip-tri" }"; line 34: not read: "n32@{ shape: sl-rect, label: "sl-rect" }"; line 35: not read: "n33@{ shape: trap-t, label: "trap-t" }"; line 36: not read: "n34@{ shape: docs, label: "docs" }"; line 37: not read: "n35@{ shape: st-rect, label: "st-rect" }"; line 38: not read: "n36@{ shape: odd, label: "odd" }"; line 39: not read: "n37@{ shape: flag, label: "flag" }"; line 40: not read: "n38@{ shape: person, label: "person" }"; line 41: not read: "n39@{ shape: hex, label: "hex" }"; line 42: not read: "n40@{ shape: trap-b, label: "trap-b" }"; line 43: not read: "n41@{ shape: rect, label: "rect" }"; line 44: not read: "n42@{ shape: circle, label: "circle" }"; line 45: not read: "n43@{ shape: sm-circ, label: "sm-circ" }"; line 46: not read: "n44@{ shape: dbl-circ, label: "dbl-circ" }"; line 47: not read: "n45@{ shape: fr-circ, label: "fr-circ" }"; line 48: not read: "n46@{ shape: bow-rect, label: "bow-rect" }"; line 49: not read: "n47@{ shape: fr-rect, label: "fr-rect" }"; line 50: not read: "n48@{ shape: cross-circ, label: "cross-circ" }"; line 51: not read: "n49@{ shape: tag-doc, label: "tag-doc" }"; line 52: not read: "n50@{ shape: tag-rect, label: "tag-rect" }"; line 53: not read: "n51@{ shape: stadium, label: "stadium" }"; line 54: not read: "n52@{ shape: text, label: "text" }" | [source](../corpus/flowchart/shape-at-every.mmd) | [picture](../corpus/drawn/shape-at-every.svg) |
| A box that is an icon | Partly read | read 0 of 2 boxes; read 0 of 1 links; "Buyer" is not among its words; line 2: not read: "A@{ icon: "fa:user", form: "square", label: "Buyer", pos: "t", h: 60 } --> B[Approve]" | [source](../corpus/flowchart/shape-icon.mmd) |  |
| A box that is an image | Partly read | read 0 of 2 boxes; read 0 of 1 links; "Supplier" is not among its words; line 2: not read: "A@{ img: "https://example.com/logo.svg", label: "Supplier", pos: "t", w: 60, h: 60, constraint: "on" } --> B[Order]" | [source](../corpus/flowchart/shape-image.mmd) |  |
| Boxes given a row and a column | Partly read | read 0 of 3 boxes; read 0 of 2 links; line 2: not read: "A[Quote]@{ row: 1, column: 1 } --> B[Order]@{ row: 1, column: 2 }"; line 3: not read: "B --> C[Invoice]@{ row: 2, column: 2 }" | [source](../corpus/flowchart/grid-layout.mmd) |  |
| A link with an arrowhead | Drawn |  | [source](../corpus/flowchart/link-arrow.mmd) | [picture](../corpus/drawn/link-arrow.svg) |
| A link with no arrowhead | Drawn |  | [source](../corpus/flowchart/link-open.mmd) | [picture](../corpus/drawn/link-open.svg) |
| Words on a link, between bars | Drawn |  | [source](../corpus/flowchart/link-text-bars.mmd) | [picture](../corpus/drawn/link-text-bars.svg) |
| Words on a link, written into it | Drawn |  | [source](../corpus/flowchart/link-text-inline.mmd) | [picture](../corpus/drawn/link-text-inline.svg) |
| A dotted link, with and without words | Drawn |  | [source](../corpus/flowchart/link-dotted.mmd) | [picture](../corpus/drawn/link-dotted.svg) |
| A thick link, with and without words | Drawn |  | [source](../corpus/flowchart/link-thick.mmd) | [picture](../corpus/drawn/link-thick.svg) |
| An invisible link, used to nudge placement | Partly read | read 2 of 3 boxes; read 1 of 2 links; line 2: not read: "A[Order] ~~~ B[Pick]" | [source](../corpus/flowchart/link-invisible.mmd) | [picture](../corpus/drawn/link-invisible.svg) |
| Links chained in one line | Drawn |  | [source](../corpus/flowchart/link-chain.mmd) | [picture](../corpus/drawn/link-chain.svg) |
| One line linking to several boxes with & | Partly read | read 0 of 4 boxes; read 0 of 4 links; line 2: "&" between nodes is not read yet; write one link per line: "A[Order] --> B[Pick] & C[Bill] --> D[Close]" | [source](../corpus/flowchart/link-chain-and.mmd) |  |
| Several boxes to several boxes with & | Partly read | read 0 of 4 boxes; read 0 of 4 links; line 2: "&" between nodes is not read yet; write one link per line: "A[Web order] & B[Phone order] --> C[Pick] & D[Bill]" | [source](../corpus/flowchart/link-and-both.mmd) |  |
| A link ending in a circle or a cross | Partly read | read 0 of 3 boxes; read 0 of 2 links; line 2: not read: "A[Order] --o B[Line items]"; line 3: not read: "B --x C[Cancelled]" | [source](../corpus/flowchart/link-circle-cross.mmd) |  |
| Arrows at both ends | Partly read | read 0 of 4 boxes; read 0 of 3 links; line 2: not read: "A[ERP] <--> B[Warehouse]"; line 3: not read: "B o--o C[Carrier]"; line 4: not read: "C x--x D[Blocked]" | [source](../corpus/flowchart/link-both-ways.mmd) |  |
| Links drawn longer, to push a box further on | Drawn, less something | The extra length is read past: placement is Merlive's | [source](../corpus/flowchart/link-length.mmd) | [picture](../corpus/drawn/link-length.svg) |
| A link given an id | Partly read | read 0 of 3 boxes; read 0 of 2 links; line 2: not read: "A[Order] e1@--> B[Pick]"; line 3: not read: "B e2@==> C[Pack]" | [source](../corpus/flowchart/link-id.mmd) |  |
| A link set to animate | Partly read | read 0 of 3 boxes; read 0 of 2 links; line 2: not read: "A[Order] e1@--> B[Pick]"; line 3: not read: "B e2@--> C[Pack]"; line 4: not read: "e1@{ animate: true }"; line 5: not read: "e2@{ animation: fast }" | [source](../corpus/flowchart/link-animate.mmd) |  |
| Links played one step after another | Partly read | read 0 of 4 boxes; read 0 of 3 links; "miss" is not among its words; line 2: not read: "Client e1@--> API"; line 3: not read: "API e2@--> Cache"; line 4: not read: "Cache e3@-->\|miss\| DB"; line 5: not read: "e1@{ step: 1 }"; line 6: not read: "e2@{ step: 2 }"; line 7: not read: "e3@{ step: 3 }" | [source](../corpus/flowchart/link-steps.mmd) |  |
| A link given a curve of its own | Partly read | read 0 of 3 boxes; read 0 of 2 links; line 2: not read: "A[Order] e1@==> B[Pick]"; line 3: not read: "A e2@--> C[Bill]"; line 4: not read: "e1@{ curve: linear }"; line 5: not read: "e2@{ curve: natural }" | [source](../corpus/flowchart/link-curve.mmd) |  |
| A group named by its title | Drawn |  | [source](../corpus/flowchart/subgraph-title.mmd) | [picture](../corpus/drawn/subgraph-title.svg) |
| A group with an id and a title | Drawn |  | [source](../corpus/flowchart/subgraph-id.mmd) | [picture](../corpus/drawn/subgraph-id.svg) |
| Links to a group and between groups | Drawn |  | [source](../corpus/flowchart/subgraph-links.mmd) | [picture](../corpus/drawn/subgraph-links.svg) |
| A group with a direction of its own | Drawn, less something | The group's own direction is read past; it runs the way the rest does | [source](../corpus/flowchart/subgraph-direction.mmd) | [picture](../corpus/drawn/subgraph-direction.svg) |
| A group inside a group | Partly read | read 1 of 2 groups; line 4: a group inside a group is drawn as part of the outer one | [source](../corpus/flowchart/subgraph-nested.mmd) | [picture](../corpus/drawn/subgraph-nested.svg) |
| A group shown collapsed | Partly read | line 7: not read: "one@{ view: collapsed }" | [source](../corpus/flowchart/subgraph-collapsed.mmd) | [picture](../corpus/drawn/subgraph-collapsed.svg) |
| A box styled on its own | Drawn, less something | The style is read past: the look is the design's | [source](../corpus/flowchart/style-node.mmd) | [picture](../corpus/drawn/style-node.svg) |
| Links styled by their number | Drawn, less something | The style is read past: the look is the design's | [source](../corpus/flowchart/style-link.mmd) | [picture](../corpus/drawn/style-link.svg) |
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
