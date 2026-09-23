import { useEffect, useRef, useState } from "react";
import { buildBook, searchBooks, type OLResult } from "@/lib/openLibrary";
import type { RecommendInput } from "@/hooks/useRecommendations";

type Props = {
  open: boolean;
  onClose: () => void;
  onRecommend: (input: RecommendInput) => Promise<unknown>;
};

export function RecommendBookDialog({ open, onClose, onRecommend }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<OLResult[]>([]);
  const [picked, setPicked] = useState<OLResult | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setPicked(null);
      setName("");
      setNote("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (picked || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        setResults(await searchBooks(q.trim(), ctrl.signal));
      } catch {
        /* aborted or offline */
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [q, picked]);

  if (!open) return null;

  const submit = async () => {
    if (!picked) return;
    if (name.trim().length < 1) {
      setError("Please add your name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const shape = await buildBook(picked);
      await onRecommend({
        recommender: name.trim().slice(0, 60),
        note: note.trim().slice(0, 500) || null,
        title: shape.title,
        author: shape.author,
        cover: shape.cover,
        year: shape.year,
        publisher: shape.publisher,
        binding: shape.binding,
        finish: shape.finish,
        spine: shape.spine,
        band: shape.band ?? null,
        ink: shape.ink,
        face: shape.face,
        caps: shape.caps ?? false,
        width: shape.width,
        height: shape.height,
        lean: shape.lean,
        depth: shape.depth,
        wear: shape.wear,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the recommendation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/75 backdrop-blur-md"
      />
      <div className="animate-rise relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card p-6 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Recommend a book
        </p>

        {!picked ? (
          <>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or author…"
              className="mt-4 w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary/60"
            />
            <ul className="no-scrollbar mt-4 max-h-80 space-y-1 overflow-y-auto">
              {results.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => setPicked(r)}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary"
                  >
                    <img src={r.cover} alt="" className="h-14 w-10 rounded-sm object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base">{r.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.author}
                        {r.year ? ` · ${r.year}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Pick</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="mt-4 flex gap-4">
              <img src={picked.cover} alt="" className="h-32 w-22 rounded-sm object-cover shadow-md" />
              <div>
                <p className="font-display text-xl leading-tight">{picked.title}</p>
                <p className="text-sm italic text-muted-foreground">
                  {picked.author}
                  {picked.year ? ` · ${picked.year}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="mt-2 font-mono text-[10px] uppercase tracking-widest text-primary underline-offset-4 hover:underline"
                >
                  Choose another
                </button>
              </div>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Your name"
              className="mt-5 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Why should I read it?"
              className="mt-3 w-full resize-none rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-full bg-primary px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Shelving…" : "Send it"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
