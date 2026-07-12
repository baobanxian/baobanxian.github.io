import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, "..", "config", "feeds.json");
const OUT_DIR = path.join(__dirname, "..", "app", "subscribe");
const OUT_FILE = path.join(OUT_DIR, "data.json");

function parseXmlField(xml, tag, attr) {
  if (attr) {
    const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  }
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();
  const re = new RegExp(`<${tag}(?!\\w)[^>]*>([^<]*)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function parseXmlFields(xml, tag, attr) {
  const results = [];
  if (attr) {
    const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "gi");
    let m;
    while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  } else {
    const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*)\\]\\]><\\/${tag}>`, "gi");
    let m;
    while ((m = cdataRe.exec(xml)) !== null) results.push(m[1].trim());
    if (!results.length) {
      const re = new RegExp(`<${tag}(?!\\w)[^>]*>([^<]*)<\\/${tag}>`, "gi");
      while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
    }
  }
  return results;
}

async function fetchFeed(label, url) {
  const feed = { label, url, items: [], error: null };
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/xml, application/atom+xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) { feed.error = `HTTP ${response.status}`; return feed; }

    const text = await response.text();
    const lower = text.slice(0, 5000).toLowerCase();
    let items = [];

    if (lower.includes("<rss") && lower.includes("<channel")) {
      feed.feedType = "RSS 2.0";
      const itemRe = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRe.exec(text)) !== null) {
        const ix = m[1];
        items.push({
          title: parseXmlField(ix, "title"),
          link: parseXmlFields(ix, "link")[0] || null,
          pubDate: parseXmlField(ix, "pubDate") || parseXmlField(ix, "dc:date"),
          description: parseXmlField(ix, "description"),
        });
      }
    } else if (lower.includes("<feed") && lower.includes("<entry")) {
      feed.feedType = "Atom";
      const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
      let m;
      while ((m = entryRe.exec(text)) !== null) {
        const ix = m[1];
        items.push({
          title: parseXmlField(ix, "title"),
          link: parseXmlFields(ix, "link", "href")[0] || null,
          pubDate: parseXmlField(ix, "published") || parseXmlField(ix, "updated"),
          description: parseXmlField(ix, "summary") || parseXmlField(ix, "content"),
        });
      }
    } else {
      feed.error = "Not RSS/Atom";
      return feed;
    }

    feed.items = items;
  } catch (e) {
    feed.error = e.message || String(e);
  }
  return feed;
}

async function main() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log("config/feeds.json not found, skipping.");
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), feeds: [] }, null, 2), "utf-8");
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  const entries = (config.feeds || []).filter((f) => f.active !== false);
  const results = [];

  for (const { url, label } of entries) {
    console.log(`Fetching ${label}...`);
    const r = await fetchFeed(label, url);
    results.push(r);
    console.log(`  ${r.error ? `✗ ${r.error}` : `✓ ${r.items.length} items`}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const output = { fetchedAt: new Date().toISOString(), feeds: results };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Articles written to ${OUT_FILE}`);
}

main().catch(console.error);
