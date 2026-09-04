# Think-Tanks-DC

Think-Tanks-DC is a public React and D3 dashboard for exploring disclosed funding, transparency, and revolving-door patterns across 75 Washington-area think tanks. It packages the current research snapshot as a reproducible browser build and a source-attributed dataset with explicit provenance gaps.

## Status

This repository is a maintained public research prototype. It is suitable for local analysis, GitHub Pages deployment, and code review, but it should not be treated as a comprehensive or final map of all think tank funding.

## What It Covers

- 75 think tanks in the Washington policy ecosystem
- 2,682 funding records spanning 2019 to 2024
- Three sampled donor categories: foreign governments, Pentagon contractors, and U.S. government agencies
- Public-record revolving-door context used for network views

The dashboard does not track every funding stream. A think tank with no tracked funding in these sampled categories is not proven to have no funding, and the interface now labels that distinction explicitly.

## Visualization Surface

- `Funding Heatmap`: compares tracked funding, totals, and transparency scores
- `Ideology & Funding`: treemap sized by tracked funding and grouped by ideology
- `Timeline`: founding years and decade-level establishment patterns
- `Money Flows`: donor-to-think-tank sankey for tracked transactions
- `Foreign Government Flows`: chord diagram for cross-border funding relationships
- `Revolving Door Network`: personnel network view based on public records

## Methodology And Sources

- Local methodology: [docs/METHODOLOGY.md](docs/METHODOLOGY.md)
- Data and provenance boundary: [DATA_AND_PROVENANCE_NOTICE.md](DATA_AND_PROVENANCE_NOTICE.md)
- Original share link preserved inside the methodology document
- Primary source families documented in the repo:
  - think tank self-disclosure pages
  - IRS 990 references via ProPublica Nonprofit Explorer
  - USASpending.gov
  - OpenSecrets cross-checks

Of the 2,682 transaction rows in `src/data/transactions.ts`, 2,676 carry an HTTP(S)-formatted source URL. Six legacy rows have no source URL and are enumerated in the data and provenance notice; they remain unresolved rather than being filled with inferred citations. URL presence does not guarantee that a source remains reachable. Funding aggregates use floor values when institutions disclose ranges rather than exact figures.

## Setup

This repo targets Node 22 and the repo-pinned `pnpm@11.10.0`.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

The local Vite server defaults to `http://127.0.0.1:5173/`.

## Verification

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

The GitHub Pages workflow builds the same `dist/` output from `main`.

## Limitations

- The dataset is bounded to three donor categories and should not be read as a full funding census.
- Zero tracked funding in this repo means no tracked funding in the sampled categories, not evidence of non-disclosure, dark money, or innocence.
- Totals are lower bounds when the original disclosure reported a range.
- Funding relationships do not by themselves establish policy causation.
- Six legacy rows have unresolved provenance gaps, while some other citations intentionally use public Web Archive URLs; treat the six enumerated records as flagged research leads rather than fully sourced observations.
- Data freshness depends on the underlying public disclosures cited in the dataset.

## Support

Open a GitHub issue for reproducible bugs, broken source links, or documentation errors. Repo-specific escalation policies are not promised; this repository inherits the owner's account-level community and security guidance.

## Maintainer

Maintained by Muhammad Umar Zafar.

## License And Reuse Boundary

The software in this repository is available under the MIT License. See [LICENSE](LICENSE).

The underlying research data, source documents, screenshots, third-party marks, and cited public materials are not granted a blanket open-data or content license by the MIT software license. Reuse of those materials remains subject to their original terms, provenance, and applicable law.
