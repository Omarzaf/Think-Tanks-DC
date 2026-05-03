from __future__ import annotations

import json
from pathlib import Path

import duckdb
import pandas as pd

from dc_network.config import PipelineConfig
from dc_network.entities import build_entities, load_aliases, normalize_name
from dc_network.pipeline import Pipeline
from dc_network.relations import build_edges_and_evidence


def test_alias_resolution_merges_known_variants() -> None:
    organizations = pd.DataFrame(
        [
            {
                "source_id": "org-1",
                "name": "Quincy Institute",
                "entity_type": "think_tank",
                "country": "USA",
                "ideology": "restraint",
                "transparency_score": 0.9,
                "annual_budget_usd": 1,
                "policy_focus": "foreign_policy",
            }
        ]
    )
    funding = pd.DataFrame(
        [
            {
                "source_id": "fund-1",
                "donor_name": "Open Philanthropy",
                "recipient_name": "Quincy Inst.",
                "amount_usd": 10,
                "year": 2024,
                "disclosure_level": "public",
                "evidence_url": "https://example.org",
                "evidence_quote": "Grant listed.",
            }
        ]
    )
    personnel = pd.DataFrame(columns=["source_id", "person_name", "from_org", "to_org", "role", "start_year", "end_year", "evidence_url"])
    aliases = load_aliases(pd.DataFrame([{"alias": "Quincy Inst.", "canonical_name": "Quincy Institute"}]))

    entities, mapping = build_entities(organizations, funding, personnel, aliases, fuzzy_threshold=0.92)

    quincy_rows = entities[entities["name"] == "Quincy Institute"]
    assert len(quincy_rows) == 1
    assert mapping[normalize_name("Quincy Inst.")] == quincy_rows.iloc[0]["entity_id"]


def test_edges_have_evidence_and_entity_references() -> None:
    organizations = pd.DataFrame(
        [
            {
                "source_id": "org-1",
                "name": "Think Tank A",
                "entity_type": "think_tank",
                "country": "USA",
                "ideology": "centrist",
                "transparency_score": 0.8,
                "annual_budget_usd": 100,
                "policy_focus": "security",
            },
            {
                "source_id": "org-2",
                "name": "Donor B",
                "entity_type": "donor",
                "country": "USA",
                "ideology": "philanthropy",
                "transparency_score": 0.7,
                "annual_budget_usd": 0,
                "policy_focus": "grantmaking",
            },
        ]
    )
    funding = pd.DataFrame(
        [
            {
                "source_id": "fund-1",
                "donor_name": "Donor B",
                "recipient_name": "Think Tank A",
                "amount_usd": 1000,
                "year": 2024,
                "disclosure_level": "public",
                "evidence_url": "https://example.org",
                "evidence_quote": "Disclosure.",
            }
        ]
    )
    personnel = pd.DataFrame(columns=["source_id", "person_name", "from_org", "to_org", "role", "start_year", "end_year", "evidence_url"])
    entities, mapping = build_entities(organizations, funding, personnel, {}, fuzzy_threshold=0.92)

    edges, evidence = build_edges_and_evidence(funding, personnel, mapping)

    assert set(edges["source_entity_id"]).issubset(set(entities["entity_id"]))
    assert set(edges["target_entity_id"]).issubset(set(entities["entity_id"]))
    assert set(edges["evidence_id"]).issubset(set(evidence["evidence_id"]))


def test_full_pipeline_writes_contract_outputs(tmp_path: Path) -> None:
    fixture_root = Path(__file__).resolve().parents[1]
    config_payload = json.loads((fixture_root / "configs" / "pipeline.json").read_text(encoding="utf-8"))
    config_payload["sources"] = {
        "organizations": str(fixture_root / "data" / "raw" / "sample_organizations.csv"),
        "funding": str(fixture_root / "data" / "raw" / "sample_funding.csv"),
        "personnel": str(fixture_root / "data" / "raw" / "sample_personnel.csv"),
        "aliases": str(fixture_root / "data" / "raw" / "alias_table.csv"),
    }
    config_payload["scoring_config"] = str(fixture_root / "configs" / "scoring.json")
    config_payload["outputs"] = {
        "raw_snapshots": str(tmp_path / "raw_snapshots"),
        "staging": str(tmp_path / "staging"),
        "processed": str(tmp_path / "processed"),
        "duckdb": str(tmp_path / "db" / "dc_network.duckdb"),
        "graphml": str(tmp_path / "graph" / "dc_network.graphml"),
        "logs": str(tmp_path / "logs" / "pipeline.log"),
        "manifests": str(tmp_path / "manifests"),
    }
    config_path = tmp_path / "pipeline.json"
    config_path.write_text(json.dumps(config_payload), encoding="utf-8")

    result = Pipeline(PipelineConfig.from_file(config_path), run_id="pytest-run").run()

    assert result["status"] == "passed"
    assert (tmp_path / "processed" / "entities.parquet").exists()
    assert (tmp_path / "processed" / "edges.parquet").exists()
    assert (tmp_path / "processed" / "validation_report.json").exists()
    assert (tmp_path / "processed" / "gap_analysis.json").exists()
    assert (tmp_path / "db" / "dc_network.duckdb").exists()
    assert (tmp_path / "graph" / "dc_network.graphml").exists()

    with duckdb.connect(str(tmp_path / "db" / "dc_network.duckdb")) as con:
        entity_count = con.execute("SELECT COUNT(*) FROM entities").fetchone()[0]
        edge_count = con.execute("SELECT COUNT(*) FROM edges").fetchone()[0]

    assert entity_count >= 7
    assert edge_count >= 5
