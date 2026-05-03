from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import shutil
import time
from typing import Dict, Iterable

import pandas as pd

from .config import PipelineConfig
from .entities import (
    ALIAS_REQUIRED_COLUMNS,
    FUNDING_REQUIRED_COLUMNS,
    ORG_REQUIRED_COLUMNS,
    PERSONNEL_REQUIRED_COLUMNS,
    build_entities,
    load_aliases,
)
from .graph import build_graph, write_graphml
from .io import ensure_dir, read_csv, write_json
from .logging_utils import setup_logger
from .relations import build_edges_and_evidence
from .reporting import build_gap_analysis
from .scoring import score_entities
from .storage import write_duckdb, write_parquet_tables, write_staging_csv
from .validation import validate_tables


@dataclass
class RunManifest:
    run_id: str
    started_at: str
    dry_run: bool
    source_filter: list[str]
    since: int | None
    steps: list[dict[str, object]] = field(default_factory=list)
    outputs: Dict[str, str] = field(default_factory=dict)
    status: str = "running"


def default_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


class Pipeline:
    def __init__(
        self,
        config: PipelineConfig,
        run_id: str | None = None,
        since: int | None = None,
        sources: Iterable[str] | None = None,
        dry_run: bool = False,
    ) -> None:
        self.config = config
        self.run_id = run_id or default_run_id()
        self.since = since
        self.sources = sorted(set(sources or ["all"]))
        self.dry_run = dry_run
        self.logger = setup_logger(config.outputs["logs"])
        self.manifest = RunManifest(
            run_id=self.run_id,
            started_at=datetime.now(timezone.utc).isoformat(),
            dry_run=dry_run,
            source_filter=self.sources,
            since=since,
        )

    @contextmanager
    def step(self, name: str):
        started = time.perf_counter()
        self.logger.info("starting step=%s run_id=%s", name, self.run_id)
        try:
            yield
        except Exception:
            self.logger.exception("failed step=%s run_id=%s", name, self.run_id)
            raise
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            self.manifest.steps.append({"name": name, "duration_ms": duration_ms})
            self.logger.info("finished step=%s duration_ms=%s", name, duration_ms)

    def _load_inputs(self) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        organizations = read_csv(self.config.sources["organizations"], ORG_REQUIRED_COLUMNS)
        funding = read_csv(self.config.sources["funding"], FUNDING_REQUIRED_COLUMNS)
        personnel = read_csv(self.config.sources["personnel"], PERSONNEL_REQUIRED_COLUMNS)
        aliases = read_csv(self.config.sources["aliases"], ALIAS_REQUIRED_COLUMNS)

        active_sources = set(self.sources)
        if "all" not in active_sources:
            if "funding" not in active_sources:
                funding = funding.iloc[0:0].copy()
            if "personnel" not in active_sources:
                personnel = personnel.iloc[0:0].copy()

        if self.since is not None:
            funding = funding[pd.to_numeric(funding["year"], errors="coerce").fillna(0) >= self.since]
            personnel = personnel[
                pd.to_numeric(personnel["start_year"], errors="coerce").fillna(0) >= self.since
            ]

        return organizations, funding, personnel, aliases

    def _snapshot_raw(self) -> None:
        snapshot_dir = self.config.outputs["raw_snapshots"] / self.run_id
        ensure_dir(snapshot_dir)
        for name, source_path in self.config.sources.items():
            if source_path.exists():
                shutil.copy2(source_path, snapshot_dir / f"{name}{source_path.suffix}")

    def _write_manifest(self) -> None:
        manifest_path = self.config.outputs["manifests"] / f"{self.run_id}.json"
        write_json(manifest_path, self.manifest.__dict__)

    def run(self) -> dict[str, object]:
        with self.step("load_inputs"):
            organizations, funding, personnel, alias_frame = self._load_inputs()
            aliases = load_aliases(alias_frame)

        if not self.dry_run:
            with self.step("snapshot_raw"):
                self._snapshot_raw()

        with self.step("resolve_entities"):
            entities, name_to_entity_id = build_entities(
                organizations,
                funding,
                personnel,
                aliases,
                self.config.fuzzy_threshold,
            )

        with self.step("build_edges"):
            edges, evidence = build_edges_and_evidence(funding, personnel, name_to_entity_id)

        with self.step("score_entities"):
            scores = score_entities(entities, edges, self.config.scoring)

        with self.step("validate"):
            validation_report = validate_tables(
                entities,
                edges,
                evidence,
                scores,
                self.config.allowed_edge_types,
            )
            if validation_report["status"] != "passed":
                self.manifest.status = "failed"
                if not self.dry_run:
                    write_json(self.config.outputs["processed"] / "validation_report.json", validation_report)
                    self._write_manifest()
                raise SystemExit("Validation failed. See validation_report.json.")

        with self.step("build_reports"):
            gap_analysis = build_gap_analysis(scores, self.config.scoring)
            graph = build_graph(entities, edges)

        tables = {
            "entities": entities,
            "edges": edges,
            "evidence": evidence,
            "scores": scores,
        }
        outputs = {
            "processed_dir": str(self.config.outputs["processed"]),
            "duckdb": str(self.config.outputs["duckdb"]),
            "graphml": str(self.config.outputs["graphml"]),
            "validation_report": str(self.config.outputs["processed"] / "validation_report.json"),
            "gap_analysis": str(self.config.outputs["processed"] / "gap_analysis.json"),
        }

        if not self.dry_run:
            with self.step("write_outputs"):
                write_staging_csv(
                    {"entities": entities, "edges": edges, "evidence": evidence},
                    self.config.outputs["staging"],
                )
                write_parquet_tables(tables, self.config.outputs["processed"])
                write_duckdb(tables, self.config.outputs["duckdb"])
                write_graphml(graph, self.config.outputs["graphml"])
                write_json(self.config.outputs["processed"] / "validation_report.json", validation_report)
                write_json(self.config.outputs["processed"] / "gap_analysis.json", gap_analysis)

        self.manifest.outputs = outputs
        self.manifest.status = "passed"
        if not self.dry_run:
            self._write_manifest()

        return {
            "run_id": self.run_id,
            "status": self.manifest.status,
            "entity_count": len(entities),
            "edge_count": len(edges),
            "gap_count": len(gap_analysis),
            "outputs": outputs,
        }
