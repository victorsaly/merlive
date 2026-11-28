# Merlive reference

What only some diagrams need. SKILL.md has the everyday path.

## The Mermaid that is read

| Written | Read as |
|---|---|
| `flowchart TD`, `graph TD`, `TB` | Top to bottom |
| `flowchart LR` | Left to right |
| `BT`, `RL` | Bottom to top and right to left: the same flow, begun at the far end, with every arrow pointing the way it was written. A right-to-left flow too wide for a screen is turned top to bottom, as a left-to-right one is |
| `A[Text]`, `A(Text)` | A box |
| `A([Text])`, `A((Text))` | A start or end (a pill) |
| `A{Text}` | A rhombus, as wide and as tall as the boxes round it |
| `A{{Text}}`, `A[(Text)]`, `A[[Text]]`, `A(((Text)))`, `A>Text]` | A hexagon, a cylinder (a store of data, of the `data` kind), a subroutine, a double circle, a flag: each drawn as itself, in the footprint every box shares |
| `A[/Text/]`, `A[\Text\]`, `A[/Text\]`, `A[\Text/]` | The two that lean and the two trapezoids, drawn as themselves |
| `A["Text with (brackets)"]` | A quoted label |
| `A["one line<br/>and another"]` | A label in the author's own lines, up to four |
| ``A["`**Bold** and *italic*`"]`` | A Markdown string: its words, its own line breaks, and what it makes bold or italic. On a link's words the stars come off and the words are plain |
| `#quot;`, `#9829;` | An entity code becomes its character |
| `fa:fa-truck Shipped` | An icon is drawn beside its words. The drawing is Merlive's own (seventy-two of them, found by any name Font Awesome has used): nothing is fetched. One Merlive has no drawing for, or a brand's mark, is left out and named in a `note,` line |
| `A@{ shape: diam, label: "In stock?" }` | A box written the newer way, on one line or several. Its label is kept. Every shape in the rows above is drawn as itself, by any of Mermaid's names for it; a shape Merlive has no drawing for is a box |
| `A@{ icon: "fa:user", label: "Buyer" }` | A box with its label, and Merlive's own drawing of the icon beside it |
| `A@{ img: "…", label: "…" }` | A box with its label. The image is left out: a page of Merlive fetches nothing |
| `A@{ row: 1, column: 2 }`, `g@{ view: collapsed }` | Read past: placement is Merlive's, and a group is drawn open |
| `---` … `---` at the top | Front matter: its `title` is the picture's name, drawn above a still picture and as the heading of a page; Mermaid's own settings are read past |
| `accTitle: …`, `accDescr: …` | What the picture is called and what it shows, kept for readers who cannot see it |
| `A --> B`, `A --- B` | A link, with or without an arrowhead |
| `A -.-> B`, `A ==> B` | A dotted link, a thick link |
| `A --o B`, `A --x B`, `A <--> B`, `A o--o B`, `A x--x B` | A circle, a cross or an arrowhead at either end, drawn as written |
| `A ~~~ B` | An invisible link: its boxes are read, and no link is made. Where boxes go is Merlive's |
| `A -->\|Yes\| B`, `A -- Yes --> B`, `A -- "two<br/>lines" --> B` | A link with words |
| `A -. maybe .-> B`, `A == must ==> B`, `A ---> B` | Words in a dotted or thick link; an arrow drawn longer |
| `subgraph id["Title"]` … `end`, `g1 --> g2` | A group, drawn as a frame with its title; a link between groups joins the end of one to the start of the next. A group inside a group has a frame of its own inside the outer one |
| `A --> B --> C` | A chain |
| `A --> A`, `A -->\|again\| A` | A link from a box to itself: a small loop beside it. It is not one of the loops `%% step: … \| loop 1` counts |
| `A & B --> C & D` | Every box before the link, linked to every box after it |
| `A e1@--> B`, `e1@{ animate: true }` | A link with an id is a link; what Mermaid sets on it (animation, a step, a curve) is read past |
| `class A,B rework`, `A:::rework` | The kind of a box: its colour comes from the design's `kinds` |
| `classDef red stroke:#c62828` | The class's colour is read for what it means: a kind the design has no colour for takes the design's own nearest colour (this red becomes `risk`) |
| `style B stroke:#c00,stroke-width:3px,stroke-dasharray: 5 5` | What the author's own style means is kept: a broken outline, a heavy one, and a colour, named for its hue (`red`) and drawn in the design's own nearest colour. The fill is the design's |
| `linkStyle 0 stroke:#c00,stroke-width:4px` | The same for a link, by the number Mermaid gives it: heavy, broken, and in the design's nearest colour |
| `classDef default …`, `linkStyle default …` | Read past: a look for every box or every link is the design's |
| `click`, `direction` | Read past |

Where the Mermaid is kept decides how it is found: fenced `mermaid` blocks in Markdown (`.md`, `.mdx`); the whole
of a `.mmd` file; and, in any other file (an `.astro` page, a script), a string between backticks that starts as
a flowchart does. A string put together with `${…}` when the page runs cannot be read.

