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
