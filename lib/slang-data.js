import fs from "node:fs";
import path from "node:path";

const rawCategories = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "language-data", "raw-categories.json"),
    "utf8",
  ),
);

const termExceptions = new Set([
  "mitt me, kid",
  "piss or get off the pot",
  "what's your story, morning glory?",
  "what’s your story, morning glory?",
  "you gave us beer, now give us water",
  "you shred it, wheat",
]);

const aliasMap = new Map([["nitiwttery", "nitwittery"]]);

function cleanText(value) {
  return value
    .replace(/\[\d+\]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .replace(/;+$/g, "")
    .trim();
}

function normalizeTerm(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^the\s+/i, "")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function formatTerm(value) {
  const cleaned = cleanText(value).replace(/^"|"$/g, "");

  if (!cleaned) {
    return "";
  }

  return /^[a-z]/.test(cleaned)
    ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`
    : cleaned;
}

function formatDefinition(value) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "";
  }

  return /^[a-z]/.test(cleaned)
    ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`
    : cleaned;
}

function splitByOrIfList(term) {
  const normalized = normalizeTerm(term);

  if (termExceptions.has(normalized) || !/\sor\s/i.test(term)) {
    return [term];
  }

  const parts = term
    .split(/\s+or\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return [term];
  }

  const isCompactList = parts.every(
    (part) => part.split(/\s+/).length <= 3 && !/[?!]/.test(part),
  );

  return isCompactList ? parts : [term];
}

function splitTerms(rawTerm) {
  const cleaned = cleanText(rawTerm);
  const normalized = normalizeTerm(cleaned);

  if (termExceptions.has(normalized)) {
    return [cleaned];
  }

  const slashExpanded =
    normalized === "taking the rap fall"
      ? ["taking the rap", "taking the fall"]
      : cleaned.includes("/")
        ? cleaned
            .split("/")
            .map((part) => part.trim())
            .filter(Boolean)
        : [cleaned];

  const commaExpanded = [];

  for (const part of slashExpanded) {
    const partNormalized = normalizeTerm(part);

    if (termExceptions.has(partNormalized)) {
      commaExpanded.push(part);
      continue;
    }

    if (part.includes(",")) {
      const pieces = part
        .replace(/,\s+or\s+/gi, ", ")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      commaExpanded.push(...pieces);
      continue;
    }

    commaExpanded.push(part);
  }

  return [...new Set(
    commaExpanded
      .flatMap(splitByOrIfList)
      .map((term) => {
        const candidate = cleanText(term).replace(/^"|"$/g, "");
        const alias = aliasMap.get(normalizeTerm(candidate));
        return alias ?? candidate;
      })
      .filter(Boolean),
  )];
}

function slugify(value) {
  return normalizeTerm(value).replace(/\s+/g, "-");
}

const seenTerms = new Set();

const categories = rawCategories
  .map((category) => {
    const entries = [];

    for (const line of category.lines) {
      const cleanedLine = cleanText(line);
      const match = cleanedLine.match(/^(.+?)(?:\s-\s|:+\s*)(.+)$/);

      if (!match) {
        continue;
      }

      const [, rawTerm, rawDefinition] = match;
      const definition = formatDefinition(rawDefinition);

      for (const term of splitTerms(rawTerm)) {
        const key = normalizeTerm(term);

        if (!key || seenTerms.has(key)) {
          continue;
        }

        seenTerms.add(key);
        entries.push({
          id: slugify(term),
          term: formatTerm(term),
          definition,
        });
      }
    }

    return {
      slug: slugify(category.title),
      title: category.title,
      entries,
    };
  })
  .filter((category) => category.entries.length > 0);

export function getCategories() {
  return categories;
}

export function getCategoryBySlug(slug) {
  return categories.find((category) => category.slug === slug);
}

export function getWordCount() {
  return categories.reduce((total, category) => total + category.entries.length, 0);
}
