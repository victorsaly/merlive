# The corpus

One small sample of everything Mermaid documents, to answer one question: what of it does Merlive draw?

- `flowchart/`: one sample for each feature the flowchart page of Mermaid's documentation sets out, from a box
  with words to links played in steps.
- `kinds/`: one sample of each other kind of diagram Mermaid documents.
- `index.json`: for each sample, what it covers and what it should be read as: how many boxes, links and groups,
  which words, which kinds, and anything Merlive is known to leave out (`loses`).
- `drawn/`: what Merlive draws of each flowchart sample today.

The answer is [docs/COVERAGE.md](../docs/COVERAGE.md). `npm run coverage` writes it and the pictures again, and
`npm test` fails when either no longer says what the code does.

## Where the list comes from

The list of kinds and features is Mermaid's own: the syntax pages of
[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid/tree/develop/docs/syntax), read at commit `6374e52`
(23 November 2026). The samples are written for Merlive, about one ordering flow, so that the pictures can be
compared with each other. Mermaid is MIT licensed, and nothing of its documentation is copied here.

## When Mermaid adds something

Add a sample and its row in `index.json`, say what it should be read as, and run `npm run coverage`. A sample
that comes out "partly read" is the to-do list; do not make it pass by asking less of it.
