import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Book } from "@/data/books";
import { smartSearch } from "@/lib/librarySearch.functions";

type Props = {
  books: Book[];
  onChange: (visible: Book[] | null) => void;
};

export function LibraryFilter({ books, onChange }: Props) {
  const search = useServerFn(smartSearch);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);
  const [status, setStatus] = useState<string>("");
  const reqId = useRef(0);

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((b) => (b.genres ?? []).forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [books]);

  const years = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((b) => {
      const y = readYear(b);
      if (y) counts.set(y, (counts.get(y) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [books]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setIds(null);
      setStatus("");
      return;
    }
    const id = ++reqId.current;
    setStatus("Reading the shelves…");
    const t = window.setTimeout(async () => {
      try {
        const res = await search({ data: { query: q } });
        if (id !== reqId.current) return;
        setIds(res.ids);
        setStatus(`${res.ids.length} found`);
      } catch (err) {
        if (id !== reqId.current) return;
        setIds(null);
        setStatus(err instanceof Error ? err.message : "Search failed.");
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    let list: Book[] = books;
    if (ids) {
      const rank = new Map(ids.map((id, i) => [id, i]));
      list = books.filter((b) => rank.has(b.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    }
    if (genre) list = list.filter((b) => (b.genres ?? []).includes(genre));
    onChange(!ids && !genre ? null : list);
  }, [ids, genre, books, onChange]);

  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          className="w-full rounded-full border border-border bg-card/70 px-6 py-3 font-sans text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/60"
        />
        {status ? (
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {status}
          </span>
        ) : null}
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto whitespace-nowrap">
        <button
          type="button"
          onClick={() => setGenre(null)}
          className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            genre === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGenre(genre === g ? null : g)}
            className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              genre === g
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
