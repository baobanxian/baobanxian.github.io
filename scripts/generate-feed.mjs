import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POSTS_DIR = path.join(__dirname, "..", "content", "posts");
const OUT_FILE = path.join(__dirname, "..", "public", "feed.xml");
const SITE_URL = process.env.SITE_URL || "https://baobanxian.com";

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const front = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();
  const meta = {};
  for (const line of front.split("\n")) {
    const sep = line.indexOf(":");
    if (sep !== -1) {
      const key = line.slice(0, sep).trim();
      let val = line.slice(sep + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      meta[key] = val;
    }
  }
  return { meta, body };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineMd(s) {
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let inCodeBlock = false;
  let codeBuf = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBuf.push(line);
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      out.push(`<h${hMatch[1].length}>${inlineMd(hMatch[2])}</h${hMatch[1].length}>`);
      continue;
    }

    if (line.match(/^-\s+/)) {
      out.push(`<li>${inlineMd(line.replace(/^-\s+/, ""))}</li>`);
      continue;
    }

    if (line.trim() === "") {
      out.push("__PARA_BREAK__");
      continue;
    }

    out.push(`<p>${inlineMd(line)}</p>`);
  }

  if (inCodeBlock && codeBuf.length) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }

  const final = [];
  let inUl = false;
  for (const item of out) {
    if (item.startsWith("<li>")) {
      if (!inUl) { final.push("<ul>"); inUl = true; }
      final.push(item);
    } else {
      if (inUl) { final.push("</ul>"); inUl = false; }
      if (item === "__PARA_BREAK__") continue;
      final.push(item);
    }
  }
  if (inUl) final.push("</ul>");

  return final.join("\n");
}

function toRfc2822(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(posts) {
  const items = posts
    .map((p) => {
      const link = `${SITE_URL}/blog/${p.slug}`;
      return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRfc2822(p.date)}</pubDate>
      <description><![CDATA[${p.html}]]></description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>张方宇 - 博客</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>张方宇的个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${toRfc2822(new Date().toISOString())}</lastBuildDate>
    <atom:link href="${escapeXml(SITE_URL)}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

function validateXml(filePath) {
  try {
    execSync(`xmllint --noout "${filePath}"`, { stdio: "pipe" });
    return true;
  } catch (e) {
    console.error("XML validation failed:", e.stderr?.toString() || e.message);
    return false;
  }
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("No content/posts directory found, skipping RSS generation.");
    fs.writeFileSync(OUT_FILE, "", "utf-8");
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const title = meta.title || file.replace(/\.md$/, "");
    const date = meta.date || "";
    const slug = path.basename(file, ".md");
    const html = mdToHtml(body);

    posts.push({ slug, title, date, html });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));

  const rss = buildRss(posts);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, rss, "utf-8");

  if (!validateXml(OUT_FILE)) {
    console.error("RSS feed XML validation FAILED — removing invalid file");
    fs.unlinkSync(OUT_FILE);
    process.exit(1);
  }

  console.log(`Generated RSS feed with ${posts.length} item(s) → ${OUT_FILE}`);
}

main();