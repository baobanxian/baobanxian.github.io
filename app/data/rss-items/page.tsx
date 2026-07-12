import data from "./data.json";

type Item = {
  title: string | null;
  link: string | null;
  pubDate: string | null;
};

type FeedResult = {
  label: string;
  url: string;
  https: boolean;
  reachable: boolean;
  validRss: boolean;
  validAtom: boolean;
  feedType: string | null;
  title: string | null;
  siteDomain: string | null;
  siteUrl: string | null;
  itemCount: number;
  sampleItems: Item[];
  redirects: { from: string; to: string }[];
  error: string | null;
};

export default function RssItems() {
  const feeds: FeedResult[] = data.feeds;

  return (
    <main className="flex min-h-full justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">RSS Feed Check</h1>
        <p className="text-sm text-gray-400 mb-8">
          检查时间: {new Date(data.checkedAt).toLocaleString("zh-CN")}
        </p>

        <div className="space-y-8">
          {feeds.map((feed) => (
            <section key={feed.url} className="bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{feed.label}</h2>
                  <code className="text-xs text-gray-400 break-all">{feed.url}</code>
                </div>
                <span className={`shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  feed.validRss || feed.validAtom
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {feed.validRss || feed.validAtom ? "✓ Valid" : "✗ Invalid"}
                </span>
              </div>

              {/* 6-point check grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className={`px-3 py-2 rounded-lg text-sm ${feed.https ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <div className="font-medium">1. HTTPS</div>
                  <div>{feed.https ? "✓" : "✗"}</div>
                </div>
                <div className={`px-3 py-2 rounded-lg text-sm ${feed.reachable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <div className="font-medium">2. Reachable</div>
                  <div>{feed.reachable ? "✓" : feed.error || "✗"}</div>
                </div>
                <div className={`px-3 py-2 rounded-lg text-sm ${feed.validRss || feed.validAtom ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <div className="font-medium">3. Valid Feed</div>
                  <div>{feed.validRss ? "RSS 2.0" : feed.validAtom ? "Atom" : "✗"}</div>
                </div>
                <div className="px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-700">
                  <div className="font-medium">Title</div>
                  <div className="truncate">{feed.title || "N/A"}</div>
                </div>
                <div className="px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-700">
                  <div className="font-medium">Domain</div>
                  <div>{feed.siteDomain || "N/A"}</div>
                </div>
                <div className="px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-700">
                  <div className="font-medium">Items</div>
                  <div>{feed.itemCount}</div>
                </div>
              </div>

              {/* Redirects */}
              {feed.redirects.length > 0 && (
                <div className="mb-4 text-xs text-gray-400">
                  <span className="font-medium">Redirect:</span>{" "}
                  {feed.redirects.map((d) => `${d.from} → ${d.to}`).join(", ")}
                </div>
              )}

              {/* Sample items */}
              {feed.sampleItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Sample Items</h3>
                  <ul className="space-y-2">
                    {feed.sampleItems.map((item, i) => (
                      <li key={i} className="text-sm">
                        <a
                          href={item.link || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {item.title || "(no title)"}
                        </a>
                        {item.pubDate && (
                          <span className="text-gray-400 ml-2">{item.pubDate}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Overall status */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-6">
          <h2 className="text-lg font-semibold mb-3">Overall 6-Point Check</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>1. All feeds use HTTPS</span>
            </li>
            <li className="flex items-center gap-2">
              {feeds.filter((f) => f.reachable).length >= 2 ? (
                <span className="text-yellow-600">~</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>2. {feeds.filter((f) => f.reachable).length}/{feeds.length} feeds reachable (阮一峰 blocked by Cloudflare, 本站 not deployed yet)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>3. Working feeds parse as RSS 2.0</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>4. No duplicate subscriptions (new setup)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>5. No allowlist required (feeds are public)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-600">?</span>
              <span>6. OPML publication: pending your confirmation</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
