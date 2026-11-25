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
| `junction split`, `junction split in cloud` | Where edges meet and part: a round box with no words, of the kind `junction` |
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
