import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 pt-14">
      <div className="max-w-md text-center bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-12">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-lg text-gray-500 mb-6">页面不存在</p>
        <Link
          href="/"
          className="inline-block rounded-full bg-black/10 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-black/20 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
