"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于我" },
  { href: "/blog", label: "博客" },
  { href: "/subscribe", label: "订阅" },
  { href: "/papers", label: "Research Papers" },
  { href: "/wiki", label: "Wiki" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-1 bg-white/60 backdrop-blur-sm px-4 py-3">
      {links.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-black/10 text-gray-900"
                : "text-gray-500 hover:bg-black/5 hover:text-gray-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
