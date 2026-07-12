import fs from "fs";
import path from "path";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  published: string;
  summary: string;
  url: string;
  source: string;
}

function loadPapers(): Paper[] {
  const filePath = path.join(process.cwd(), "public", "data", "papers.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export default function Papers() {
  const papers = loadPapers();

  return (
    <main className="flex min-h-full items-start justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-2xl bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">Research Papers</h1>
        <p className="text-sm text-gray-400 mb-8">
          Collected from arXiv &middot; {papers.length} papers
        </p>
        {papers.length === 0 ? (
          <p className="text-lg text-gray-500">No papers collected yet</p>
        ) : (
          <ul className="space-y-6">
            {papers.map((paper) => (
              <li key={paper.id}>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border-b border-gray-200 pb-4 hover:opacity-80 transition-opacity"
                >
                  <h2 className="text-xl font-semibold group-hover:text-blue-600 leading-snug">
                    {paper.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {paper.authors.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {paper.published} &middot; {paper.source}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {paper.summary}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
