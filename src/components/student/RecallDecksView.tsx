import { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  RotateCw,
  Flame,
  CheckCircle2,
  Bookmark,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  codeSnippet?: string;
  level: "new" | "learning" | "mastered";
  nextReviewInDays: number;
}

interface Deck {
  id: string;
  title: string;
  category: string;
  description: string;
  totalCards: number;
}

const DEFAULT_DECKS: Deck[] = [
  {
    id: "react-internals",
    title: "React Architecture & Lifecycle",
    category: "Frontend Engineering",
    description:
      "Fiber reconciliation, stale closure prevention, useEffect dependency pitfalls, and state batching.",
    totalCards: 5,
  },
  {
    id: "ts-mastery",
    title: "TypeScript Deep Types",
    category: "Languages & Tooling",
    description:
      "Conditional types, distributive inference, discriminated unions, and mapped types.",
    totalCards: 5,
  },
  {
    id: "backend-distributed",
    title: "Databases & System Design",
    category: "Backend & Cloud",
    description:
      "Database indexing, ACID vs BASE, caching invalidation, and idempotency guarantees.",
    totalCards: 5,
  },
];

const INITIAL_CARDS: Flashcard[] = [
  // React Deck
  {
    id: "rc-1",
    deckId: "react-internals",
    question: "What causes a stale closure inside a `useEffect` or `useCallback` hook?",
    answer:
      "When a hook references state or props from an outer render cycle without listing them in its dependency array. The closure traps the old variable references from the render in which it was instantiated.",
    codeSnippet: `// Stale closure bug:
useEffect(() => {
  const interval = setInterval(() => {
    // 'count' is always 0 because dependency array is empty []!
    console.log(count);
  }, 1000);
  return () => clearInterval(interval);
}, []); // ❌ Missing count or functional update`,
    level: "learning",
    nextReviewInDays: 1,
  },
  {
    id: "rc-2",
    deckId: "react-internals",
    question: "What is the difference between React 18 automatic batching and manual batching?",
    answer:
      "Prior to React 18, React only batched updates inside React event handlers. In React 18+, all updates (including promises, setTimeout, and native event handlers) are automatically batched into a single render pass.",
    level: "mastered",
    nextReviewInDays: 3,
  },
  {
    id: "rc-3",
    deckId: "react-internals",
    question: "Why should `key` props never use array indices for dynamic lists?",
    answer:
      "Using array indices breaks React's reconciliation algorithm when items are reordered, inserted, or deleted. Uncontrolled component states (like form inputs) and CSS animations bind to the wrong DOM node.",
    level: "learning",
    nextReviewInDays: 1,
  },
  {
    id: "rc-4",
    deckId: "react-internals",
    question: "When should you use `useLayoutEffect` instead of `useEffect`?",
    answer:
      "Use `useLayoutEffect` only when you need to read layout from the DOM and synchronously re-render before the browser paints (e.g. measuring element dimensions, tooltips, or scroll position adjustments) to prevent visual flickering.",
    level: "mastered",
    nextReviewInDays: 7,
  },
  {
    id: "rc-5",
    deckId: "react-internals",
    question: "How does React Fiber enable interruptible rendering?",
    answer:
      "Fiber transforms the component tree into a singly linked list of fiber nodes. React can perform unit work in chunks, check the browser deadline with `requestIdleCallback` or message channels, yield control to the main thread for user input, and resume later.",
    level: "new",
    nextReviewInDays: 0,
  },

  // TypeScript Deck
  {
    id: "ts-1",
    deckId: "ts-mastery",
    question: "How does distributive conditional typing work across union types?",
    answer:
      "When a generic conditional type is checked against a bare type parameter `T extends U ? X : Y`, passing a union `A | B` distributes the condition over each member: `(A extends U ? X : Y) | (B extends U ? X : Y)`.",
    codeSnippet: `type ToArray<T> = T extends any ? T[] : never;
type StrOrNum = ToArray<string | number>;
// Result: string[] | number[] (NOT (string | number)[])`,
    level: "learning",
    nextReviewInDays: 1,
  },
  {
    id: "ts-2",
    deckId: "ts-mastery",
    question: "What is the difference between `unknown` and `any` in TypeScript?",
    answer:
      "`any` completely disables the type checker. `unknown` is the type-safe counterpart: you can assign anything to `unknown`, but you cannot invoke or access properties on it without first narrowing the type via typeof, instanceof, or type guards.",
    level: "mastered",
    nextReviewInDays: 7,
  },
  {
    id: "ts-3",
    deckId: "ts-mastery",
    question: "What is the `infer` keyword used for in TypeScript conditional types?",
    answer:
      "The `infer` keyword introduces a type variable within the `extends` clause of a conditional type, allowing you to deduce and extract internal types from larger generic types (e.g. ReturnType, Parameters, Awaited).",
    codeSnippet: `type UnboxPromise<T> = T extends Promise<infer U> ? U : T;
type Result = UnboxPromise<Promise<string>>; // string`,
    level: "learning",
    nextReviewInDays: 2,
  },
  {
    id: "ts-4",
    deckId: "ts-mastery",
    question: "How do Discriminated Unions enable pattern matching in TypeScript?",
    answer:
      "By sharing a common literal property (the 'discriminant' like `kind: 'success' | 'error'`), TypeScript automatically narrows the object type within switch statements or if blocks without unsafe casts.",
    level: "mastered",
    nextReviewInDays: 5,
  },
  {
    id: "ts-5",
    deckId: "ts-mastery",
    question: "What are 'Branded Types' (or Nominal Types) in structural TypeScript?",
    answer:
      "Branded types use an artificial unique property or symbol tag to create nominal typing, preventing accidentally passing a raw string where a validated `UserId` or `SanitizedHtml` is strictly required.",
    codeSnippet: `type UserId = string & { readonly __brand: unique symbol };
function getUser(id: UserId) { /* ... */ }`,
    level: "new",
    nextReviewInDays: 0,
  },

  // Backend Deck
  {
    id: "be-1",
    deckId: "backend-distributed",
    question: "Why do B-Tree indexes excel over Hash indexes for database queries?",
    answer:
      "B-Trees store keys in sorted hierarchical order. They efficiently support range queries (`>`, `<`, `BETWEEN`), order by clauses, and prefix lookups (`LIKE 'abc%'`), whereas Hash indexes only support exact equality (`=`).",
    level: "learning",
    nextReviewInDays: 1,
  },
  {
    id: "be-2",
    deckId: "backend-distributed",
    question: "What does Idempotency mean in API design, and how is it implemented?",
    answer:
      "An idempotent operation can be called multiple times without producing unintended side effects beyond the initial call. Implemented using unique client-generated Idempotency Keys stored in Redis or database transactions.",
    level: "mastered",
    nextReviewInDays: 4,
  },
  {
    id: "be-3",
    deckId: "backend-distributed",
    question: "What is the 'Cache Stampede' (or Thundering Herd) problem?",
    answer:
      "When a heavily accessed cache key expires, thousands of concurrent requests miss the cache simultaneously and all hammer the database at once. Solved via probabilistic early expiration (XFetch), mutex locks, or background refresh workers.",
    level: "learning",
    nextReviewInDays: 2,
  },
  {
    id: "be-4",
    deckId: "backend-distributed",
    question: "What is the difference between Optimistic and Pessimistic concurrency locking?",
    answer:
      "Pessimistic locking locks the database record upfront (`SELECT FOR UPDATE`), preventing anyone else from accessing it. Optimistic locking does not lock; it checks a `version` column at commit time and aborts/retries if another update intervened.",
    level: "mastered",
    nextReviewInDays: 6,
  },
  {
    id: "be-5",
    deckId: "backend-distributed",
    question: "What is the CAP Theorem trade-off during a network partition?",
    answer:
      "In the presence of a network partition (P), a distributed system MUST choose between Consistency (C: every read receives the most recent write or errors out) OR Availability (A: every request receives a non-error response, though it may contain stale data).",
    level: "new",
    nextReviewInDays: 0,
  },
];

