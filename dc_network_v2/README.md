# DC Network V2

`dc_network_v2` is a stricter data pipeline for mapping Washington, D.C. think-tank influence networks from raw source records into validated analytical outputs.

It is designed as a separate package so it can live alongside the current dashboard without changing the existing frontend.

## What It Builds

- Raw source snapshots for every run
- Staging CSVs with normalized entities, edges, and evidence
- Processed Parquet tables
- A constrained DuckDB analytical database
- A true NetworkX GraphML export
- Validation and run-manifest JSON reports
- A ranked influence-versus-coverage gap analysis

## Directory Map

```text
dc_network_v2/
  configs/
    pipeline.json
    scoring.json
  data/
    raw/
      sample_organizations.csv
      sample_funding.csv
      sample_personnel.csv
      alias_table.csv
    staging/
    processed/
  db/
  graph/
  logs/
  manifests/
  src/dc_network/
  tests/
```

## Setup

```bash
cd dc_network_v2
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/pip install .
```

## Run The Pipeline

```bash
.venv/bin/python -m dc_network.cli --config configs/pipeline.json
```

Useful flags:

```bash
.venv/bin/python -m dc_network.cli --run-id demo-001
.venv/bin/python -m dc_network.cli --since 2020
.venv/bin/python -m dc_network.cli --source funding --source personnel
.venv/bin/python -m dc_network.cli --dry-run
```

## Expected Outputs

After a normal run, the package writes:

```text
data/raw/snapshots/<run-id>/*.csv
data/staging/entities.csv
data/staging/edges.csv
data/staging/evidence.csv
data/processed/entities.parquet
data/processed/edges.parquet
data/processed/evidence.parquet
data/processed/scores.parquet
data/processed/gap_analysis.json
data/processed/validation_report.json
db/dc_network.duckdb
graph/dc_network.graphml
logs/pipeline.log
manifests/<run-id>.json
```

## Sample DuckDB Queries

```sql
SELECT name, entity_type, influence_score, coverage_score, gap_score
FROM scores
ORDER BY gap_score DESC
LIMIT 10;
```

```sql
SELECT e.source_entity_id, e.target_entity_id, e.edge_type, e.weight, ev.evidence_url
FROM edges e
LEFT JOIN evidence ev ON e.evidence_id = ev.evidence_id
WHERE e.edge_type = 'funding'
ORDER BY e.weight DESC;
```

## Validation Rules

The validation suite checks:

- Required table columns
- Unique entity, edge, and evidence IDs
- Edge referential integrity
- Allowed edge types
- Score range sanity
- Evidence linkage coverage

Reports are written to `data/processed/validation_report.json`. A failed validation exits the CLI with a non-zero status.

## Tests

```bash
cd dc_network_v2
.venv/bin/python -m pytest
```

## Notes

The included CSV files are small sample inputs for proving the pipeline contract. Replace the files under `data/raw/` with real source exports while keeping the same column names, or update `configs/pipeline.json` to point at another raw-data location.
