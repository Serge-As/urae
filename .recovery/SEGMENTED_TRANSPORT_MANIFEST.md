# Eco-System segmented recovery transport

This transport contains a **runtime qualification subset**, not the canonical documentation archive.

- archive SHA-256: `c2c666bb83d63cfaa40dd17ea96d298468837f36849fe927c938e2ffe5e5f070`
- encoding: base64 text split into 27 lexical chunks
- verification order: each chunk SHA-256 -> concatenate -> base64 decode -> archive SHA-256 -> extract -> tests
- canonical local reference after BIR recovery-procedure integration: `dfa15e1402be630573bca76ac8f5d90d87a0fef6`
- full local qualification: 36/36 tests PASS, 23 universal guardrails, 11 service cards, 395 requirement IDs, 1559 headings
- money execution remains disabled: `realMoneyEnabled=false`

The full local CI remains broader than this remote transport qualification and includes constitutional, memory, truth and source-coverage gates.