export function RecallDecksView() {
  const [selectedDeckId, setSelectedDeckId] = useState<string>("react-internals");
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skillbridge_recall_cards");
      if (saved) {
        try {
          setCards(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      isHydratedRef.current = true;
    }
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [streakDays, setStreakDays] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);

  // New card modal form
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCode, setNewCode] = useState("");

  useEffect(() => {
    if (isHydratedRef.current) {
      localStorage.setItem("skillbridge_recall_cards", JSON.stringify(cards));
    }
  }, [cards]);

  const deckCards = cards.filter((c) => c.deckId === selectedDeckId);
  const currentCard = deckCards[currentIndex] || deckCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deckCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deckCards.length) % deckCards.length);
  };

  // Grade card with Leitner intervals
  const handleRate = (rating: "again" | "hard" | "good" | "easy") => {
    if (!currentCard) return;

    let nextDays = 1;
    let newLevel: "new" | "learning" | "mastered" = "learning";

    if (rating === "again") {
      nextDays = 0;
      newLevel = "learning";
    } else if (rating === "hard") {
      nextDays = 1;
      newLevel = "learning";
    } else if (rating === "good") {
      nextDays = 3;
      newLevel = "mastered";
    } else if (rating === "easy") {
      nextDays = 7;
      newLevel = "mastered";
    }

    setCards((prev) =>
      prev.map((c) =>
        c.id === currentCard.id ? { ...c, nextReviewInDays: nextDays, level: newLevel } : c,
      ),
    );

    // Auto advance
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deckCards.length);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const created: Flashcard = {
      id: `custom-${Date.now()}`,
      deckId: selectedDeckId,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      codeSnippet: newCode.trim() || undefined,
      level: "new",
      nextReviewInDays: 0,
    };

    setCards((prev) => [created, ...prev]);
    setNewQuestion("");
    setNewAnswer("");
    setNewCode("");
    setShowAddModal(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm("Delete this card from your deck?")) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  // Metrics
  const masteredCount = deckCards.filter((c) => c.level === "mastered").length;
  const learningCount = deckCards.filter((c) => c.level === "learning").length;
  const newCount = deckCards.filter((c) => c.level === "new").length;
  const masteryPercentage = deckCards.length
    ? Math.round((masteredCount / deckCards.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 size-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-200 border border-purple-400/30">
              <Brain className="size-3.5 text-amber-300" />
              <span>Active Recall & Spaced Repetition Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Smart Recall Decks
            </h1>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              Udemy and Coursera suffer from the forgetting curve: students binge 20 hours of
              lectures and retain less than 15%. Skillbridge employs scientifically proven Leitner
              spaced repetition so core concepts transfer permanently into long-term memory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/15 min-w-[120px]">
              <span className="flex items-center justify-center gap-1 text-2xl font-black text-amber-300">
                <Flame className="size-5 text-amber-400 fill-amber-400" />
                {streakDays}
              </span>
              <span className="text-[11px] font-medium text-purple-200">Day Streak</span>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/15 min-w-[120px]">
              <span className="block text-2xl font-black text-emerald-400">
                {masteryPercentage}%
              </span>
              <span className="text-[11px] font-medium text-purple-200">Deck Mastery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Selector Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEFAULT_DECKS.map((deck) => {
          const isSelected = deck.id === selectedDeckId;
          const count = cards.filter((c) => c.deckId === deck.id).length;
          const masteredInDeck = cards.filter(
            (c) => c.deckId === deck.id && c.level === "mastered",
          ).length;
          const pct = count ? Math.round((masteredInDeck / count) * 100) : 0;

          return (
            <button
              key={deck.id}
              onClick={() => {
                setSelectedDeckId(deck.id);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-purple-600 uppercase tracking-wider text-[10px]">
                  {deck.category}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">{count} Cards</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{deck.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {deck.description}
              </p>

              {/* Mini Progress Bar */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Mastered: {pct}%</span>
                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Card Study Stage */}
      {deckCards.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <Brain className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No cards in this deck yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add your first flashcard to start practicing.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Flashcard
          </Button>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Card Top Toolbar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="grid size-6 place-items-center rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
                {currentIndex + 1}
              </span>
              <span>of {deckCards.length} cards</span>
              <span className="text-slate-300">•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  currentCard.level === "mastered"
                    ? "bg-emerald-100 text-emerald-800"
                    : currentCard.level === "learning"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-sky-100 text-sky-800"
                }`}
              >
                {currentCard.level}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModal(true)}
                className="h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Plus className="size-3.5 mr-1" /> Add Card
              </Button>
              {currentCard.id.startsWith("custom-") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCard(currentCard.id)}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[360px] sm:min-h-[400px] rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative group select-none"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {isFlipped
                  ? "💡 Verified Explanation & Key Insight"
                  : "❓ Question / Concept Recall"}
              </span>
              <span className="flex items-center gap-1 text-purple-600 font-medium group-hover:underline">
                <RotateCw className="size-3" /> Click card to flip
              </span>
            </div>

            {/* Middle Content */}
            <div className="my-auto py-6">
              {!isFlipped ? (
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {currentCard.question}
                  </h2>
                  <p className="text-xs text-slate-500 italic">
                    Pause and mentally retrieve the answer before flipping.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                    {currentCard.answer}
                  </p>

                  {currentCard.codeSnippet && (
                    <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto shadow-inner">
                      <pre className="whitespace-pre-wrap">{currentCard.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Card ID: {currentCard.id}</span>
              <span className="text-purple-600 font-semibold">
                {isFlipped ? "Answer revealed" : "Hidden (Test your memory)"}
              </span>
            </div>
          </div>

          {/* Rating / Leitner Spaced Repetition Buttons */}
          {isFlipped ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                Rate your recall to schedule next review:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleRate("again")}
                  className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  <div className="text-sm">Again</div>
                  <div className="text-[10px] text-rose-600 font-normal">Review in &lt;1 min</div>
                </button>
                <button
                  onClick={() => handleRate("hard")}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  <div className="text-sm">Hard</div>
                  <div className="text-[10px] text-amber-600 font-normal">Review in 1 day</div>
                </button>
                <button
                  onClick={() => handleRate("good")}
                  className="p-2.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  <div className="text-sm">Good</div>
                  <div className="text-[10px] text-sky-600 font-normal">Review in 3 days</div>
                </button>
                <button
                  onClick={() => handleRate("easy")}
                  className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  <div className="text-sm">Easy</div>
                  <div className="text-[10px] text-emerald-600 font-normal">Review in 7 days</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="w-1/2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <ChevronLeft className="size-4 mr-1" /> Previous Card
              </Button>
              <Button
                size="sm"
                onClick={() => setIsFlipped(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs"
              >
                <RotateCw className="size-3.5 mr-1" /> Show Answer (Flip)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="w-1/2 text-xs text-slate-700 hover:bg-slate-50"
              >
                Next <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Brain className="size-4 text-purple-600" />
                Add Custom Flashcard
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question / Concept Prompt *
                </label>
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. How does Array.prototype.reduce work under the hood?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer / Concise Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Explain the key intuition clearly..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Code Snippet
                </label>
                <textarea
                  rows={2}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="// Paste code example..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-purple-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                >
                  Save Flashcard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
