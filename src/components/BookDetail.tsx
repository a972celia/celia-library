import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Book } from "@/data/books";
import { COVER_W, faceFont } from "./bookFaces";

export type SpineRect = { left: number; top: number; width: number; height: number };

type Props = {
  books: Book[];
  index: number;
  rect: SpineRect;
  onIndex: (i: number) => void;
  onClose: () => void;
};

export function BookDetail({ books, index, rect, onIndex, onClose }: Props) {
  const book = books[index]!;
  const [out, setOut] = useState(false);
  const [vp, setVp] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const id = requestAnimationFrame(() => setOut(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const retract = () => {
    setOut(false);
    window.setTimeout(onClose, 620);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") retract();
      if (e.key === "ArrowLeft") onIndex((index - 1 + books.length) % books.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % books.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const narrow = vp.w < 720;
  const coverH = narrow ? vp.h * 0.42 : Math.min(vp.h * 0.6, 480);
  const scale = coverH / rect.height;
  const coverW = COVER_W * scale;

  const targetLeft = narrow ? vp.w / 2 - coverW / 2 : vp.w * 0.28 - coverW / 2;
  const targetTop = narrow ? vp.h * 0.1 : vp.h / 2 - coverH / 2;
  const dx = targetLeft - rect.left;
  const dy = targetTop - rect.top;

  const detail = (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close"
        onClick={retract}
        className="absolute inset-0 bg-background/70 backdrop-blur-xl transition-opacity duration-700"
        style={{ opacity: out ? 1 : 0 }}
      />

      <div
        className="pointer-events-none absolute"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          perspective: "1600px",
        }}
      >
        <div
          style={{
            width: rect.width,
            height: rect.height,
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
            transition: "transform 900ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform: out
              ? `translate3d(${dx}px, ${dy}px, 0) scale(${scale}) rotateY(-90deg)`
              : "translate3d(0,0,0) scale(1) rotateY(-26deg)",
          }}
        >
          <div
            className="absolute top-0 left-full h-full shadow-2xl"
            style={{
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              ...(book.cover ? {} : { width: COVER_W, backgroundColor: book.spine }),
            }}
          >
            {book.cover ? (
              <img src={book.cover} alt={`${book.title} cover`} className="block h-full w-auto max-w-none" />
            ) : (
              <div
                className={`flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center ${faceFont[book.face]}`}
                style={{ color: book.ink }}
              >
                <span className="text-[13px] leading-snug">{book.title}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest opacity-70">{book.author}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="absolute overflow-y-auto transition-all duration-700"
        style={{
          left: narrow ? 24 : vp.w * 0.5,
          right: 24,
          top: narrow ? vp.h * 0.1 + coverH + 24 : vp.h * 0.18,
          maxHeight: narrow ? "46vh" : "64vh",
          opacity: out ? 1 : 0,
          transform: out ? "translateY(0)" : "translateY(16px)",
          transitionDelay: "260ms",
        }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {book.recommender ? `Recommended by ${book.recommender}` : book.finished ? `Finished ${book.finished}` : "In the library"}
        </p>
        <h2 className="mt-3 font-display text-4xl font-light leading-tight text-foreground">{book.title}</h2>
        <p className="mt-1 text-lg italic text-muted-foreground">
          {book.author}
          {book.year ? ` · ${book.year}` : ""}
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-primary">
          {book.rating ? "★".repeat(Math.round(book.rating)) + ` ${book.rating}` : "Unrated"}
        </p>
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-foreground/80">{book.blurb}</p>
        {book.genres?.length ? (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {book.genres.join(" · ")}
            {book.publisher ? ` · ${book.publisher}` : ""}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onIndex((index - 1 + books.length) % books.length)}
            className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-secondary"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onIndex((index + 1) % books.length)}
            className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-secondary"
          >
            Next
          </button>
          <button
            type="button"
            onClick={retract}
            className="rounded-full bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Shelve it
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(detail, document.body);
}
