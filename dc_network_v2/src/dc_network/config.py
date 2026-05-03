from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Dict, List


def _resolve_path(base_dir: Path, value: str) -> Path:
    path = Path(value).expanduser()
    if path.is_absolute():
        return path
    return (base_dir / path).resolve()


@dataclass(frozen=True)
class PipelineConfig:
    root: Path
    sources: Dict[str, Path]
    outputs: Dict[str, Path]
    fuzzy_threshold: float
    allowed_edge_types: List[str]
    scoring: Dict[str, object]

    @classmethod
    def from_file(cls, config_path: str | Path) -> "PipelineConfig":
        path = Path(config_path).expanduser().resolve()
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)

        config_dir = path.parent
        root = _resolve_path(config_dir, payload.get("root", "."))
        sources = {
            name: _resolve_path(config_dir, source_path)
            for name, source_path in payload.get("sources", {}).items()
        }
        outputs = {
            name: _resolve_path(config_dir, output_path)
            for name, output_path in payload.get("outputs", {}).items()
        }

        scoring_ref = payload.get("scoring_config")
        if scoring_ref:
            scoring_path = _resolve_path(config_dir, scoring_ref)
            with scoring_path.open("r", encoding="utf-8") as handle:
                scoring = json.load(handle)
        else:
            scoring = {}

        entity_resolution = payload.get("entity_resolution", {})
        edge_rules = payload.get("edge_rules", {})

        return cls(
            root=root,
            sources=sources,
            outputs=outputs,
            fuzzy_threshold=float(entity_resolution.get("fuzzy_threshold", 0.92)),
            allowed_edge_types=list(edge_rules.get("allowed_edge_types", [])),
            scoring=scoring,
        )
