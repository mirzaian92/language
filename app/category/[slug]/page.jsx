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

      <WordDeck category={category} />
    </main>
  );
}