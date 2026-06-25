"use client";

import { useState } from "react";

function shuffleEntries(entries) {
  const deck = [...entries];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = deck[index];

    deck[index] = deck[randomIndex];
    deck[randomIndex] = current;
  }

  return deck;
}

export default function WordDeck({ category }) {
  const [deck] = useState(() => shuffleEntries(category.entries));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState(() => new Set());

  const currentEntry = deck[currentIndex];
  const definitionIsVisible = revealedIds.has(currentEntry.id);
  const seenCount = revealedIds.size;

  function revealDefinition() {
    setRevealedIds((current) => {
      if (current.has(currentEntry.id)) {
        return current;
      }

      const next = new Set(current);
      next.add(currentEntry.id);
      return next;
    });
  }

  function showPreviousWord() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function showNextWord() {
    if (!definitionIsVisible) {
      return;
    }

    setCurrentIndex((index) => Math.min(index + 1, deck.length - 1));
  }

  return (
    <section className="word-stage">
      <article className="word-panel">
        <div className="progress-row">
          <p className="progress-note">
            Word {currentIndex + 1} of {deck.length}
          </p>
          <span
            className={`status-pill ${definitionIsVisible ? "status-pill-live" : "status-pill-resting"}`}
          >
            {definitionIsVisible ? "Definition unlocked" : "Reveal to unlock next"}
          </span>
        </div>

        <p className="category-label">{category.title}</p>
        <h1 className="word-term">
          <strong>{currentEntry.term}</strong>
        </h1>

        <p className="word-copy">
          Open the meaning when you’re ready, then move back and forth through the shuffled deck.
        </p>

        {!definitionIsVisible ? (
          <button className="primary-button" type="button" onClick={revealDefinition}>
            Show the Definition
          </button>
        ) : (
          <div className="definition-panel" aria-live="polite">
            <p className="definition-label">Definition</p>
            <p className="definition-text">{currentEntry.definition}</p>
          </div>
        )}

        <div className="navigation-row">
          <button
            className="secondary-button"
            type="button"
            onClick={showPreviousWord}
            disabled={currentIndex === 0}
          >
            Previous word
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={showNextWord}
            disabled={currentIndex === deck.length - 1 || !definitionIsVisible}
          >
            Next word
          </button>
        </div>
      </article>

      <aside className="info-panel">
        <div className="info-card">
          <p className="info-label">Fresh shuffle</p>
          <p className="info-value">Every time you open a category, the word order changes.</p>
        </div>

        <div className="info-card">
          <p className="info-label">Seen so far</p>
          <p className="info-stat">{seenCount}</p>
          <p className="info-value">
            Revealed definitions stay attached to their words when you move backward.
          </p>
        </div>

        <div className="info-card">
          <p className="info-label">Deck size</p>
          <p className="info-stat">{deck.length}</p>
          <p className="info-value">All duplicate slang has been removed before the deck was built.</p>
        </div>
      </aside>
    </section>
  );
}
