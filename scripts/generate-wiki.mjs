import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIKI_DIR = path.join(__dirname, "..", "content", "wiki");
const OUT_FILE = path.join(__dirname, "..", "app", "wiki", "data.json");

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const front = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();
  const meta = {};
  let currentKey = null;
  let currentList = null;
  for (const line of front.split("\n")) {
    if (currentList !== null) {
      if (line.trim().startsWith("- ")) {
        currentList.push(line.trim().slice(2));
        continue;
      } else {
        meta[currentKey] = currentList;
        currentList = null;
        currentKey = null;
      }
    }
    const sep = line.indexOf(":");
    if (sep !== -1) {
      const key = line.slice(0, sep).trim();
      let val = line.slice(sep + 1).trim();
      if (val === "") {
        currentKey = key;
        currentList = [];
        continue;
      }
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      meta[key] = val;
    }
  }
  if (currentList !== null && currentKey !== null) {
    meta[currentKey] = currentList;
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
    if (line.match(/^\|\s*$/)) {
      out.push("__TABLE_END__");
      continue;
    }
    const tMatch = line.match(/^\|(.+)\|$/);
    if (tMatch) {
      const cells = tMatch[1].split("|").map((c) => inlineMd(c.trim()));
      out.push(`<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`);
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
  let inTable = false;
  for (const item of out) {
    if (item.startsWith("<li>")) {
      if (!inUl) { final.push("<ul>"); inUl = true; }
      final.push(item);
    } else {
      if (inUl) { final.push("</ul>"); inUl = false; }
      if (item.startsWith("<tr>")) {
        if (!inTable) { final.push('<div class="overflow-x-auto"><table>'); inTable = true; }
        final.push(item);
      } else {
        if (inTable) { final.push("</table></div>"); inTable = false; }
        if (item === "__TABLE_END__") continue;
        if (item === "__PARA_BREAK__") continue;
        final.push(item);
      }
    }
  }
  if (inUl) final.push("</ul>");
  if (inTable) final.push("</table></div>");
  return final.join("\n");
}

function main() {
  if (!fs.existsSync(WIKI_DIR)) {
    console.log("No content/wiki directory found, skipping.");
    fs.writeFileSync(OUT_FILE, "[]", "utf-8");
    return;
  }
  const files = fs.readdirSync(WIKI_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  const pages = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(WIKI_DIR, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const title = meta.title || file.replace(/\.md$/, "");
    const updated = meta.updated || "";
    const tags = meta.tags || [];
    const slug = path.basename(file, ".md");
    const html = mdToHtml(body);
    pages.push({ slug, title, updated, tags, html });
  }
  pages.sort((a, b) => b.updated.localeCompare(a.updated));
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(pages, null, 2), "utf-8");
  console.log(`Generated ${pages.length} wiki page(s) → ${OUT_FILE}`);
}

main();
