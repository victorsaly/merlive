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
