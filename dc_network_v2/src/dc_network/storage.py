from __future__ import annotations

from pathlib import Path
from typing import Dict

import duckdb
import pandas as pd


def write_parquet_tables(tables: Dict[str, pd.DataFrame], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, frame in tables.items():
        frame.to_parquet(output_dir / f"{name}.parquet", index=False)


def write_staging_csv(tables: Dict[str, pd.DataFrame], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, frame in tables.items():
        frame.to_csv(output_dir / f"{name}.csv", index=False)


def write_duckdb(tables: Dict[str, pd.DataFrame], db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    con = duckdb.connect(str(db_path))
    try:
        con.execute(
            """
            CREATE TABLE entities (
              entity_id VARCHAR PRIMARY KEY,
              name VARCHAR NOT NULL,
              entity_type VARCHAR NOT NULL,
              country VARCHAR,
              ideology VARCHAR,
              transparency_score DOUBLE,
              annual_budget_usd DOUBLE,
              policy_focus VARCHAR
            )
            """
        )
        con.execute(
            """
            CREATE TABLE evidence (
              evidence_id VARCHAR PRIMARY KEY,
              source_record_id VARCHAR NOT NULL,
              evidence_type VARCHAR NOT NULL,
              evidence_url VARCHAR,
              evidence_quote VARCHAR,
              disclosure_level VARCHAR
            )
            """
        )
        con.execute(
            """
            CREATE TABLE edges (
              edge_id VARCHAR PRIMARY KEY,
              source_entity_id VARCHAR NOT NULL,
              target_entity_id VARCHAR NOT NULL,
              edge_type VARCHAR NOT NULL,
              weight DOUBLE,
              amount_usd DOUBLE,
              year INTEGER,
              source_record_id VARCHAR NOT NULL,
              evidence_id VARCHAR NOT NULL,
              FOREIGN KEY(source_entity_id) REFERENCES entities(entity_id),
              FOREIGN KEY(target_entity_id) REFERENCES entities(entity_id),
              FOREIGN KEY(evidence_id) REFERENCES evidence(evidence_id)
            )
            """
        )
        con.execute(
            """
            CREATE TABLE scores (
              entity_id VARCHAR PRIMARY KEY,
              name VARCHAR NOT NULL,
              entity_type VARCHAR NOT NULL,
              transparency_score DOUBLE,
              incoming_funding_usd DOUBLE,
              network_pagerank DOUBLE,
              personnel_degree DOUBLE,
              evidence_count INTEGER,
              influence_score DOUBLE,
              coverage_score DOUBLE,
              gap_score DOUBLE,
              FOREIGN KEY(entity_id) REFERENCES entities(entity_id)
            )
            """
        )

        for name, frame in tables.items():
            con.register(f"{name}_df", frame)

        con.execute("INSERT INTO entities SELECT * FROM entities_df")
        con.execute("INSERT INTO evidence SELECT * FROM evidence_df")
        con.execute("INSERT INTO edges SELECT * FROM edges_df")
        con.execute("INSERT INTO scores SELECT * FROM scores_df")
    finally:
        con.close()
