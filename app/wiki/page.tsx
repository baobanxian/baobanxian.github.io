import Link from "next/link";
import pages from "./data.json";

export default function Wiki() {
  return (
    <main className="flex min-h-full items-start justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-2xl bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">Wiki</h1>
        {pages.length === 0 ? (
          <p className="text-lg text-gray-500">正在建设中...</p>
        ) : (
          <ul className="space-y-6">
            {pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/wiki/${page.slug}`}
                  className="group block border-b border-gray-200 pb-4 hover:opacity-80 transition-opacity"
                >
                  <h2 className="text-xl font-semibold group-hover:text-blue-600">
                    {page.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">{page.updated}</p>
                  {page.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {page.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
