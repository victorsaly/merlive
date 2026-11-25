## An entity diagram

A block that starts `erDiagram` is read into the same boxes and links as a flowchart, so everything else on this
page holds for it: the rules, the design, Merlive's own lines. An entity is a box that lists its attributes under
its name; a relationship is a link that says, at each end, how many.

| Written | Read as |
|---|---|
| `ORDER`, `ORDER-LINE`, `"Purchase order"` | An entity: a box. In Merlive's own lines it is named with `_` for whatever an id cannot hold (`%% note ORDER_LINE: …`, `%% main: Purchase_order>ORDER_LINE`) |
| `s[Supplier]`, `a["Supplier account"]` | An alias, shown in place of the name |
| `ORDER {` … `}` | Its attributes, one to a line, listed under its name. Declared twice, the two lists are joined |
| `int number`, `string(40) reference`, `string[] barcodes`, `decimal(10,2) price`, `date? paid` | An attribute: its type, then its name, shown as written |
| `int number PK`, `string code PK, FK`, `string *code` | Its keys, after its name. A star before a name is a primary key, and is shown as `PK` |
| `string reference "Only 40 characters"` | Its comment, shown after it in its quotes |
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
