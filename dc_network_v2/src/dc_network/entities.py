from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
import hashlib
import re
from typing import Dict, Iterable, Tuple

import pandas as pd


ORG_REQUIRED_COLUMNS = {
    "source_id",
    "name",
    "entity_type",
    "country",
    "ideology",
    "transparency_score",
    "annual_budget_usd",
    "policy_focus",
}
FUNDING_REQUIRED_COLUMNS = {
    "source_id",
    "donor_name",
    "recipient_name",
    "amount_usd",
    "year",
    "disclosure_level",
    "evidence_url",
    "evidence_quote",
}
PERSONNEL_REQUIRED_COLUMNS = {
    "source_id",
    "person_name",
    "from_org",
    "to_org",
    "role",
    "start_year",
    "end_year",
    "evidence_url",
}
ALIAS_REQUIRED_COLUMNS = {"alias", "canonical_name"}


def normalize_name(value: object) -> str:
    text = "" if pd.isna(value) else str(value)
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def stable_id(prefix: str, value: str) -> str:
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:12]
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:32]
    return f"{prefix}-{slug}-{digest}"


def load_aliases(alias_frame: pd.DataFrame) -> Dict[str, str]:
    aliases: Dict[str, str] = {}
    for _, row in alias_frame.fillna("").iterrows():
        alias = normalize_name(row["alias"])
        canonical = str(row["canonical_name"]).strip()
        if alias and canonical:
            aliases[alias] = canonical
    return aliases


@dataclass
class EntityResolver:
    aliases: Dict[str, str]
    fuzzy_threshold: float
    canonical_names: list[str] = field(default_factory=list)

    def resolve(self, raw_name: object) -> str:
        candidate = "" if pd.isna(raw_name) else str(raw_name).strip()
        if not candidate:
            return ""

        normalized = normalize_name(candidate)
        if normalized in self.aliases:
            candidate = self.aliases[normalized]
            normalized = normalize_name(candidate)

        for existing in self.canonical_names:
            similarity = SequenceMatcher(None, normalize_name(existing), normalized).ratio()
            if similarity >= self.fuzzy_threshold:
                return existing

        self.canonical_names.append(candidate)
        return candidate


def _coerce_float(value: object, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _source_names(funding: pd.DataFrame, personnel: pd.DataFrame) -> Iterable[Tuple[str, str]]:
    for _, row in funding.iterrows():
        yield str(row["donor_name"]), "donor"
        yield str(row["recipient_name"]), "think_tank"
    for _, row in personnel.iterrows():
        yield str(row["from_org"]), "organization"
        yield str(row["to_org"]), "organization"


def build_entities(
    organizations: pd.DataFrame,
    funding: pd.DataFrame,
    personnel: pd.DataFrame,
    aliases: Dict[str, str],
    fuzzy_threshold: float,
) -> tuple[pd.DataFrame, Dict[str, str]]:
    resolver = EntityResolver(aliases=aliases, fuzzy_threshold=fuzzy_threshold)
    records: Dict[str, Dict[str, object]] = {}
    name_to_entity_id: Dict[str, str] = {}

    for _, row in organizations.fillna("").iterrows():
        canonical = resolver.resolve(row["name"])
        entity_id = stable_id("ent", normalize_name(canonical))
        records[canonical] = {
            "entity_id": entity_id,
            "name": canonical,
            "entity_type": str(row["entity_type"]).strip() or "organization",
            "country": str(row["country"]).strip(),
            "ideology": str(row["ideology"]).strip(),
            "transparency_score": _coerce_float(row["transparency_score"]),
            "annual_budget_usd": _coerce_float(row["annual_budget_usd"]),
            "policy_focus": str(row["policy_focus"]).strip(),
        }
        name_to_entity_id[normalize_name(row["name"])] = entity_id
        name_to_entity_id[normalize_name(canonical)] = entity_id

    for raw_name, fallback_type in _source_names(funding.fillna(""), personnel.fillna("")):
        canonical = resolver.resolve(raw_name)
        if not canonical:
            continue
        entity_id = stable_id("ent", normalize_name(canonical))
        if canonical not in records:
            records[canonical] = {
                "entity_id": entity_id,
                "name": canonical,
                "entity_type": fallback_type,
                "country": "",
                "ideology": "",
                "transparency_score": 0.0,
                "annual_budget_usd": 0.0,
                "policy_focus": "",
            }
        name_to_entity_id[normalize_name(raw_name)] = entity_id
        name_to_entity_id[normalize_name(canonical)] = entity_id

    frame = pd.DataFrame(records.values()).sort_values("name").reset_index(drop=True)
    return frame, name_to_entity_id
