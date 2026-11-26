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
