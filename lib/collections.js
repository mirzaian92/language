import fs from "node:fs";
import path from "node:path";

const rawSlangCategories = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "language-data", "raw-categories.json"), "utf8"),
);

const rawArmenianCategories = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "language-data", "raw-armenian-categories.json"),
    "utf8",
  ),
);

const termExceptions = new Set([
  "mitt me, kid",
  "piss or get off the pot",
  "what's your story, morning glory?",
  "you gave us beer, now give us water",
  "you shred it, wheat",
]);

const aliasMap = new Map([["nitiwttery", "nitwittery"]]);

function cleanText(value) {
  return String(value)
    .replace(/\[\d+\]/g, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2019]/g, "'")
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

function slugify(value) {
  return normalizeTerm(value).replace(/\s+/g, "-");
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

  return [
    ...new Set(
      commaExpanded
        .flatMap(splitByOrIfList)
        .map((term) => {
          const candidate = cleanText(term).replace(/^"|"$/g, "");
          const alias = aliasMap.get(normalizeTerm(candidate));
          return alias ?? candidate;
        })
        .filter(Boolean),
    ),
  ];
}

function build1930Categories() {
  return rawSlangCategories
    .map((category) => {
      const entries = [];
      const seenTerms = new Set();

      for (const line of category.lines) {
        const cleanedLine = cleanText(line);
        const match = cleanedLine.match(/^(.+?)(?:\s-\s|:+\s*)(.+)$/u);

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
        title: cleanText(category.title),
        entries,
      };
    })
    .filter((category) => category.entries.length > 0);
}

function repairRunTogetherText(value) {
  return cleanText(value).replace(/([a-z!?])([A-Z])/g, "$1. $2");
}

function appendPronunciation(definition, pronunciation) {
  const cleanedPronunciation = cleanText(pronunciation);

  if (!cleanedPronunciation) {
    return definition;
  }

  const separator = /[.!?]$/.test(definition) ? "" : ".";
  return `${definition}${separator} Pronounced: ${cleanedPronunciation}.`;
}

function formatArmenianDisplayTerm(script, transliteration) {
  const cleanedScript = cleanText(script);
  const cleanedTransliteration = cleanText(transliteration);

  if (cleanedScript && cleanedTransliteration && cleanedScript !== cleanedTransliteration) {
    return `${cleanedTransliteration} (${cleanedScript})`;
  }

  return cleanedTransliteration || cleanedScript;
}

function addUniqueEntry(entries, seenTerms, entry) {
  if (!entry?.term || !entry?.definition) {
    return;
  }

  const key = normalizeTerm(entry.term);

  if (!key || seenTerms.has(key)) {
    return;
  }

  seenTerms.add(key);
  entries.push({
    id: slugify(entry.term),
    term: formatTerm(entry.term),
    definition: formatDefinition(entry.definition),
  });
}

function parseArmenianLine(line) {
  const cleanedLine = cleanText(line).replace(/^\d+\.\s*/, "");
  const parts = cleanedLine.split(/\s+[\u2013-]\s+/u);

  if (parts.length < 2) {
    return null;
  }

  return {
    term: parts[0],
    definition: repairRunTogetherText(parts.slice(1).join(" - ")),
  };
}

function parseArmenianTableRow(row, headerWidth) {
  if (headerWidth === 2 && row.length >= 2) {
    return {
      term: cleanText(row[1]),
      definition: cleanText(row[0]),
    };
  }

  if (headerWidth >= 5 && row.length >= 5) {
    const transliteration = cleanText(row[3]);
    const baseDefinition = repairRunTogetherText(row[1]);
    const definition =
      cleanText(row[4]).toLowerCase() !== transliteration.toLowerCase()
        ? appendPronunciation(baseDefinition, row[4])
        : baseDefinition;

    return {
      term: formatArmenianDisplayTerm(row[2], row[3]),
      definition,
    };
  }

  return null;
}

function buildArmenianCategories() {
  return rawArmenianCategories
    .map((category) => {
      const entries = [];
      const seenTerms = new Set();

      for (const line of category.lines || []) {
        addUniqueEntry(entries, seenTerms, parseArmenianLine(line));
      }

      const tableRows = category.tableRows || [];

      if (tableRows.length > 1) {
        const headerWidth = tableRows[0].length;

        for (const row of tableRows.slice(1)) {
          addUniqueEntry(entries, seenTerms, parseArmenianTableRow(row, headerWidth));
        }
      }

      return {
        slug: slugify(category.title),
        title: cleanText(category.title),
        entries,
      };
    })
    .filter((category) => category.entries.length > 0);
}

const collections = [
  {
    slug: "armenian",
    title: "Armenian",
    pageTitle: "Armenian-English",
    categories: buildArmenianCategories(),
  },
  {
    slug: "1930",
    title: "1930's",
    pageTitle: "1930s Slang",
    categories: build1930Categories(),
  },
];

export function getCollections() {
  return collections;
}

export function getCollectionBySlug(slug) {
  return collections.find((collection) => collection.slug === slug);
}

export function getCategoryContext(collectionSlug, categorySlug) {
  const collection = getCollectionBySlug(collectionSlug);

  if (!collection) {
    return null;
  }

  const category = collection.categories.find((item) => item.slug === categorySlug);

  if (!category) {
    return null;
  }

  return { collection, category };
}

export function getAllCategoryParams() {
  return collections.flatMap((collection) =>
    collection.categories.map((category) => ({
      collection: collection.slug,
      slug: category.slug,
    })),
  );
}