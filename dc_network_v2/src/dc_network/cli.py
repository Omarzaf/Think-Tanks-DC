from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import PipelineConfig
from .pipeline import Pipeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the DC Network V2 pipeline.")
    parser.add_argument("--config", default="configs/pipeline.json", help="Path to pipeline config JSON.")
    parser.add_argument("--run-id", help="Optional deterministic run identifier.")
    parser.add_argument("--since", type=int, help="Only include source records from this year onward.")
    parser.add_argument(
        "--source",
        action="append",
        choices=["all", "funding", "personnel"],
        help="Limit relationship sources. Repeatable. Defaults to all.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and summarize without writing outputs.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    config = PipelineConfig.from_file(Path(args.config))
    pipeline = Pipeline(
        config=config,
        run_id=args.run_id,
        since=args.since,
        sources=args.source,
        dry_run=args.dry_run,
    )
    result = pipeline.run()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
