import Link from "next/link";
import posts from "./data.json";

export default function Blog() {
  return (
    <main className="flex min-h-full items-start justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-2xl bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">博客</h1>
        {posts.length === 0 ? (
          <p className="text-lg text-gray-500">暂无文章，敬请期待</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block border-b border-gray-200 pb-4 hover:opacity-80 transition-opacity"
                >
                  <h2 className="text-xl font-semibold group-hover:text-blue-600">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">{post.date}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
