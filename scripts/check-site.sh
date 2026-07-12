#!/bin/bash
set -uo pipefail

ROOT="${1:-out}"
errors=0
log=""

log_msg() { log="${log}  $1\n"; }

check_file() {
  local path="$1" label="$2"
  if [ -f "$path" ]; then
    log_msg "ok   ${label}  →  $(realpath --relative-to="$ROOT" "$path" 2>/dev/null || echo "$path")"
    return 0
  else
    log_msg "FAIL  ${label}  →  MISSING: $path"
    return 1
  fi
}

resolve_path() {
  local href="$1"
  # strip fragment / query
  href="${href%%\#*}"
  href="${href%%\?*}"

  # external → skip
  case "$href" in
    http://*|https://*|mailto:*|ftp://*|//*) return 1 ;;
  esac

  # empty or #
  [ -z "$href" ] && return 1

  # strip trailing slash (except for root "/") then resolve
  if [ "$href" = "/" ]; then
    echo "$ROOT/index.html"
    return 0
  fi

  # remove trailing slash if present
  href="${href%/}"

  # convert /path → ROOT/path/index.html or ROOT/path.html
  local candidate
  candidate="$ROOT${href}/index.html"
  if [ -f "$candidate" ]; then
    echo "$candidate"
    return 0
  fi
  candidate="$ROOT${href}.html"
  if [ -f "$candidate" ]; then
    echo "$candidate"
    return 0
  fi
  candidate="$ROOT${href}"
  if [ -f "$candidate" ]; then
    echo "$candidate"
    return 0
  fi

  # also try with trailing slash (some links might have it baked in)
  candidate="$ROOT${href}/index.html"
  if [ -f "$candidate" ]; then
    echo "$candidate"
    return 0
  fi

  echo ""
  return 1
}

check_essential_pages() {
  local pages=(
    "$ROOT/index.html"
    "$ROOT/about/index.html"
    "$ROOT/blog/index.html"
    "$ROOT/subscribe/index.html"
    "$ROOT/papers/index.html"
    "$ROOT/wiki/index.html"
    "$ROOT/blog/my-first-website/index.html"
    "$ROOT/feed.xml"
    "$ROOT/404.html"
  )

  log_msg "--- Essential pages ---"
  local ok=0
  for p in "${pages[@]}"; do
    check_file "$p" "page  $(basename "$(dirname "$p")" 2>/dev/null || echo root)"
  done
  echo ""
}

check_internal_links() {
  log_msg "--- Internal links across all HTML pages ---"
  local tmp
  tmp=$(mktemp)

  # collect all <a href="..."> from all HTML files in ROOT
  find "$ROOT" -name '*.html' -maxdepth 5 \
    | while IFS= read -r html; do
        # extract href values from <a tags
        perl -ne 'while (/<a\s[^>]*?href\s*=\s*"([^"]+)"/gi) { print "$1\n" }' "$html" \
          | while IFS= read -r href; do
              local rel
              rel=$(realpath --relative-to="$ROOT" "$html" 2>/dev/null || echo "$html")
              echo "$rel|$href"
            done
      done > "$tmp"

  local ok=0
  while IFS='|' read -r src href; do
    # skip external / protocol links
    case "$href" in
      http://*|https://*|mailto:*|ftp://*|//*|\#*) continue ;;
    esac
    [ -z "$href" ] && continue

    local resolved
    resolved=$(resolve_path "$href") || true
    if [ -n "$resolved" ] && [ -f "$resolved" ]; then
      :
    else
      log_msg "FAIL  ${src}  →  broken link: \"$href\""
      ok=1
    fi
  done < "$tmp"

  rm -f "$tmp"
  [ "$ok" -eq 0 ] && log_msg "All internal links resolve."
  echo ""
  return $ok
}

check_rss_feed() {
  log_msg "--- RSS feed validation ---"
  local feed="$ROOT/feed.xml"
  local ok=0

  # 1) file exists
  check_file "$feed" "RSS feed" || { echo ""; return 1; }

  # 2) well-formed XML: has <rss> root and <channel>
  if grep -q '<rss' "$feed" 2>/dev/null && grep -q '<channel>' "$feed" 2>/dev/null; then
    log_msg "ok   RSS has <rss> + <channel>"
  else
    log_msg "FAIL  RSS missing <rss>/<channel>"
    ok=1
  fi

  # 3) has <title>
  if grep -q '<title>' "$feed" 2>/dev/null; then
    log_msg "ok   RSS has <title>"
  else
    log_msg "FAIL  RSS missing <title>"
    ok=1
  fi

  # 4) has at least one <item>
  if grep -q '<item>' "$feed" 2>/dev/null; then
    log_msg "ok   RSS has <item>"
  else
    log_msg "FAIL  RSS missing <item>"
    ok=1
  fi

  # 5) item has <link>
  if grep -q '<link>' "$feed" 2>/dev/null; then
    log_msg "ok   RSS has <link>"
  else
    log_msg "FAIL  RSS missing <link>"
    ok=1
  fi

  # 6) internal links in RSS resolve
  local rss_ok=0
  while IFS= read -r link; do
    case "$link" in
      https://baobanxian.com/*|http://baobanxian.com/*)
        local path
        path=$(echo "$link" | sed -E 's|https?://baobanxian\.com||')
        local resolved
        resolved=$(resolve_path "$path") || true
        if [ -z "$resolved" ] || [ ! -f "$resolved" ]; then
          log_msg "FAIL  RSS feed link broken: $link"
          rss_ok=1
        else
          log_msg "ok   RSS feed link: $link"
        fi
        ;;
      *)
        log_msg "skip  external RSS link: $link"
        ;;
    esac
  done < <(perl -ne 'while (/<link>([^<]+)<\/link>/g) { print "$1\n" }' "$feed")
  [ "$rss_ok" -ne 0 ] && ok=1

  echo ""
  return $ok
}

# ---------- main ----------
log_msg "============================================"
log_msg " Check: Site Health"
log_msg " Root:  $ROOT"
log_msg " Date:  $(date '+%Y-%m-%d %H:%M:%S')"
log_msg "============================================"
echo ""

check_essential_pages || errors=1
check_internal_links || errors=1
check_rss_feed || errors=1

log_msg "============================================"
if [ "$errors" -eq 0 ]; then
  log_msg " RESULT: ALL CHECKS PASSED"
else
  log_msg " RESULT: SOME CHECKS FAILED (exit 1)"
fi
log_msg "============================================"

echo -e "$log"
exit "$errors"
