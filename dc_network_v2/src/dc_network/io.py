from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

import pandas as pd


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_csv(path: Path, required_columns: set[str]) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing source file: {path}")
    frame = pd.read_csv(path)
    missing = required_columns.difference(frame.columns)
    if missing:
        missing_list = ", ".join(sorted(missing))
        raise ValueError(f"{path.name} is missing required columns: {missing_list}")
    return frame


def write_json(path: Path, payload: Dict[str, object] | list[object]) -> None:
    ensure_parent(path)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
