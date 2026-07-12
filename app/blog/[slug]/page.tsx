import { notFound } from "next/navigation";
import Link from "next/link";
import posts from "../data.json";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <main className="flex min-h-full justify-center px-6 pt-24 pb-16">
      <article className="w-full max-w-2xl bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10">
        <Link
          href="/blog"
          className="inline-block text-sm text-gray-400 hover:text-blue-600 mb-6"
        >
          ← 返回博客列表
        </Link>
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-sm text-gray-400 mb-8">{post.date}</p>
        <div
          className="max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_p]:leading-relaxed [&_p]:mb-4 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-700 [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </main>
  );
}
