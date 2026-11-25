# The corpus

One small sample of everything Mermaid documents, to answer one question: what of it does Merlive draw?

- `flowchart/`: one sample for each feature the flowchart page of Mermaid's documentation sets out, from a box
  with words to links played in steps.
- `state/`: the same for the state diagram page.
- `sequence/`: the same for the sequence diagram page.
- `kinds/`: one sample of each kind of diagram Mermaid documents.
- `index.json`: for each sample, what it covers and what it should be read as: how many boxes, links and groups,
  which words, which kinds, what is at the ends of its links, and anything Merlive is known to leave out (`loses`).
- `drawn/`: what Merlive draws of each sample today, where it draws one.
- `mermaid/`: what Mermaid's own command draws of every sample, and `mermaid/index.json`, which says which it
  could not draw and why.
- `compare.html`: the two side by side, sample by sample. Open it in a browser; `compare.html#partly` opens on
  the samples Merlive only partly reads.

The answer is [docs/COVERAGE.md](../docs/COVERAGE.md). `npm run coverage` writes it, the pictures and the
comparison page again, and `npm test` fails when any of them no longer says what the code does.

`npm run compare` draws Mermaid's side again. It needs Mermaid's command (`npm install -g @mermaid-js/mermaid-cli`)
and Chrome, and is only worth running when a sample changes or Mermaid does. A sample Mermaid cannot draw is a
result, kept with Mermaid's own words for why: the corpus follows Mermaid's documentation, which runs ahead of
its releases.

## Where the list comes from

The list of kinds and features is Mermaid's own: the syntax pages of
[mermaid-js/mermaid](https://github.com/mermaid-js/mermaid/tree/develop/docs/syntax), read at commit `6374e52`
(23 November 2026). The samples are written for Merlive, about one ordering flow, so that the pictures can be
compared with each other. Mermaid is MIT licensed, and nothing of its documentation is copied here.

## When Mermaid adds something

Add a sample and its row in `index.json`, say what it should be read as, and run `npm run coverage`. A sample
that comes out "partly read" is the to-do list; do not make it pass by asking less of it.