[What is and is not drawn](https://github.com/victorsaly/merlive/blob/main/docs/COVERAGE.md), feature by feature.

## A state diagram

`stateDiagram` and `stateDiagram-v2` are read into the same boxes and links as a flowchart, so everything else on
this page holds for them: the rules, the design, Merlive's own lines.

| Written | Read as |
|---|---|
| `Draft`, `state "Being written" as Draft`, `Draft : Being written` | A state: a box. Words given a line at a time are kept as lines |
| `Draft --> Sent`, `Draft --> Sent : send` | A transition: a link, with its words |
| `[*] --> Draft`, `Sent --> [*]` | Where it starts and where it ends: one pill each, saying `Start` and `End`. In Merlive's own lines they are `start` and `end` (`%% main: start>Draft>Sent>end`) |
| `state Review { … }` | A composite state: a group, with a start and an end of its own (`Review_start`, `Review_end`). A transition to it is drawn to where it starts inside, and one from it from where it ends |
| `Review : In review`, `state "In review" as Review {` | What a composite state is called |
| `state enough <<choice>>` | A decision, with its name or its words in it |
| `state split <<fork>>`, `state together <<join>>` | A box, with its name or its words in it |
| `note right of Draft : words`, `note left of Draft` … `end note` | The note on that box: what a reader sees on picking it |
| `direction LR`, `direction BT`, `direction RL` | The way the diagram runs. A composite state's own direction is read past |
| `classDef`, `class Held, Lost stopped`, `Held:::stopped` | Kinds, as in a flowchart |
| `--` inside a composite state | Regions that run side by side: each is a frame with no name inside the composite state, with a start of its own. A link into the composite state goes into every region |
| `%% words` after a line, `hide empty description`, `scale 350 width` | Read past |

A composite state inside another is a group inside a group.

## A class diagram

`classDiagram` and `classDiagram-v2` are read into the same boxes and links as a flowchart, so everything else on
this page holds for them: the rules, the design, Merlive's own lines.

| Written | Read as |
|---|---|
| `class Order`, or a name first met in a relation | A class: a box named by its name |
| `class Order["A purchase order"]`, `` class `Purchase order!` `` | A class with a label, or with a name no bare name could be. In Merlive's own lines it is the name without the backticks |
| `class Basket~Item~` | A class called `Basket<Item>`. What it is generic over is no part of its name: relations and Merlive's own lines say `Basket` |
| `Order : +String number`, `class Order { +String number … }` | A member: one row of the box. Rows that end in brackets are what the class does and come second; the rest are what it holds and come first. A class that only holds, or only does, has one compartment |
| `+`, `-`, `#`, `~` before a member; `total() Money` | Kept as written: who may see the member, and what it gives back |
| `List~Item~`, `List~List~Item~~` in a member | `List<Item>`, `List<List<Item>>` |
| `check()*`, `total() Money*`, `count()$`, `String prefix$` | The row ends in the words `{abstract}` or `{static}` |
| `class Payable <<interface>>`, `<<interface>> Payable`, `<<interface>>` inside the brackets | What the class is, over its name: `«interface»` |
| `Document <\|-- Order`, `Order --\|> Document` | Inheritance: a link with a triangle at the parent. It is drawn from the parent down to the child, whichever way it was written |
| `Payable <\|.. Invoice`, `Invoice ..\|> Payable` | Realisation: the same, dotted |
| `Order *-- OrderLine`, `Warehouse o-- Product` | Composition and aggregation: a filled or an open diamond at the class that holds |
| `Invoice --> Order`, `Order ..> PriceList` | Association and dependency: an arrow, on a solid or a dotted line |
| `Supplier -- Contact`, `Buyer .. Note` | A link with nothing at either end |
| `Supplier <--> Buyer`, `Bundle *--o Product` | A relation that says something at both ends |
| `Order "1" *-- "1..*" OrderLine : holds` | How many, beside each end, and the words on the link |
| `Payable ()-- Invoice`, `Order --() Printable` | A lollipop: a small box of its own for each class that offers it, named for the interface, marked `«interface»`, with a circle on its line. In Merlive's own lines it is `Invoice_Payable` |
| `namespace Buying { … }`, `namespace Auth["Signing in"] { … }` | A group of the classes declared in it, called by its label when it has one |
| A namespace inside another, `namespace Shop.Ordering.Buying { … }` | A group inside a group. A dotted name makes every group it spells out, each once, called by its last word; in Merlive's own lines a group is its whole dotted name |
| `note for Order "words"`, `note "words"` | A note drawn on the picture: a sheet with a folded corner, joined to its class by a dotted line, or to nothing. A `\n` or `<br>` in it is a new line. It is as tall as its words need |
| `classDef`, `cssClass "Order,Invoice" late`, `Order:::late`, `style Order …` | Kinds and outlines, as in a flowchart |
| `click`, `link`, `callback` | Read past |

Not read yet, each named in a `note,` line when met: a direction other than top to bottom (`direction LR`), since boxes of different heights
are only placed that way for now; a lollipop at both ends of one line. A line that is none of the above is said
with its line number and nothing is drawn from it.

## An entity diagram

A block that starts `erDiagram` is read into the same boxes and links as a flowchart, so everything else on this
page holds for it: the rules, the design, Merlive's own lines. An entity is a box that lists its attributes under
its name; a relationship is a link that says, at each end, how many.

| Written | Read as |
|---|---|
| `ORDER`, `ORDER-LINE`, `"Purchase order"` | An entity: a box. In Merlive's own lines it is named with `_` for whatever an id cannot hold (`%% note ORDER_LINE: …`, `%% main: Purchase_order>ORDER_LINE`) |
| `s[Supplier]`, `a["Supplier account"]` | An alias, shown in place of the name |
| `ORDER {` … `}` | Its attributes as a table under its name: a row for each, a column for types, one for names and one for keys when any has a key, ruled into cells with every second row shaded. Declared twice, the two lists are joined |
| `int number`, `string(40) reference`, `string[] barcodes`, `decimal(10,2) price`, `date? paid` | An attribute: its type, then its name, shown as written |
| `int number PK`, `string code PK, FK`, `string *code` | Its keys, after its name. A star before a name is a primary key, and is shown as `PK` |
| `string reference "Only 40 characters"` | Its comment, kept out of the table so the boxes stay narrow: it is in the note on its entity, after whatever note its author wrote (`reference: Only 40 characters`) |
| `SUPPLIER \|\|--o{ ORDER : receives` | A relationship: a link from the first entity to the second, with its words. They may be in quotes, empty, or left out |
| `\|\|`, `\|o` `o\|`, `}\|` `\|{`, `}o` `o{` | How many, at the end it is written at: one; none or one; one or more; any number. Either spelling at either end |
| `only one`, `1`, `zero or one`, `one or zero`, `one or more`, `one or many`, `1+`, `many(1)`, `zero or more`, `zero or many`, `0+`, `many(0)` | The same, in words |
| `--`, `to` | A relationship that gives the second entity its identity: a solid line |
| `..`, `optionally to` | One that does not: a dotted line |
| `SUPPLIER }o..o\| SUPPLIER : "buys from"` | A relationship from an entity to itself: a small loop beside it |
| `subgraph Buying` … `end`, `subgraph "Paying up"`, `subgraph pay ["Paying up"]`, `Buying \|\|--\|\| Paying : …` | A group, one inside another if written so, as in a flowchart; a relationship with a group goes to where it starts or from where it ends |
| `classDef late stroke:#c62828`, `class ORDER,INVOICE late`, `ORDER:::late` | Kinds, as in a flowchart. A box is of one kind: of several classes (`late,held`), the first |
| `style ORDER stroke:#c00,stroke-width:4px,stroke-dasharray: 5 5` | What the style says of its outline, as in a flowchart |
| `direction TB` | The way it runs. An entity diagram is drawn top to bottom for now: any other direction is read past, and said once. A group's own direction is read past |
| `title:` in front matter, `accTitle`, `accDescr`, `%%` comments | As in a flowchart |

Not read, each named in a `note,` line when met: attributes written on the line that opens them
(`ORDER { int number }`), and a line between the braces that is not a type and a name. A name written as Markdown
(`"A **firm** order"`) is drawn as plain words.

## A requirement diagram

`requirementDiagram` is read into the same boxes and links as a flowchart, so everything else on this page holds
for it: the rules, the design, Merlive's own lines. A requirement or an element is a box that says what it is
over its name, lists the few things said of it as rows, and carries its text as the sentence about it.

| Written | Read as |
|---|---|
| `requirement approval {` … `}` | A requirement: a box named by its name, with `«requirement»` over it |
| `functionalRequirement`, `interfaceRequirement`, `performanceRequirement`, `physicalRequirement`, `designConstraint` | The other five kinds of requirement, each said over the name: `«functional requirement»`, `«design constraint»` |
| `id: 1.1`, `risk: high`, `verifymethod: test` | Rows under the name, always in that order: `id: 1.1`, `risk: high`, `verify: test`. Only those that were written are listed |
| `text: Orders over the limit are approved.` | The sentence about the requirement, under its name. Read as Markdown and kept as plain words on one line |
| `risk: Low`, `Medium`, `High`; `verifymethod: Analysis`, `Demonstration`, `Inspection`, `Test` | The same, in small letters. Any other value is kept as written and said: Mermaid will not draw it |
| `element approval_flow {` … `}` | An element: a box with `«element»` over its name |
| `type: workflow`, `docref: docs/approval.md` | An element's rows: `type: workflow`, `doc: docs/approval.md` |
| `Requirement`, `ID:`, `VerifyMethod:`, `DocRef:` | Mermaid's own words in any case, read as the same |
| `id: "REQ-1.2 b"`, `text: "Approved: by a manager, on the day"`, `type: "word processor"` | A value in quotes, with what Mermaid would not take without them (a colon, a comma, a hyphen) |
| `requirement "Order approval" {`, `requirement order approval {` | A name of several words, in quotes or not. In Merlive's own lines it is `Order_approval`: each character an id cannot hold is `_` |
| `requirement "**Order** approval" {` | A name read as Markdown: its bold and italic are kept |
| `approval_flow - satisfies -> approval` | A relationship: a dotted link with an arrowhead at the second, and its word on it |
| `contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, `traces` | The seven relationships, in any case. `contains` is a solid line with a circle at the requirement that contains and no arrowhead |
| `approval <- satisfies - approval_flow` | The same relationship written from its other end: from `approval_flow` to `approval` |
| `a-contains->b`, `a - refines -> a` | With no spaces; from a requirement to itself |
| A relationship before the things it joins are declared | Read: each box is filled in when its declaration comes |
| A requirement or an element declared twice | The first is kept, as Mermaid keeps it, and it is said. A name that is both is drawn as the element |
| `classDef urgent …`, `class approval,limit urgent`, `requirement approval:::urgent {`, `approval:::urgent` | A kind for each box named, as in a flowchart. Of several classes (`:::urgent,late`) the first is the one a box is |
| `style approval stroke:#c62828,stroke-width:4px`, `style a,"Buyer limit" …` | Outlines, as in a flowchart |
| `direction TB` | The way it runs. A requirement diagram is drawn top to bottom for now: any other direction is read past, and said once |
| `%% words` on a line of its own, or after the `{` that opens a thing | A comment. After anything else `%%` is part of the words, as it is for Mermaid |
| `title:` in front matter, `accTitle`, `accDescr`, `%%{init: …}%%` | As in a flowchart |

Not read, each named in a `note,` line when met: something said of a requirement that only an element has, or
the other way round; a thing with no `{` after its name, or with what is said of it on the same line; a bare
name with a hyphen in it, which wants quotes; a relationship whose word is not one of the seven. A name that is
in a relationship and never declared is drawn as a plain box, and said: Mermaid will not draw that diagram. A
line that is none of the above is said with its line number and nothing is drawn from it.

## A C4 diagram

`C4Context`, `C4Container`, `C4Component`, `C4Dynamic` and `C4Deployment` are read into the same boxes and links
as a flowchart, so everything else on this page holds for them: the rules, the design, Merlive's own lines. An
element is a box that says what it is over its name and what it does under it; a boundary is a group; a relation
is a link. In Merlive's own lines an element is its alias (`%% note erp: …`, `%% main: buyer>erp`).

| Written | Read as |
|---|---|
| `Person(buyer, "Buyer", "Raises orders")` | A person: a box with the drawing of a person, `«person»` over its name, and what they do as its text |
| `System(erp, "ERP", "Holds orders")` | A system: `«system»` over its name |
| `Container(api, "Order API", "C#", "Checks orders")`, `Component(…)` | A container or a component, with what it is made in: `«container: C#»`, `«component: Repository»` |
| `SystemDb`, `ContainerDb`, `ComponentDb` | The same, drawn as a cylinder, of the kind that holds data: `«container database: SQL Server»` |
| `SystemQueue`, `ContainerQueue`, `ComponentQueue` | The same, drawn as a pill, of the kind that holds data: `«container queue: Service Bus»` |
| `Person_Ext`, `System_Ext`, `ContainerDb_Ext` and every other `_Ext` | Someone else's: of the kind `external`, and said so over its name (`«external system»`) |
| `System(erp)`, `System(erp, "ERP<br/>live")` | An element with no label is called by its alias; a `<br/>` in a label is a new line, and in a description a space |
| An element declared twice | The same element, said anew: the later line is what it is |
| `Boundary(firm, "The firm") { … }`, `Enterprise_Boundary`, `System_Boundary`, `Container_Boundary` | A group of what is declared inside it, called by its label. The `{` may be on the line below |
| `Boundary(dept, "Buying", "department") { … }` | A type that is written is added to the name: `Buying [department]`. One that is only implied (`Enterprise_Boundary`) is not |
| `Deployment_Node(azure, "Azure", "West Europe") { … }`, `Node`, `Node_L`, `Node_R` | A node of a deployment is a group too, called `Azure [West Europe]` |
| A boundary inside a boundary | A group inside a group |
| A boundary or a node with nothing in it | A box of its name, `«boundary»` or `«node: nginx»` over it, with what it was described as for its text |
| `Rel(buyer, erp, "Raises orders in")` | A link with an arrowhead, and its words |
| `Rel(web, api, "Calls", "HTTPS")` | How it is made, after its words: `Calls [HTTPS]`. What a relation is described as beyond that is read past, as Mermaid reads past it |
| `BiRel(erp, bank, "Reconciles with")` | A link with an arrowhead at both ends |
| `Rel_Back(buyer, erp, "Is told by")` | A link from the second to the first |
| `Rel_U`, `Rel_Up`, `Rel_D`, `Rel_Down`, `Rel_L`, `Rel_Left`, `Rel_R`, `Rel_Right` | A relation like any other: where a box goes is Merlive's to say |
| `Rel(…)` in a `C4Dynamic` diagram, `RelIndex(7, web, api, "Sends")` | Numbered in the order written, as Mermaid numbers them: `1: Sends`. The index a relation is given is read past, as Mermaid reads past it |
| Two relations between the same two | Both drawn. Mermaid keeps only the last |
| A relation with a boundary | A link to where the boundary begins, or from where it ends, as a link to any group is |
| `$descr="…"`, `$techn="…"`, `$type="…"` | An argument given by name, wherever it stands |
| `""`, or nothing between two commas | An argument left out |
| `"Raises orders, chases them (daily)"` | Words in quotes keep their commas and brackets, and may run on down the lines |
| `$link="…"`, `$tags="…"`, `$sprite="…"` | Read past: a page runs nothing of an author's, and Mermaid draws neither tags nor sprites |
| `UpdateElementStyle(erp, $bgColor="#b3261e")` | A colour written as `#rrggbb` makes the element of the kind named for its hue, as a flowchart's `style` does; an element that is someone else's or holds data stays what it is. The colour of its words and its shadow are the design's |
| `UpdateRelStyle(buyer, erp, $offsetX="5")`, `UpdateLayoutConfig($c4ShapeInRow="2")` | Read past: where a link's words sit and how many boxes are in a row are Merlive's to place |
| `title Ordering, in context`, `title:` in front matter | What the picture is called, drawn above a still picture and as the heading of a page |
| `accTitle`, `accDescr`, `%%` comments | As in a flowchart |

Not read, each named in a `note,` line when met: what a node of a deployment is described as when it has elements
in it (a group has a name and nothing more); a colour given by name (`$bgColor="grey"`: write it as `#rrggbb`); a
colour for a boundary or for a link (`UpdateRelStyle(…, $lineColor="blue")`), which are the design's. A relation
that names something nothing declares makes a box of that name, and says so. A line that is none of the above is
said with its line number and nothing is drawn from it.

Merlive reads more kindly than Mermaid in three places, none of which changes a diagram Mermaid can draw: a last
argument written without quotes (`System(erp)`), a comment after a line, and a relation with no words.

## An architecture diagram

`architecture-beta` (and `architecture`, as a later Mermaid has it) is read into the same boxes and links as a
flowchart, so everything else on this page holds for it: the rules, the design, Merlive's own lines.

| Written | Read as |
|---|---|
| `service api(server)[Orders API]` | A service: a box with its title for its words and its icon beside them |
| `service api[Orders API]`, `service api(server)` | A service with no icon is a box with its words alone; one with no title takes its id for its words |
| `service api(server)["Orders API, version 2"]` | A title in quotes may hold what a bare one may not |
| `(cloud)`, `(database)`, `(disk)`, `(internet)`, `(server)` | The icons Mermaid is born with, each in Merlive's own drawing. A service with `database` or `disk` is of the kind that holds data, as a flowchart's cylinder is |
| `(logos:aws-lambda)` | An icon from a pack is somebody's mark, which Merlive neither fetches nor draws: it is left out, the words are kept, and it is said once for each such icon. A name from a set Merlive knows (`fa:fa-key`) gets its drawing |
| `group cloud(cloud)[Azure]`, `group office[Head office]` | A group, drawn as a frame with its title. Its icon is read past |
| `service api(server)[Orders API] in cloud`, `group net(server)[Network] in cloud` | What is in a group, and a group inside a group, to any depth. A group may be declared after what is in it |
| `junction split`, `junction split in cloud` | Where edges meet and part: a dot, of the kind `junction` |
| `api:R -- L:db` | An edge: a link with nothing at either end |
| `shop:R --> L:api`, `api:R <-- L:db`, `api:B <--> T:erp` | An arrowhead on the service it points into: the second, the first, or both |
| `api:R -[saves to]- L:db`, `api:R <-[reads and writes]-> L:db` | The words on a link |
| The sides, `T`, `B`, `L`, `R` | Read for order, not for place. The link runs from the first service when it leaves by its right or its bottom, and from the second when by its left or its top, so what an author put first comes first. The diagram runs left to right when more edges leave by a left or a right side than by a top or a bottom, and top to bottom otherwise. Where each box sits, and which side a line meets, is by rule |
| `db{group}:R --> L:erp{group}` | A link out of a group or into one is drawn from the service it names, and that is said once: a line ends at a box, not at a frame |
| `one:R --> L:two`, where both are groups | Mermaid cannot draw it. It is joined as a flowchart's link to a group is: from the end of one to the start of the other |
| `align row a b c`, `align column a b c` | Read past: where a box goes is by rule |
| `title Where an order is kept`, `title:` in front matter | The picture's title, drawn above a still picture and as the heading of a page |
| `accTitle`, `accDescr`, `%%` comments on a line or after one, `config:` in front matter | As in a flowchart |
| An id with a hyphen (`orders-api`) | In Merlive's own lines it is the id with `_` for the hyphen (`orders_api`), and a number after it if that is taken |

Said in a `note,` line when met, each with what to do: an id declared twice (the first is kept); a service or a
group said to be in a group that is never declared, or in something that is not a group (it is drawn in no
group); two groups each inside the other; a group with nothing in it (it is not drawn); an edge that names
something never declared (it is drawn as a box named by its id). A line that is none of the above is said with
its line number and nothing is drawn from it.

## A block diagram

`block` and `block-beta` are read into the same boxes and links as a flowchart. But a block diagram is the one
kind whose author places the boxes, on a grid. So it is placed in one of two ways. Where it is a flow (every
block is joined to another by a link, every block takes one column, and a space is only there to make room for a
link), it is placed by rule, as a flowchart is. Where what it says is where each block is, it is placed **on the
grid its author wrote**: every block in its cell, exactly as wide as the columns it spans, with the links drawn
at right angles in the gaps between cells. It is never guessed at: a grid of blocks drawn as a row of boxes
would say something its author did not.

| Written | Read as |
|---|---|
| `shop["Web shop"]`, `shop` | A block: a box, called by its words, or by its id when it has none. Words go in quotes; `<br/>` breaks a line |
| `a("Round")`, `a(["Stadium"])`, `a[["Subroutine"]]`, `a[("Database")]`, `a(("Circle"))`, `a>"Flag"]`, `a{"Decision"}`, `a{{"Prepare"}}`, `a[/"Input"/]`, `a[\"Output"\]`, `a[/"Manual"\]`, `a[\"Trapezoid"/]`, `a((("Stop")))` | The same shapes as a flowchart's. A block with round corners is a box and a circle is a pill, as they are there; a cylinder is of the kind that holds data |
| `a --> b`, `a --- b`, `a ==> b`, `a -.-> b`, `a --o b`, `a --x b`, `a <--> b` | A link: solid, thick or dotted, ending in an arrow, nothing, a circle or a cross, or with an arrow at both ends |
| `a -- "words" --> b`, `a == "words" ==> b`, `a -. "words" .-> b` | A link with words. They go in quotes, written into the link |
| `a --> z`, where `z` is written nowhere else | The link, and a block `z` made for it, as Mermaid makes one |
| `start("Start") --> stop("Stop")` | A link, and each block given its shape and its words there |
| `block:back` … `end`, `block` … `end` | A block that holds others: a group. One inside another is a group inside a group |
| `block:back["Back office"]` | The same, called by its words. Mermaid 11 draws no name for it; Merlive draws the one its author wrote |
| `shop --> back`, `back --> bank` | A link to or from a block that holds others, joined to where the blocks inside it start or end, as a link to a group is |
| `columns 3`, `columns auto` in a flow | Which way the flow runs: blocks that fit one row run left to right, any others top to bottom |
| `a space b` with `a --> b`, `space:3` between two joined blocks | Room for the link, which is how Mermaid's own guide says to draw one. Read past |
| `style a fill:#636,stroke-width:4px`, `classDef late fill:#fde`, `class a,b late` | Kinds and outlines, as in a flowchart. A style is for one block |
| `%% words` on a line of its own, `title:` in front matter | As in a flowchart |

Placed on its author's grid, when any of these is written:

| Written | What it says, and how it is drawn |
|---|---|
| A block no link joins to another (a grid of blocks, one block on its own, a block inside another that only the outer one is linked for) | Where it is drawn is all that says what it belongs with. Each block is in the cell it was written in, the cells filled row by row |
| `columns 3`, `columns auto` | How many columns the grid has: every column as wide as every other, every row as tall as its tallest block. `auto` is one row |
| `wh["Warehouse"]:3`, `block:left:2` | A block that spans columns lies under or beside several others: it is as wide as those columns and the gaps between them. One that does not fit what is left of a row starts the next |
| `space`, `space:3` | A cell, or several, left empty, so a block comes where its author wanted it. A line may run through it |
| `block:left` … `end` with `columns` of its own | A frame over the cells it spans, round a grid of its own, with room for its name only when it has one |
| `to<["orders"]>(right)`, and `left`, `up`, `down`, `x`, `y` | A block arrow: an arrow drawn as a block, in its cell, pointing the way written. `x` points both ways across and `y` both ways up and down |
| `to<["orders"]>(x, down)` | An arrow along two lines at once is drawn along the first (both ways across), and said: Merlive draws an arrow along one line |
| `to<["&nbsp;"]>(down)` | An arrow with no words is drawn with none |
| `a --> b` on a grid | A link at right angles: straight across a gap where two blocks face each other, else round the blocks between them and never through one. A link with no way round is said, and the diagram is not written until it has one |

Not read, each named in a `note,` line when met, and the rest of the line still read:

- words not in quotes (`a[Box]`, `a -- words --> b`), which Mermaid does not draw either;
- words between bars (`a -->|words| b`): write them into the link;
- a chain (`a --> b --> c`): Mermaid draws no link of it; write each link on a line of its own;
- a comment after blocks on one line (`a b %% words`): Mermaid draws its words as more blocks;
- `a & b`, `~~~`, a style for several blocks at once (`style a,b …`), and anything else that is not a block, a
  space, a link or one of the lines above.

## A mindmap

`mindmap` is read into the same boxes and links as a flowchart, so everything else on this page holds for it:
the rules, the design, Merlive's own lines. Each line is a box, and how far in from the margin it is written
says which box it is under. Mermaid draws the tree round its root; Merlive draws it from its root to the right,
each box right of the one it is under. Nothing a mindmap says is lost by that. What is not kept is Mermaid's own
look: the root in the middle, and a colour for each branch.

| Written | Read as |
|---|---|
| The first line under `mindmap` | The root: a box of the kind `root`, so the legend and a reader's screen say which box the tree starts from |
| A line further in than the one above it | A box under that one, joined to it by a line with nothing at either end |
| Lines written unevenly | Each is under the nearest line above it that is further left: Mermaid's own rule. Spaces and tabs each count as one step |
| A line as far left as the root, or further | Mermaid has one root and will not draw this. Drawn as a branch of the root, and said |
| `Bare words` | A box that says them. Its id, for Merlive's own lines, is its words with `_` for what an id cannot hold: `Bare_words` |
| `buy[Buying things]` | A box with an id apart from its words: `%% note buy: …` names it by `buy`. An id may be several words (`the buying side[Buying]` is `the_buying_side`) |
| Two lines of the same words | Two boxes: every line is a box of its own. The second is `Words_2` in Merlive's own lines |
| `[Square]`, `(Rounded)`, bare words | The design's own box, whose corners are the design's. A mindmap with both a square and a rounded box is told, once, that they are drawn alike |
| `((Circle))` | A round-ended box |
| `{{Hexagon}}` | A hexagon |
| `))Bang((` | A box with a heavy outline: there is no burst here. Said once |
| `)Cloud(` | A round-ended box with a dashed outline: there is no cloud here. Said once |
| `((Ordering))`, with no id before it | The same shapes; the id is made from the words |
| `Costs (each month)` | What Mermaid reads it as: a rounded box with the id `Costs` that says "each month". Words with a bracket in them go in quotes inside a shape: `a["Costs (each month)"]` |
| `a["Paid: in full (or in part)"]` | Words in quotes, with what a bracket would otherwise end |
| `**bold**`, `*italic*`, in any label | Kept: Mermaid reads every label of a mindmap as Markdown, in a Markdown string or not |
| ``a["`**Ordering** from quote`"]``, on one line or several | A Markdown string: its words, its bold and italic, and its own line breaks |
| `Approved<br/>by a manager` | A line break |
| `::icon(fa fa-book)` on the line under a box | That box's icon, where Merlive has a drawing for it. One it has not is left out and said once, and the words are kept |
| `:::urgent large` on the line under a box | That box's kind: the first class, where several are given. A class has no colour here (Mermaid takes one from the page it is on); `%% kind urgent: Needs doing today` says what it means in the legend. A class on the root takes the place of `root` |
| `%% words` on a line of its own | A comment. After words on the same line `%%` is part of the words, as it is for Mermaid |
| `title:` in front matter, `%% note`, `%% kind`, `%% step` | As in a flowchart |
| `accTitle: …`, `accDescr: …` | As in a flowchart. Mermaid's own mindmap takes such a line for a box, so a mindmap that has one is not drawn by Mermaid: give the title in front matter |
| `classDef …`, `style …`, `direction LR`, and any other line | A box that says those words, as it is for Mermaid: a mindmap has no line that is not a box, an icon or a class |

A mindmap is never turned top to bottom for being wide, as a flowchart is: turned, every leaf would stand beside
the last and it would be wider still. `%% turn: yes` lets it be turned.

Not read, each named in a `note,` line when met: a bracket that is never closed, or closed with something after
it (`a[One] two`); a single `{` or `}`, which opens nothing in a mindmap; an icon or a class with no box on a
line above it. A line that is not read makes no box, and what is written under it goes under the nearest box
above that is further left.

## A kanban board

`kanban` is read into the boxes and groups a flowchart has, with no links: a column is a group and a card is a
box. Where a card is says everything a board says (the column is the state its work is in, how far down is its
turn), so a board is always placed **on the grid its author wrote**, never by rule: the columns side by side in
the order written, each as wide and as tall as the others, and the cards of each down it. Nothing runs between
the cards, so they sit close.

What tells a column from a card is how far in its line is, as it is for Mermaid: a line as far in as the first
is a column, and one further in, however far, is a card of the column above it.

| Written | Read as |
|---|---|
| `todo[To do]` as far in as the first line | A column: a group, called by its words. Drawn as a frame with its name, with or without cards |
| `raise[Raise the order]` further in | A card of the column above: a box, called by its words |
| `To do`, `Raise the order`, `raise` with no brackets | A column or a card called by what was written |
| `[Raise the order]` | A card with no id of its own |
| `raise(…)`, `raise((…))`, `raise{{…}}`, `raise))…((`, `raise)…(` | The same card: a board draws every card as a card, as Mermaid's does |
| `raise["Raise the order [urgent]"]` | Words in quotes, which may hold a bracket or a comma |
| ``raise["`**Raise** the order`"]`` | A Markdown string: what it makes bold or italic is drawn so |
| `<br/>` in the words, or words in quotes that go on to the next line | A line its author broke |
| `#amp;`, `#gt;`, `#quot;` | The character the code stands for |
| `@{ ticket: PO-1041 }` on a card | The ticket it is for, listed under the card's words as `ticket: PO-1041` |
| `@{ assigned: 'Amara' }` | Who has it, listed as `assigned: Amara` |
| `@{ priority: 'High' }` | How pressing it is, listed as `priority: high`. Mermaid draws a colour down the side of the card for `Very High`, `High`, `Low` and `Very Low`; Merlive says it in words, which print, need no legend and are the same in every design. Any other is kept as written, and said |
| `@{ ticket: PO-1041, assigned: 'Amara', priority: 'High' }` | All three, always listed in that order. In single quotes, double quotes or none; on one line with commas, or over several lines |
| `@{ label: "Raise the order" }` | The card's words |
| `%% note raise: …`, `%% words` on a line of its own, `title:` in front matter | As in a flowchart. A card with a dot, a hyphen or a space in what was written for its id is named with `_` in their place (`t.1` is `t_1`, `Raise the order` is `Raise_the_order`) |
| A comment after a card (`raise[Raise] %% this week`) | Read past, as Mermaid does. After bare words it is part of the words, as it is for Mermaid |
| `ticketBaseUrl` under `config: kanban:` in front matter | Read past: a ticket is listed on its card and is not a link out |
| One id written for two cards | Two cards, as Mermaid draws; the second is named with `_2` |

Not read, each named in a `note,` line when met: anything else set on a card (`due`, `icon`); anything set on a
column but its `label`; something set with no space after its colon (`assigned:knsv`), which Mermaid passes over
too; words after a card's brackets that are not `@{ … }` or a comment (`:::urgent`), which Mermaid refuses; a
column less far in than the first, which Mermaid refuses and Merlive reads as a column. Mermaid draws `accTitle`
and `accDescr` as columns; Merlive reads them as what they are.

## A timeline

`timeline` is read into the same boxes and links as a flowchart, and placed **on the grid its author wrote**,
as a block diagram's grid is: a timeline says an order and nothing else, so where each box is drawn is what it
says. Left to right, the periods are side by side in the order written and each period's events are under it,
the first events of every period in one row. Top to bottom (`timeline TD`), the periods are one under another
and each period's events are beside it. An arrow runs from each period to the next, as time does; a dotted line
runs from a period down its events, as Mermaid's own does.

| Written | Read as |
|---|---|
| `Monday : Raised` | A period, and an event in it: a box for each, the event under its period. A period has a heavier outline and its kind's mark; an event is a plain box |
| `Tuesday : Approved : Sent` | Several events of one period, one under another |
| `: Sent` on the line after a period | One more event of the period above. A line may carry several |
| `Wednesday` | A period in which nothing is said to have happened |
| `Tuesday: Approved` | The same as `Tuesday : Approved`: a colon needs no space before it |
| `Raised at 09:30`, `Approved:by the manager` | A colon with no space after it is part of the words |
| `Week 1 #colon; buying` | Mermaid's code for a colon that ends nothing: read as `:` |
| `Raised <br>by the buyer` | The lines its author broke the words into. Longer words are wrapped in their box |
| `title The order's week`, `title:` in front matter | What the picture is called: drawn above a still picture and as the heading of a page. The timeline's own wins |
| `section Buying` | A group round every period after it, up to the next section, and their events. Left to right the sections are side by side; top to bottom, one under another |
| `timeline LR`, `timeline TD` | Which way it runs. Left to right when nothing is said |
| `%% note period2: words`, `%% note event2_1: words` | A note for the second period, or for its first event: periods are numbered `period1`, `period2`… in the order written, and a period's events `event2_1`, `event2_2`… |
| `%% kind step: Milestone`, `%% kind period: Day` | What an event, or a period, is called in the legend and when picked. Unsaid, they are "Event" and "Period" |
| `%% words` on a line of its own, `accTitle:`, `accDescr:`, `accDescr { … }` | As in a flowchart |
| `disableMulticolor`, `theme`, `themeVariables` (`cScale0`…) in front matter | Read past: Mermaid's colours for periods are not kept. The colours are the design's |

Read as Mermaid 11 reads it, and named in a `note,` line:

- words after `timeline` on its line that are not `LR` or `TD` (`timeline BT`) are a first period, as Mermaid
  draws them: a timeline runs one of two ways;
- `%% words` after a period or an event are drawn as more words, as Mermaid draws them: a comment goes on a line
  of its own.

Not read, each named in a `note,` line when met, and the rest still read:

- an event before any period (`: Raised` first): write the period first;
- an event with no words (`Monday : Raised :`): take out the colon with nothing after it;
- a section with no periods under it: there is nothing to draw it round.

Where Merlive draws more than Mermaid 11 does: a period written before the first section is drawn, outside any
section (Mermaid leaves it out); two sections of one name are two sections, each with the periods written
under it (Mermaid gives both every period of that name's sections).

A timeline is as wide as it was written: nine periods are nine columns. It is not wrapped onto a second row.

## A packet

`packet` and `packet-beta` say which bits each field of a message takes. That is a grid its author placed: rows
of thirty-two bits (or as many as the diagram says), every field as wide as the bits it has. So a packet is not
placed by rule. A field is a box with its bits over its name, in the cell it was written for, and the rows are
cut where its author's count of bits says. A column is as many bits as every field is a whole number of, so a
packet of bytes is drawn in columns of a byte and one with a field of a single bit in columns of a bit; a field
of sixteen bits is always as wide as two of eight and the gap between them. Nothing joins two fields, so there
are no links, and the fields sit 4 px apart.

| Written | Read as |
|---|---|
| `0-15: "Source port"` | A field: a box called by its name, with `0–15` over it. It spans as many columns as it has bits |
| `106: "URG"`, `34-34: "PSH"` | A field of one bit, with `106` over it |
| `+16: "Destination port"` | A field of that many bits, starting where the last one ended |
| `0-15: 'Source port'`, `16-23: ""` | A name in single quotes; a field with no name, drawn with none. A name is taken as it is written: nothing is made of `<br>`, `**` or brackets in it, as Mermaid makes nothing of them |
| `16-47: "Total"` in rows of 32 | A field that runs past the end of a row: drawn again on the next row, with the same name and the bits it has there (`16–31`, then `32–47`), as Mermaid draws it. Each part says, when picked, which part of which bits it is |
| `title An order, as it is sent` | The title, drawn above the picture, as it is written (quotes and all). The last one said. `title:` in front matter is one too |
| `bitsPerRow: 16` under `config:` `packet:` in front matter, or in `%%{init: {"packet": {"bitsPerRow": 16}}}%%` | How many bits a row has: where the rows are cut, and how many columns there are |
| `showBits: false`, written the same ways | The bits are left off the picture, as asked |
| `bitWidth`, `rowHeight`, `paddingX`, `paddingY` | Mermaid's own sizes. Read past: a field is as wide as its words need, and no narrower than its share of a row of 512 px |
| `accTitle: …`, `accDescr: …` | What the picture is called and shows, for a reader who cannot see it |
| `%% words` on a line of its own or after a field, `%% note bits0: …` | A comment, read past; and Merlive's own lines, as in a flowchart. A field is called `bits` and the bit it starts at (`bits0`, `bits16`), and a part of a field cut at a row the bit that part starts at |

Not read, each named in a `note,` line when met, and the rest still drawn:

| Written | What is said |
|---|---|
| `0-7: "Kind"` then `12-15: "Flags"` | Bits 8 to 11 are in no field. Mermaid draws no packet at all with bits left out; Merlive leaves them empty, where they are, and says to start the field at bit 8 or to name the bits between |
| `4-11: "Overlap"` after `0-7: "Kind"` | Not read: bit 4 is already in a field. A field starts where the last one ended |
| `15-0: "Backwards"`, `+0: "Nothing"` | Not read: a field ends at or after the bit it starts at, and takes one bit at the least |
| `0-7: Kind` | Not read: a name goes in quotes |
| `0-7: "Say "hi""` | Not read: a name ends at the first quote mark like the one it starts with; use the other kind inside it |
| `0-7: "A"; 8-15: "B"` | Not read: one field to a line |
| `classDef`, `class`, `style` | Not read: a packet has no classes or styles in Mermaid. Its fields are drawn in the design's colours |

A field is a cell: a box that keeps less room round its words than a box of a flow, 4 px from the next, as
Mermaid's all but touch. A packet with a field of one bit has a column a bit, thirty-two to a row, each wide
enough for that field's name and bits: a TCP header, with flags of three letters, comes out about 1140 px wide.
A shorter name for the narrowest field, or fewer bits to a row, makes it narrower.

## A sequence diagram

A block that starts `sequenceDiagram` is read, placed and checked by rules of its own (S1 to S7, with D1 and D2).

| Written | Read as |
|---|---|
| `participant B as Buyer`, `actor B`, or a name first met in a message | Who is in it, left to right in the order named. An actor is a figure with its name under it; `@{ "type": … }` is a drawing of its own for `boundary`, `control`, `entity`, `database` (the `data` kind), `collections` and `queue`. Each is drawn again at the foot of its lifeline, unless `mirrorActors: false` is in the front matter or a directive |
| `A->B`, `A-->B`, `A->>B`, `A-->>B`, `A<<->>B`, `A-xB`, `A-)B` | A message: solid or dotted, with nothing, an arrowhead, an arrowhead at both ends, a cross or an open arrow |
| `A-\|\B`, `A-\|/B`, `A-\\B`, `A-//B`, dotted with `--`, reversed as `A/\|-B`, `A\\|-B`, `A//-B`, `A\\-B` | A message with half an arrowhead, or one stroke of an open one, above or below its line as written. A reversed one is drawn, and read, back to the participant named first |
| `A->>()B`, `A()->>B`, `A()->>()B` | A message that meets the middle of a lifeline, in a dot at that end |
| `A->>A: words` | A message to itself: a loop to the right |
| `A->>+B`, `B-->>-A`, `activate B`, `deactivate B` | A bar on a participant at work; a second on the same one sits beside the first |
| `Note right of A: …`, `Note left of A: …`, `Note over A: …`, `Note over A,B: …` | A note, on a row of its own |
| `loop`, `alt` / `else`, `opt`, `par` / `and`, `critical` / `option`, `break` … `end` | A frame round its rows, named, one inside another |
| `rect rgb(…)` … `end` | A highlight behind its rows, in the design's tint: the colour is read past |
| `box Aqua Buying` … `end` | A group of participants, framed, its title inside the frame above them and wrapped to it: the colour is read past |
| `create participant J`, `destroy J` | A participant that starts at the message that makes it, and ends in a cross |
| `autonumber`, `autonumber 10 5` | Each message numbered, from a start and by a step |
| `title: …`, `accTitle`, `accDescr`, front matter, `%%` comments, `<br/>`, `#9829;` | As in a flowchart |
| `link A: … @ url`, `links A: {…}` | Read past: a page of Merlive opens no links |

A line that is none of these is named in a `note,` line with its number, and nothing is drawn from it. There are
no `%%` lines of Merlive's own for a sequence: its page goes through the messages in order without being told.

## Merlive's own lines

All are Mermaid comments, anywhere in the block.

| Line | What it does |
|---|---|
| `%% note A: words` | What box `A` means. Shown when the box is picked, and printed as an appendix |
| `%% step: Title \| A>B>C \| words` | A step of the walkthrough along the links A to B to C |
| `%% step: Title \| loop 1 \| words` | A step along the shortest loop; `loop 2` is the next shortest |
| `%% step: Title \| - \| words` | A step with nothing lit, for an opening or closing remark |
| `%% main: A>B>C>D` | The path that gets the straight line. Without it, the longest path does |
| `%% side: left` | Branches and loops go to the left of the main path (above it, left to right). Default `right` |
| `%% kind red: Read-only data` | What a kind of box means. The legend, and a picked box, say this instead of the kind's own name. A kind its author named for a colour (`classDef red …`) with no such line is named in a `note,` line |
| `%% turn: no` | A flow written left to right that would be wider than a screen (1,100 px) is drawn top to bottom, and the command says so. This keeps it as written |

A step's path must follow links that exist; one that does not is named in a `note,` line and that part is left out.

## The design file

`merlive.design.json` in the project's folder. `--setup` writes it from the project's own site, so most projects
never write one by hand. Everything in it is optional, and what is left out comes from Merlive's own look.

```json
{
  "name": "storm",
  "from": "src/styles/global.css",
  "modes": "both",
  "motion": "calm",
  "depth": "soft",
  "ground": "dots",
  "output": { "format": "html", "steps": true, "legend": true, "source": true },
  "font": "\"IBM Plex Sans\", system-ui, sans-serif",
  "mono": "\"IBM Plex Mono\", ui-monospace, monospace",
  "weight": 500,
  "radius": 6,
  "light": {
    "bg": "#f4f6fa",
    "node": "#ffffff",
    "stroke": "#c3cad5",
    "text": "#18202b",
    "muted": "#566070",
    "edge": "#7a8696",
    "accent": "#0a5cc2",
    "kinds": { "decision": "#b87a00", "rework": "#a8327a", "vendor": "#5a4fcf" }
  },
  "dark": { "bg": "#11141a", "node": "#1a1f27", "text": "#eceef2" }
}
```

| Choice | What it sets |
|---|---|
| `modes` | `light`, `dark` or `both` (follow the reader's system). `dark` and `both` need dark colours |
| `motion` | `none`: nothing moves. `calm`: one dot follows a path when the reader presses play. `lively`: the path flows too |
| `depth` | `flat`: boxes lie on the page. `soft`: a shadow lifts them off it. Setup follows the site: `soft` only where the site has shadows |
| `ground` | `plain`: the page as it is. `dots`: the grid the boxes are placed on, shown faintly. Setup leaves a site's page `plain` |
| `output.format` | What is written for each diagram: `html` (a live page), `svg` (a still picture) or `both` |
| `output.steps` | Whether a page carries the walkthrough, when the diagram has `%% step` lines |
| `output.legend` | Whether a page carries the legend of kinds of box |
| `output.source` | Whether a page carries the Mermaid it was drawn from |
| `font`, `weight`, `radius` | The face (a list of faces), its weight (100 to 900) and a box's corner in px (0 to 40) |
| `mono` | The face for code (a list of faces): the Mermaid a page shows, and the rows a class lists. An entity's table keeps the page's face, which its columns are measured for |
| `from` | Where setup read the colours. Not used in drawing; it says where to look again |

| Colour | What it is |
|---|---|
| `bg` | The page behind the drawing |
| `node`, `stroke` | A plain box's fill and its edge |
| `text`, `muted` | Words, and quieter words (link labels, the legend) |
| `edge` | A line |
| `accent` | The picked thing and the path being shown |
| `kinds` | A colour for each kind of box that means something |

- Colours are six-digit hex. A colour that is not is refused, with its name.
- `kinds` names are yours: any name used in a `class` line can have a colour. A box's edge is its kind's colour,
  and its fill is that colour thinned into `node`. Merlive's own kinds are `decision`, `terminal` (a start or
  end), `rework`, `external`, `data` and `risk`.
- **Light and dark.** A file that sets `light` and no `dark` gives one look whatever the reader's system asks
  for. Give `dark` too for both. A file that touches no colour (only `radius`, say) keeps Merlive's light and dark.
- `font` is a CSS font stack. The page fetches nothing, so name faces the reader is likely to have, and end with
  a system face.
- `motion`: `none`, `calm` or `lively`.
- `--check` holds the file to two rules before anything is drawn: D1, words and lines can be read, and D2, the
  kinds can be told apart, also by people who do not see red and green apart. The message names the colour.

## What setup reads

`--setup` looks, in this order, at: the site, stylesheet or folder of stylesheets named with `--from`; the folder
of the project's own stylesheet with the most to say (any `.css` up to five folders down, leaving out what was
installed or built), all of its sheets read together; the `homepage` in
`package.json`, unless it is where the code lives (GitHub and the like). From a site's address it reads the page,
the stylesheets it links to and the styles written in it.

| It looks for | Where |
|---|---|
| Page and text colours | What `body` sets, following `var()`; else tokens named like `--bg`, `--background`, `--paper`, `--text`, `--foreground`, `--ink` |
| Accent | The colour of links when it is a colour; else a token named like `--accent`, `--primary`, `--brand`, `--mark`; else the strongest colour among the tokens |
| Dark mode | The same, inside `prefers-color-scheme: dark`, `.dark` or `[data-theme="dark"]` |
| Face, corner and shadows | `body`'s `font-family`; the most common `border-radius`; whether anything has a `box-shadow` |
| The face for code | The `font-family` of `code`, `pre`, `kbd` or `samp`, following `var()`; it is made to end in `monospace` |

Colours are read as hex, `rgb()`, `hsl()`, bare `H S% L%` and `oklch()`. What a diagram needs and a site does not
have (a box's fill and edge, lines, quiet text, the colours of kinds) is made from the page and text colours and
held to both colour rules. A site with one look gets diagrams with one look. Nothing found is never guessed: the
script says so and draws in Merlive's own look.

It does not yet read colours kept only in a Tailwind config, in a component's own `<style>`, or set by script.

## How it ends

| Ends with | Means |
|---|---|
| 0 | Every flowchart was drawn (or, with `--check`, would be) |
| 1 | A diagram broke a rule and was not written; the rule and the place are named |
| 2 | Something is missing: the file, an option's value, the design file |
| 3 | The file has no flowchart to draw |

## The rules it checks

P1 the main path is straight. P2 boxes are one size with room between. P3 no line through a box. P4 few
crossings. P5 no two lines share a path. P6 words fit. P7 link labels sit clear. P8 a group's name can be read. D1 contrast. D2 kinds can be told apart. Each is set out,
with what passes and fails, in `docs/PLACEMENT.md` of the repository.

A sequence diagram has its own: S1 participants in one row, one size, one step apart. S2 one message or note to
a row, evenly down the page. S3 a message's words beside its sender, off every lifeline. S4 a frame holds exactly
what is in it. S5 notes sit clear. S6 bars stack and never overlap. S7 names, words and notes fit. D1 and D2 as
above. They are set out in `docs/SEQUENCE.md`.
