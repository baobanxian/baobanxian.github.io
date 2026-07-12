import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, "..", "config", "feeds.json");
const DATA_FILE = path.join(__dirname, "..", "app", "data", "rss-items", "data.json");
const OUT_FILE = path.join(__dirname, "..", "public", "feed.xml");

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`✗ ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

console.log("Validating feeds configuration and data...\n");

// 1. Check config/feeds.json
if (!fs.existsSync(CONFIG_FILE)) {
  fail(`config/feeds.json not found`);
} else {
  pass(`config/feeds.json exists`);
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(raw);
    if (!Array.isArray(config.feeds)) {
      fail(`config.feeds is not an array`);
    } else {
      pass(`config.feeds has ${config.feeds.length} feed(s)`);
      for (const feed of config.feeds) {
        if (!feed.url || !feed.label) {
          fail(`Feed missing url or label: ${JSON.stringify(feed)}`);
        } else {
          pass(`"${feed.label}" — ${feed.url}`);
        }
      }
    }
  } catch (e) {
    fail(`Invalid JSON in config/feeds.json: ${e.message}`);
  }
}

// 2. Check data.json
if (!fs.existsSync(DATA_FILE)) {
  fail(`app/data/rss-items/data.json not found`);
} else {
  pass(`app/data/rss-items/data.json exists`);
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.feeds)) {
      fail(`data.feeds is not an array`);
    } else {
      pass(`data.json has ${data.feeds.length} feed result(s)`);
      for (const feed of data.feeds) {
        if (feed.reachable && !feed.validRss && !feed.validAtom) {
          fail(`"${feed.label}" is reachable but not valid RSS/Atom`);
        } else if (feed.reachable) {
          pass(`"${feed.label}" — ${feed.feedType}, ${feed.itemCount} items`);
        } else {
          warn(`"${feed.label}" — ${feed.error || "unreachable"} (transient)`);
        }
      }
    }
  } catch (e) {
    fail(`Invalid JSON in data.json: ${e.message}`);
  }
}

// 3. Validate feed.xml with xmllint
if (fs.existsSync(OUT_FILE)) {
  try {
    execSync(`xmllint --noout "${OUT_FILE}"`, { stdio: "pipe" });
    pass(`public/feed.xml — well-formed XML`);
  } catch (e) {
    fail(`public/feed.xml — XML validation failed: ${e.stderr?.toString() || e.message}`);
  }
} else {
  fail(`public/feed.xml not found`);
}

console.log(`\n${errors === 0 ? "✓ All validations passed" : `✗ ${errors} validation error(s)`}${warnings > 0 ? `, ${warnings} warning(s)` : ""}`);
process.exit(errors > 0 ? 1 : 0);
