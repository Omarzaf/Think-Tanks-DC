from __future__ import annotations

from typing import Dict

import pandas as pd


def build_gap_analysis(scores: pd.DataFrame, scoring_config: Dict[str, object]) -> list[dict[str, object]]:
    threshold = float(scoring_config.get("gap_threshold", 0.05))
    ranked = scores[scores["gap_score"] >= threshold].sort_values("gap_score", ascending=False)
    return [
        {
            "entity_id": str(row["entity_id"]),
            "name": str(row["name"]),
            "entity_type": str(row["entity_type"]),
            "influence_score": round(float(row["influence_score"]), 4),
            "coverage_score": round(float(row["coverage_score"]), 4),
            "gap_score": round(float(row["gap_score"]), 4),
            "why_it_matters": (
                "High modeled influence with comparatively thin evidence coverage. "
                "Prioritize source collection, disclosure review, and relationship verification."
            ),
        }
        for _, row in ranked.iterrows()
    ]
