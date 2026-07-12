import data from "./data.json";

type Article = {
  title: string | null;
  link: string | null;
  pubDate: string | null;
  description: string | null;
};

type Feed = {
  label: string;
  url: string;
  items: Article[];
  error: string | null;
};

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

export default function SubscribePage() {
  const feeds: Feed[] = data.feeds;

  const allArticles = feeds
    .filter((f) => f.items.length > 0)
    .flatMap((f) =>
      f.items.map((item) => ({ ...item, feedLabel: f.label, feedUrl: f.url }))
    )
    .sort((a, b) => {
      if (!a.pubDate || !b.pubDate) return 0;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

  return (
    <main className="flex min-h-full justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">订阅文章</h1>
        <p className="text-sm text-gray-400 mb-8">
          共 {allArticles.length} 篇文章，来自 {feeds.filter((f) => f.items.length > 0).length} 个订阅源
          · 更新于 {new Date(data.fetchedAt).toLocaleString("zh-CN")}
        </p>

        <div className="space-y-4">
          {allArticles.map((article, i) => (
            <article key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-5">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h2 className="text-lg font-semibold leading-snug">
                  <a
                    href={article.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {article.title || "(无标题)"}
                  </a>
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                <span className="font-medium text-gray-500">{article.feedLabel}</span>
                {article.pubDate && (
                  <time dateTime={article.pubDate}>
                    {new Date(article.pubDate).toLocaleDateString("zh-CN", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </time>
                )}
              </div>
              {article.description && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {stripHtml(article.description).slice(0, 200)}
                </p>
              )}
            </article>
          ))}
        </div>

        {allArticles.length === 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-12 text-center">
            <p className="text-gray-500">
              {feeds.length === 0
                ? "暂无订阅源"
                : "暂未获取到文章，请稍后再试"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
