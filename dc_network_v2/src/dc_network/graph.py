from __future__ import annotations

from pathlib import Path
from typing import Any

import networkx as nx
import pandas as pd


def _clean_attr(value: Any) -> str | int | float:
    if pd.isna(value):
        return ""
    if isinstance(value, (str, int, float)):
        return value
    return str(value)


def build_graph(entities: pd.DataFrame, edges: pd.DataFrame) -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    for _, row in entities.iterrows():
        graph.add_node(
            row["entity_id"],
            label=str(row["name"]),
            entity_type=str(row["entity_type"]),
            country=str(row["country"]),
            ideology=str(row["ideology"]),
            transparency_score=float(row["transparency_score"]),
        )
    for _, row in edges.iterrows():
        graph.add_edge(
            row["source_entity_id"],
            row["target_entity_id"],
            key=row["edge_id"],
            edge_id=row["edge_id"],
            edge_type=row["edge_type"],
            weight=float(row["weight"]),
            amount_usd=float(row["amount_usd"]),
            year=_clean_attr(row["year"]),
            evidence_id=row["evidence_id"],
        )
    return graph


def write_graphml(graph: nx.MultiDiGraph, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    nx.write_graphml(graph, path)
