from __future__ import annotations

import hashlib
from typing import Dict

import pandas as pd

from .entities import normalize_name


def _edge_id(*parts: object) -> str:
    text = "|".join("" if pd.isna(part) else str(part) for part in parts)
    return "edge-" + hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


def _evidence_id(source_id: object) -> str:
    return "ev-" + hashlib.sha1(str(source_id).encode("utf-8")).hexdigest()[:16]


def _coerce_int(value: object) -> int | None:
    try:
        if pd.isna(value) or value == "":
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _coerce_float(value: object) -> float:
    try:
        if pd.isna(value):
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def build_edges_and_evidence(
    funding: pd.DataFrame,
    personnel: pd.DataFrame,
    name_to_entity_id: Dict[str, str],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    edge_records: list[dict[str, object]] = []
    evidence_records: list[dict[str, object]] = []

    for _, row in funding.fillna("").iterrows():
        source_entity_id = name_to_entity_id.get(normalize_name(row["donor_name"]), "")
        target_entity_id = name_to_entity_id.get(normalize_name(row["recipient_name"]), "")
        evidence_id = _evidence_id(row["source_id"])
        edge_records.append(
            {
                "edge_id": _edge_id(row["source_id"], source_entity_id, target_entity_id, "funding"),
                "source_entity_id": source_entity_id,
                "target_entity_id": target_entity_id,
                "edge_type": "funding",
                "weight": _coerce_float(row["amount_usd"]),
                "amount_usd": _coerce_float(row["amount_usd"]),
                "year": _coerce_int(row["year"]),
                "source_record_id": str(row["source_id"]),
                "evidence_id": evidence_id,
            }
        )
        evidence_records.append(
            {
                "evidence_id": evidence_id,
                "source_record_id": str(row["source_id"]),
                "evidence_type": "funding_disclosure",
                "evidence_url": str(row["evidence_url"]),
                "evidence_quote": str(row["evidence_quote"]),
                "disclosure_level": str(row["disclosure_level"]),
            }
        )

    for _, row in personnel.fillna("").iterrows():
        source_entity_id = name_to_entity_id.get(normalize_name(row["from_org"]), "")
        target_entity_id = name_to_entity_id.get(normalize_name(row["to_org"]), "")
        evidence_id = _evidence_id(row["source_id"])
        edge_records.append(
            {
                "edge_id": _edge_id(row["source_id"], source_entity_id, target_entity_id, "personnel_transition"),
                "source_entity_id": source_entity_id,
                "target_entity_id": target_entity_id,
                "edge_type": "personnel_transition",
                "weight": 1.0,
                "amount_usd": 0.0,
                "year": _coerce_int(row["start_year"]),
                "source_record_id": str(row["source_id"]),
                "evidence_id": evidence_id,
            }
        )
        evidence_records.append(
            {
                "evidence_id": evidence_id,
                "source_record_id": str(row["source_id"]),
                "evidence_type": "personnel_transition",
                "evidence_url": str(row["evidence_url"]),
                "evidence_quote": f"{row['person_name']} moved from {row['from_org']} to {row['to_org']} as {row['role']}.",
                "disclosure_level": "public",
            }
        )

    edges = pd.DataFrame(edge_records)
    evidence = pd.DataFrame(evidence_records).drop_duplicates("evidence_id")
    return edges.reset_index(drop=True), evidence.reset_index(drop=True)
