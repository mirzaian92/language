import Link from "next/link";
import { notFound } from "next/navigation";

import WordDeck from "@/components/word-deck";
import { getCategories, getCategoryBySlug } from "@/lib/slang-data";

export function generateStaticParams() {
  return getCategories().map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="shell detail-shell">
      <Link href="/" className="back-link">
        Back to all cards
      </Link>

      <section className="detail-hero">
        <p className="eyebrow">Single word mode</p>
        <h1>{category.title}</h1>
        <p className="detail-copy">
          This deck reshuffles itself when the page opens, then lets you reveal definitions and move back to earlier words.
        </p>
      </section>

      <WordDeck category={category} />
    </main>
  );
}
