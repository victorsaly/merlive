## A block diagram

`block` and `block-beta` are read into the same boxes and links as a flowchart. But a block diagram is the one
kind whose author places the boxes, on a grid, and Merlive places boxes by rule and keeps no grid yet. So a block
diagram is drawn only when it is a flow: every block is joined to another by a link, every block takes one
column, and a space is only there to make room for a link. Any other is **left as Mermaid**, and the command says
which line made it so and what to change. It is never guessed at: a grid of blocks drawn as a row of boxes would
say something its author did not.

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
| `columns 3`, `columns auto` | How many columns the grid has. It says which way a flow runs: blocks that fit one row run left to right, any others top to bottom. Nothing else of the grid is kept |
| `a space b` with `a --> b`, `space:3` between two joined blocks | Room for the link, which is how Mermaid's own guide says to draw one. Read past |
| `style a fill:#636,stroke-width:4px`, `classDef late fill:#fde`, `class a,b late` | Kinds and outlines, as in a flowchart. A style is for one block |
| `%% words` on a line of its own, `title:` in front matter | As in a flowchart |

Left as Mermaid, with the first three reasons said and the rest counted:

| Written | Why it is left |
|---|---|
| A block no link joins to another (a grid of blocks, one block on its own, a block inside another that only the outer one is linked for) | Where it is drawn is all that says what it belongs with |
| `wh["Warehouse"]:3`, `block:left:2` | A block that spans columns says it lies under or beside several others. Every box Merlive draws is one size |
| `space` that is not between two joined blocks: at the start or the end of a row, a whole empty row, beside a block it pushes along | It holds a cell open so a block comes where its author wanted it |
| `to<["orders"]>(right)`, and `left`, `up`, `down`, `x`, `y`, `x, down` | A block arrow is an arrow between two cells, drawn as a block. It joins what is beside it only by being there |

Not read, each named in a `note,` line when met, and the rest of the line still read:

- words not in quotes (`a[Box]`, `a -- words --> b`), which Mermaid does not draw either;
- words between bars (`a -->|words| b`): write them into the link;
- a chain (`a --> b --> c`): Mermaid draws no link of it; write each link on a line of its own;
- a comment after blocks on one line (`a b %% words`): Mermaid draws its words as more blocks;
- `a & b`, `~~~`, a style for several blocks at once (`style a,b …`), and anything else that is not a block, a
  space, a link or one of the lines above.
