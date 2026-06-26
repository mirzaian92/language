import Link from "next/link";
import { notFound } from "next/navigation";

import WordDeck from "@/components/word-deck";
import { getAllCategoryParams, getCategoryContext } from "@/lib/collections";

export function generateStaticParams() {
  return getAllCategoryParams();
}

export default async function CollectionWordPage({ params }) {
  const { collection, slug } = await params;
  const context = getCategoryContext(collection, slug);

  if (!context) {
    notFound();
  }

  return (
    <main className="shell detail-shell">
      <Link href={`/${context.collection.slug}`} className="back-link">
        Back to {context.collection.title}
      </Link>

      <WordDeck category={context.category} />
    </main>
  );
}