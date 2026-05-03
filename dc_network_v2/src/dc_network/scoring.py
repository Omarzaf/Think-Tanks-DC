from __future__ import annotations

from typing import Dict

import networkx as nx
import pandas as pd


def _weighted_pagerank(
    graph: nx.DiGraph,
    alpha: float = 0.85,
    max_iter: int = 100,
    tolerance: float = 1.0e-8,
) -> dict[str, float]:
    nodes = list(graph.nodes())
    node_count = len(nodes)
    if node_count == 0:
        return {}

    rank = {node: 1.0 / node_count for node in nodes}
    out_weight = {
        node: sum(float(data.get("weight", 1.0)) for _, _, data in graph.out_edges(node, data=True))
        for node in nodes
    }

    for _ in range(max_iter):
        next_rank = {node: (1.0 - alpha) / node_count for node in nodes}
        dangling_rank = sum(rank[node] for node in nodes if out_weight[node] <= 0.0)
        dangling_share = alpha * dangling_rank / node_count
        for node in nodes:
            next_rank[node] += dangling_share

        for source, target, data in graph.edges(data=True):
            total = out_weight[source]
            if total <= 0.0:
                continue
            next_rank[target] += alpha * rank[source] * float(data.get("weight", 1.0)) / total

        delta = sum(abs(next_rank[node] - rank[node]) for node in nodes)
        rank = next_rank
        if delta < tolerance:
            break

    return rank


def _normalize(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").fillna(0.0)
    maximum = numeric.max()
    if maximum <= 0:
        return numeric * 0.0
    return numeric / maximum


def score_entities(
    entities: pd.DataFrame,
    edges: pd.DataFrame,
    scoring_config: Dict[str, object],
) -> pd.DataFrame:
    graph = nx.DiGraph()
    for _, row in entities.iterrows():
        graph.add_node(row["entity_id"])
    for _, row in edges.iterrows():
        current = graph.get_edge_data(row["source_entity_id"], row["target_entity_id"], default={})
        graph.add_edge(
            row["source_entity_id"],
            row["target_entity_id"],
            weight=float(current.get("weight", 0.0)) + float(row["weight"]),
        )

    pagerank = _weighted_pagerank(graph)
    degree = nx.degree_centrality(graph) if graph.number_of_nodes() > 1 else {}

    funding_edges = edges[edges["edge_type"] == "funding"]
    incoming_funding = funding_edges.groupby("target_entity_id")["amount_usd"].sum()
    evidence_count = pd.concat(
        [edges["source_entity_id"], edges["target_entity_id"]], ignore_index=True
    ).value_counts()

    scores = entities[["entity_id", "name", "entity_type", "transparency_score"]].copy()
    scores["incoming_funding_usd"] = scores["entity_id"].map(incoming_funding).fillna(0.0)
    scores["network_pagerank"] = scores["entity_id"].map(pagerank).fillna(0.0)
    scores["personnel_degree"] = scores["entity_id"].map(degree).fillna(0.0)
    scores["evidence_count"] = scores["entity_id"].map(evidence_count).fillna(0).astype(int)

    influence_weights = scoring_config.get("influence_weights", {})
    coverage_weights = scoring_config.get("coverage_weights", {})

    scores["influence_score"] = (
        float(influence_weights.get("incoming_funding", 0.45)) * _normalize(scores["incoming_funding_usd"])
        + float(influence_weights.get("network_pagerank", 0.35)) * _normalize(scores["network_pagerank"])
        + float(influence_weights.get("personnel_degree", 0.20)) * _normalize(scores["personnel_degree"])
    ).clip(0.0, 1.0)
    scores["coverage_score"] = (
        float(coverage_weights.get("evidence_count", 0.55)) * _normalize(scores["evidence_count"])
        + float(coverage_weights.get("transparency_score", 0.45)) * _normalize(scores["transparency_score"])
    ).clip(0.0, 1.0)
    scores["gap_score"] = (scores["influence_score"] - scores["coverage_score"]).clip(-1.0, 1.0)

    return scores.sort_values("gap_score", ascending=False).reset_index(drop=True)
