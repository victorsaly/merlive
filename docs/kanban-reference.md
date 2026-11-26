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
