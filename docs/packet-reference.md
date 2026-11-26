## A packet

`packet` and `packet-beta` say which bits each field of a message takes. That is a grid its author placed: rows
of thirty-two bits (or as many as the diagram says), every field as wide as the bits it has. So a packet is not
placed by rule. A field is a box with its bits over its name, in the cell it was written for, and the rows are
cut where its author's count of bits says. A column is as many bits as every field is a whole number of, so a
packet of bytes is drawn in columns of a byte and one with a field of a single bit in columns of a bit; a field
of sixteen bits is always as wide as two of eight and the gap between them. Nothing joins two fields, so there
are no links, and the room between fields is the least the rules allow.

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

A packet with a field of one bit has a column a bit, thirty-two to a row, each wide enough for that field's
name: a header with flags of three letters comes out about 2400 px wide, and is scrolled across on a page. A
shorter name for the narrowest field, or fewer bits to a row, makes it narrower.
