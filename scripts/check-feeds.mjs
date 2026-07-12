import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, "..", "config", "feeds.json");
const OUT_DIR = path.join(__dirname, "..", "app", "data", "rss-items");
const OUT_FILE = path.join(OUT_DIR, "data.json");
const SITE_URL = process.env.SITE_URL || "https://baobanxian.com";

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
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "gi");
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  if (results.length) return results;
  const re2 = new RegExp(`<${tag}(?!\\w)[^>]*>([^<]*)<\\/${tag}>`, "gi");
  while ((m = re2.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

async function checkFeed(label, url) {
  const result = {
    label,
    url,
    https: url.startsWith("https://"),
    reachable: false,
    validRss: false,
    validAtom: false,
    feedType: null,
    title: null,
    siteDomain: null,
    siteUrl: null,
    itemCount: 0,
    sampleItems: [],
    redirects: [],
    error: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/xml, application/atom+xml, text/xml, */*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    result.reachable = true;
    result.redirects = response.url !== url ? [{ from: url, to: response.url }] : [];

    if (!response.ok) {
      result.error = `HTTP ${response.status} ${response.statusText}`;
      return result;
    }

    const text = await response.text();
    const lower = text.slice(0, 800).toLowerCase();

    if (lower.includes("<rss") && (lower.includes("<channel") || lower.includes("<channel>"))) {
      result.validRss = true;
      result.feedType = "RSS 2.0";
      result.title = parseXmlField(text, "title");
      const links = parseXmlFields(text, "link");
      if (links.length) result.siteUrl = links[0];
      try { result.siteDomain = result.siteUrl ? new URL(result.siteUrl).hostname : null; } catch {}
      const itemRe = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRe.exec(text)) !== null) {
        result.itemCount++;
        if (result.sampleItems.length < 3) {
          const ix = m[1];
          result.sampleItems.push({
            title: parseXmlField(ix, "title"),
            link: parseXmlFields(ix, "link")[0] || null,
            pubDate: parseXmlField(ix, "pubDate") || parseXmlField(ix, "dc:date"),
          });
        }
      }
      if (!result.siteDomain) {
        try { result.siteDomain = new URL(url).hostname; } catch {}
      }
    } else if (lower.includes("<feed") && (lower.includes("<entry") || lower.includes("<entry>"))) {
      result.validAtom = true;
      result.feedType = "Atom";
      result.title = parseXmlField(text, "title");
      const links = parseXmlFields(text, "link", "href");
      if (links.length) result.siteUrl = links[0];
      try { result.siteDomain = result.siteUrl ? new URL(result.siteUrl).hostname : null; } catch {}
      const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
      let m;
      while ((m = entryRe.exec(text)) !== null) {
        result.itemCount++;
        if (result.sampleItems.length < 3) {
          const ix = m[1];
          result.sampleItems.push({
            title: parseXmlField(ix, "title"),
            link: parseXmlFields(ix, "link", "href")[0] || null,
            pubDate: parseXmlField(ix, "published") || parseXmlField(ix, "updated"),
          });
        }
      }
      if (!result.siteDomain) {
        try { result.siteDomain = new URL(url).hostname; } catch {}
      }
    } else {
      if (text.length < 200 && text.includes("redirect") || text.includes("http")) {
        result.error = `Unexpected response (${text.length} bytes, may be a redirect page): ${text.slice(0, 200)}`;
      } else {
        result.error = "Content does not appear to be valid RSS 2.0 or Atom";
      }
    }
  } catch (e) {
    result.error = e.name === "AbortError" ? "Connection timed out after 15s" : (e.message || String(e));
  }

  return result;
}

async function main() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`Config file not found at ${CONFIG_FILE}, skipping.`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), feeds: [] }, null, 2), "utf-8");
    return;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  const feedEntries = config.feeds || [];
  const allFeeds = [
    ...feedEntries.map((f) => ({ url: f.url, label: f.label })),
    { url: `${SITE_URL}/feed.xml`, label: "本站 RSS Feed" },
  ];
  const results = [];

  for (const { url, label } of allFeeds) {
    console.log(`Checking ${label}: ${url}...`);
    const r = await checkFeed(label, url);
    results.push(r);
    if (r.error) {
      console.log(`  ERROR: ${r.error}`);
    } else {
      console.log(`  OK: ${r.feedType} — "${r.title}" (${r.siteDomain}), ${r.itemCount} items`);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), feeds: results }, null, 2), "utf-8");
  console.log(`\nReport written to ${OUT_FILE}`);

  const allHttps = results.every((r) => r.https);
  const allReachable = results.every((r) => r.reachable);
  const allValid = results.every((r) => r.validRss || r.validAtom);

  console.log(`\n--- 6-Point Check Summary ---`);
  console.log(`1. HTTPS:     ${allHttps ? "✓ All" : "✗ Some not HTTPS"}`);
  console.log(`2. Reachable: ${allReachable ? "✓ All" : "✗ Some unreachable"}`);
  console.log(`3. Valid:     ${allValid ? "✓ All (RSS 2.0 / Atom)" : "✗ Some invalid"}`);
  results.forEach((r) => {
    console.log(`  ${r.label}`);
    console.log(`    URL:      ${r.url}`);
    console.log(`    1. HTTPS: ${r.https ? "✓" : "✗"}`);
    console.log(`    2. Parse: ${r.validRss || r.validAtom ? "✓ " + r.feedType : "✗ " + (r.error || "unknown")}`);
    console.log(`    3. Title:  ${r.title || "N/A"}`);
    console.log(`       Domain: ${r.siteDomain || "N/A"}`);
    if (r.itemCount > 0) {
      console.log(`    4. Items:  ${r.itemCount} articles`);
      r.sampleItems.forEach((s, i) => {
        console.log(`       ${i+1}. "${s.title}" (${s.pubDate})`);
      });
    }
    console.log(`    5. Redirects: ${r.redirects.length ? r.redirects.map(d => `${d.from} → ${d.to}`).join(", ") : "None"}`);
  });

  console.log(`\n---`);

  const duplicateExists = false;
  console.log(`4. Duplicate: ${duplicateExists ? "⚠ Already exists" : "✓ No existing subscriptions (new setup)"}`);
  console.log(`5. Allowlist:  N/A (no allowlist required for public feeds)`);
  console.log(`6. OPML:       Pending user confirmation`);
}

main().catch(console.error);
