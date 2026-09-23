import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { books, type Book } from "@/data/books";
import { Shelf } from "@/components/Shelf";
import { TypedTitle } from "@/components/TypedTitle";
import { LibraryFilter } from "@/components/LibraryFilter";
import { RecommendBookDialog } from "@/components/RecommendBookDialog";
import { useRecommendations } from "@/hooks/useRecommendations";

const TITLE = "Celia's virtual library";
const DESC =
  "A personal archive of every book I've read — browse the shelf in 3D, search it in plain English, and recommend me something.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [shown, setShown] = useState<Book[] | null>(null);
  const [dialog, setDialog] = useState(false);
  const { recommendations, justAdded, recommend } = useRecommendations();

  const visible = shown ?? books;
  const onChange = useCallback((list: Book[] | null) => setShown(list), []);

  return (
    <div className="grain relative min-h-screen overflow-x-hidden bg-background">
      <div
        className="animate-drift pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, var(--color-glow) 0%, transparent 70%)",
          opacity: 0.7,
        }}
      />

      <header className="relative z-10 flex flex-col items-center px-6 pt-20 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          A personal archive
        </p>
        <div className="mt-5">
          <TypedTitle />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {books.length} volumes
        </p>
        <button
          type="button"
          onClick={() => setDialog(true)}
          className="mt-6 rounded-full border border-primary/40 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Recommend a book
        </button>
        <LibraryFilter books={books} onChange={onChange} />
      </header>

      <main className="relative z-10 pb-2 pt-6">
        {visible.length ? (
          <Shelf books={visible} />
        ) : (
          <p className="py-24 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            No books match
          </p>
        )}
      </main>

      {recommendations.length ? (
        <section className="relative z-10 pb-16">
          <p className="pt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Recommended to me
          </p>
          <Shelf books={recommendations} justAdded={justAdded} />
        </section>
      ) : (
        <div className="pb-16" />
      )}

      <RecommendBookDialog open={dialog} onClose={() => setDialog(false)} onRecommend={recommend} />
    </div>
  );
}
