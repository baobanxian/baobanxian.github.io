import { notFound } from "next/navigation";
import Link from "next/link";
import pages from "../data.json";

export function generateStaticParams() {
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();

  return (
    <main className="flex min-h-full justify-center px-6 pt-24 pb-16">
      <article className="w-full max-w-2xl bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10">
        <Link
          href="/wiki"
          className="inline-block text-sm text-gray-400 hover:text-blue-600 mb-6"
        >
          ← 返回 Wiki
        </Link>
        <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
        <div className="flex items-center gap-3 mb-8">
          <p className="text-sm text-gray-400">更新于 {page.updated}</p>
          {page.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        </div>
        <div
          className="max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:mb-4 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-700 [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
      </article>
    </main>
  );
}
