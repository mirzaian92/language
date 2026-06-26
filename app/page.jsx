import Link from "next/link";

import { getCollections } from "@/lib/collections";

export default function HomePage() {
  const collections = getCollections();

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">Makillia's word collections</p>
        <h1>
          Hello Makillia the Beautiful Queen of Las Vegas {"\u{1F451}"}
        </h1>
      </section>

      <section className="card-grid" aria-label="Language collections">
        {collections.map((collection, index) => (
          <article
            key={collection.slug}
            className="category-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="card-heading">
              <h2>{collection.title}</h2>
            </div>

            <Link className="card-link" href={`/${collection.slug}`}>
              Open this card
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}