#!/usr/bin/env python3
"""Convert recipe .md files to data/dishes.json.

Source: /Users/suunto/Documents/饮食菜品库/  (8 files, one per category)
Output: /Users/suunto/recipe-app/data/dishes.json

Each .md file's first non-empty line is the category header; remaining lines
are dish names. For this dataset, the file name itself encodes the category, so
we ignore the in-file header and use the file name.

The output JSON has the shape:
    {
      "version": 2,
      "categories": { "中式早餐蛋白": [...], ... },
      "recipes":    { "水煮蛋": "鸡蛋冷水下锅...", ... }
    }

`recipes` is keyed by dish name (deduplicated across categories) and contains
a brief (≤100 Chinese-character) cooking instruction for each dish. Recipe
generation is handled by recipe_templates.generate_recipe.
"""
import json
import sys
from pathlib import Path

# Allow running this file as a script (`python3 scripts/sync_dishes.py`).
sys.path.insert(0, str(Path(__file__).resolve().parent))

from recipe_templates import generate_recipe  # noqa: E402

SOURCE_DIR = Path("/Users/suunto/Documents/饮食菜品库")
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "dishes.json"
OUTPUT_VERSION = 2

# Mapping: source filename (without .md) -> output key in dishes.json
# Both happen to be identical for this dataset, but we keep the mapping for
# future-proofing.
CATEGORY_MAP = {
    "中式早餐蛋白": "中式早餐蛋白",
    "中式早餐碳水": "中式早餐碳水",
    "中式正餐蛋白": "中式正餐蛋白",
    "中式正餐碳水": "中式正餐碳水",
    "西式早餐蛋白": "西式早餐蛋白",
    "西式早餐碳水": "西式早餐碳水",
    "西式正餐蛋白": "西式正餐蛋白",
    "西式正餐碳水": "西式正餐碳水",
}


def parse_md(path: Path) -> list[str]:
    """Return deduplicated, stripped, non-empty lines from a .md file."""
    text = path.read_text(encoding="utf-8")
    seen: set[str] = set()
    result: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if s in seen:
            continue
        seen.add(s)
        result.append(s)
    return result


def main() -> int:
    if not SOURCE_DIR.is_dir():
        print(f"ERROR: source dir not found: {SOURCE_DIR}", file=sys.stderr)
        return 1

    categories: dict[str, list[str]] = {}
    all_dishes: set[str] = set()
    for src_name, out_key in CATEGORY_MAP.items():
        src_path = SOURCE_DIR / f"{src_name}.md"
        if not src_path.is_file():
            print(f"ERROR: missing source file: {src_path}", file=sys.stderr)
            return 1
        dishes = parse_md(src_path)
        categories[out_key] = dishes
        all_dishes.update(dishes)

    # Generate one recipe per unique dish name. Sort keys for a stable diff.
    recipes: dict[str, str] = {name: generate_recipe(name) for name in sorted(all_dishes)}

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "version": OUTPUT_VERSION,
        "categories": categories,
        "recipes": recipes,
    }
    OUTPUT_FILE.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total = sum(len(v) for v in categories.values())
    print(f"OK: {len(categories)} categories, {total} dishes total, {len(recipes)} unique recipes")
    for k, v in categories.items():
        print(f"  {k}: {len(v)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
