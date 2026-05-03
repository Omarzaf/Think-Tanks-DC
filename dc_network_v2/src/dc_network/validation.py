from __future__ import annotations

from typing import Iterable

import pandas as pd


def _check(name: str, passed: bool, detail: str) -> dict[str, object]:
    return {"name": name, "passed": bool(passed), "detail": detail}


def validate_tables(
    entities: pd.DataFrame,
    edges: pd.DataFrame,
    evidence: pd.DataFrame,
    scores: pd.DataFrame,
    allowed_edge_types: Iterable[str],
) -> dict[str, object]:
    checks: list[dict[str, object]] = []
    entity_ids = set(entities["entity_id"])
    evidence_ids = set(evidence["evidence_id"])
    allowed = set(allowed_edge_types)

    checks.append(
        _check(
            "unique_entity_ids",
            not entities["entity_id"].duplicated().any(),
            "Every entity_id must be unique.",
        )
    )
    checks.append(
        _check(
            "unique_edge_ids",
            not edges["edge_id"].duplicated().any(),
            "Every edge_id must be unique.",
        )
    )
    checks.append(
        _check(
            "edge_sources_exist",
            set(edges["source_entity_id"]).issubset(entity_ids),
            "Every edge source_entity_id must exist in entities.",
        )
    )
    checks.append(
        _check(
            "edge_targets_exist",
            set(edges["target_entity_id"]).issubset(entity_ids),
            "Every edge target_entity_id must exist in entities.",
        )
    )
    checks.append(
        _check(
            "allowed_edge_types",
            set(edges["edge_type"]).issubset(allowed),
            "Edges must use configured edge types only.",
        )
    )
    checks.append(
        _check(
            "evidence_ids_exist",
            set(edges["evidence_id"]).issubset(evidence_ids),
            "Every edge evidence_id must exist in evidence.",
        )
    )
    for column in ["influence_score", "coverage_score", "gap_score"]:
        checks.append(
            _check(
                f"{column}_range",
                scores[column].between(-1.0, 1.0).all(),
                f"{column} values must stay within expected score bounds.",
            )
        )

    passed = all(item["passed"] for item in checks)
    return {
        "status": "passed" if passed else "failed",
        "checks": checks,
        "entity_count": int(len(entities)),
        "edge_count": int(len(edges)),
        "evidence_count": int(len(evidence)),
    }
