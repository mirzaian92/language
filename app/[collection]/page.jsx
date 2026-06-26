import Link from "next/link";
import { notFound } from "next/navigation";

import { getCollections, getCollectionBySlug } from "@/lib/collections";

export function generateStaticParams() {
  return getCollections().map((collection) => ({
    collection: collection.slug,
  }));
}

export default async function CollectionPage({ params }) {
  const { collection } = await params;
  const collectionData = getCollectionBySlug(collection);

  if (!collectionData) {
    notFound();
  }

  return (
    <main className="shell collection-shell">
      <Link href="/" className="back-link">
        Back home
      </Link>

      <section className="collection-intro">
        <h1>{collectionData.pageTitle}</h1>
      </section>

      <section className="card-grid" aria-label={`${collectionData.title} categories`}>
        {collectionData.categories.map((category, index) => (
          <article
            key={category.slug}
            className="category-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="card-heading">
              <h2>{category.title}</h2>
            </div>

            <Link className="card-link" href={`/${collectionData.slug}/${category.slug}`}>
              Open this card
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}