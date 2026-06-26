import { redirect } from "next/navigation";

import { getCollectionBySlug } from "@/lib/collections";

export function generateStaticParams() {
  return getCollectionBySlug("1930").categories.map((category) => ({
    slug: category.slug,
  }));
}

export default async function LegacyCategoryPage({ params }) {
  const { slug } = await params;
  redirect(`/1930/${slug}`);
}