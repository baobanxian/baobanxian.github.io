import json
from pathlib import Path
from urllib.parse import urlparse

DATA = Path(__file__).resolve().parent.parent / "public/data/papers.json"
papers = json.loads(DATA.read_text(encoding="utf-8"))
required = {"id", "title", "authors", "published", "summary", "url", "source"}
ids = set()

for index, paper in enumerate(papers):
    missing = required - paper.keys()
    assert not missing, f"paper {index} missing: {sorted(missing)}"
    assert paper["id"] not in ids, f'duplicate id: {paper["id"]}'
    assert urlparse(paper["url"]).scheme in ("http", "https"), f'invalid url: {paper["url"]}'
    ids.add(paper["id"])

print(f"PAPER CHECK PASSED: {len(papers)} papers")
