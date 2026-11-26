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
