# Data and provenance notice

The MIT License applies to original software in this repository. It does not
grant blanket rights to the research dataset, cited documents, institutional
names or marks, or third-party source material. Those materials retain their
original rights and terms.

The dataset is a bounded research snapshot, not a complete census of think-tank
funding. A transaction amount records either an exact disclosed value or the
floor of a disclosed range. A missing record is not evidence that funding did
not occur, and a funding relationship does not by itself establish influence or
policy causation.

## Known missing citations

Six of the 2,682 transaction rows currently have no source URL. They remain
blank so that the public dataset does not invent provenance:

| Row IDs | Recipient | Donor | Years |
| --- | --- | --- | --- |
| 37971, 37973, 37975, 37977 | Center for Strategic and Budgetary Assessments | U.S. Department of Defense via Russia Strategic Initiative | 2020–2023 |
| 38390 | Hoover Institution | Saudi Aramco via Saudi Aramco Services Company | 2021 |
| 38593 | Middle East Institute | Japan External Trade Organization | 2022 |

All other rows are expected to carry an `http://` or `https://` citation.
Some citations use `web.archive.org` because the originally cited page is no
longer available at its first-party URL. URL presence does not prove that a
source is currently reachable. The integrity test locks both the exact
missing-ID set and the absence of browser-local URL schemes.

Please report a repaired or broken citation through a GitHub issue with the row
ID, a public source URL, and enough publication context for independent review.
