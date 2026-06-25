"use client";

import { useEffect, useRef, useState } from "react";

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

function getRandomCelebrationStep() {
  return Math.floor(Math.random() * 3) + 4;
}

function createCelebrationBurst() {
  const icons = ["heart", "star"];

  return Array.from({ length: 20 }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    icon: icons[index % icons.length],
    left: `${8 + Math.random() * 84}%`,
    delay: `${Math.random() * 160}ms`,
    duration: `${900 + Math.random() * 700}ms`,
    drift: `${-60 + Math.random() * 120}px`,
    rotation: `${-120 + Math.random() * 240}deg`,
    scale: `${0.78 + Math.random() * 0.7}`,
  }));
}

export default function WordDeck({ category }) {
  const [deck] = useState(() => shuffleEntries(category.entries));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [celebrationBurst, setCelebrationBurst] = useState([]);
  const revealCountRef = useRef(0);
  const nextCelebrationAtRef = useRef(getRandomCelebrationStep());
  const clearCelebrationTimeoutRef = useRef(null);

  const currentEntry = deck[currentIndex];
  const definitionIsVisible = revealedIds.has(currentEntry.id);

  useEffect(() => {
    return () => {
      if (clearCelebrationTimeoutRef.current) {
        clearTimeout(clearCelebrationTimeoutRef.current);
      }
    };
  }, []);

  function triggerCelebrationIfNeeded() {
    revealCountRef.current += 1;

    if (revealCountRef.current < nextCelebrationAtRef.current) {
      return;
    }

    nextCelebrationAtRef.current += getRandomCelebrationStep();
    setCelebrationBurst(createCelebrationBurst());

    if (clearCelebrationTimeoutRef.current) {
      clearTimeout(clearCelebrationTimeoutRef.current);
    }

    clearCelebrationTimeoutRef.current = setTimeout(() => {
      setCelebrationBurst([]);
      clearCelebrationTimeoutRef.current = null;
    }, 1900);
  }

  function revealDefinition() {
    if (definitionIsVisible) {
      return;
    }

    setRevealedIds((current) => {
      const next = new Set(current);
      next.add(currentEntry.id);
      return next;
    });

    triggerCelebrationIfNeeded();
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
        {celebrationBurst.length > 0 ? (
          <div className="celebration-burst" aria-hidden="true">
            {celebrationBurst.map((particle) => (
              <span
                key={particle.id}
                className={`celebration-piece celebration-piece-${particle.icon}`}
                style={{
                  left: particle.left,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                  "--celebration-drift": particle.drift,
                  "--celebration-rotation": particle.rotation,
                  "--celebration-scale": particle.scale,
                }}
              >
                {particle.icon === "heart" ? "\u2665" : "\u2605"}
              </span>
            ))}
          </div>
        ) : null}

        <div className="progress-row">
          <p className="progress-note">Word {currentIndex + 1} of {deck.length}</p>
        </div>

        <h1 className="word-term">
          <strong>{currentEntry.term}</strong>
        </h1>

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
          <p className="info-label">Seen so far</p>
          <p className="info-stat">{revealedIds.size}</p>
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