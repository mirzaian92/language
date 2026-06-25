import Link from "next/link";

import { getCategories } from "@/lib/slang-data";

export default function HomePage() {
  const categories = getCategories();

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">Makillia's 1930s slang deck</p>
        <h1>
          Hello Makillia the Beautiful Queen of Las Vegas {"\u{1F451}"}
        </h1>
      </section>

      <section className="card-grid" aria-label="Slang categories">
        {categories.map((category, index) => (
          <article
            key={category.slug}
            className="category-card"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="card-heading">
              <h2>{category.title}</h2>
            </div>

            <Link className="card-link" href={`/category/${category.slug}`}>
              Open this card
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}