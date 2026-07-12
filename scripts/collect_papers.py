import argparse
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

API = "https://export.arxiv.org/api/query"
OUTPUT = Path(__file__).resolve().parent.parent / "public/data/papers.json"
ATOM = {"atom": "http://www.w3.org/2005/Atom"}


def clean(text):
    return " ".join((text or "").split())


def fetch(query, limit):
    params = urlencode({
        "search_query": query,
        "start": 0,
        "max_results": limit,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    })
    request = Request(f"{API}?{params}", headers={"User-Agent": "student-agent-course/1.0"})
    with urlopen(request, timeout=20) as response:
        root = ET.fromstring(response.read())

    papers = []
    for entry in root.findall("atom:entry", ATOM):
        raw_id = clean(entry.findtext("atom:id", namespaces=ATOM))
        paper_id = raw_id.rsplit("/", 1)[-1]
        papers.append({
            "id": paper_id,
            "title": clean(entry.findtext("atom:title", namespaces=ATOM)),
            "authors": [clean(a.findtext("atom:name", namespaces=ATOM))
                        for a in entry.findall("atom:author", ATOM)],
            "published": clean(entry.findtext("atom:published", namespaces=ATOM))[:10],
            "summary": clean(entry.findtext("atom:summary", namespaces=ATOM)),
            "url": raw_id,
            "source": "arXiv",
        })
    return papers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", default='all:"AI agent"')
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()

    old = []
    if OUTPUT.exists():
        old = json.loads(OUTPUT.read_text(encoding="utf-8"))

    fetched = fetch(args.query, args.limit)
    by_id = {paper["id"]: paper for paper in old}
    before = len(by_id)
    for paper in fetched:
        by_id[paper["id"]] = paper

    result = sorted(by_id.values(), key=lambda p: p["published"], reverse=True)[:50]
    if result != old:
        OUTPUT.parent.mkdir(exist_ok=True)
        OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"fetched": len(fetched), "new": len(by_id) - before,
                      "saved": len(result), "query": args.query}, ensure_ascii=False))


if __name__ == "__main__":
    main()
