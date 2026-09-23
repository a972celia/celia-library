import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Book } from "@/data/books";
import { Button } from "@/components/ui/button";
import { BookSpine } from "./BookSpine";
import { BookDetail, type SpineRect } from "./BookDetail";

type Props = {
  books: Book[];
  justAdded?: string | null;
};

const LOOP_THRESHOLD = 2600;

export function Shelf({ books, justAdded = null }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [open, setOpen] = useState<{ index: number; rect: SpineRect } | null>(null);

  const scrollShelf = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(420, scroller.clientWidth * 0.72), behavior: "smooth" });
  }, []);

  const totalWidth = books.reduce((a, b) => a + b.width + 2, 0);
  const copies = totalWidth > LOOP_THRESHOLD ? 3 : 1;
  const rendered = copies === 3 ? [...books, ...books, ...books] : books;

  const [range, setRange] = useState({ s: 0, e: 60 });
  // cached geometry so scrolling never forces a layout read per book
  const geo = useRef<{ els: HTMLElement[]; mid: number[] } | null>(null);
  const raf = useRef<number | null>(null);

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const els = Array.from(scroller.querySelectorAll<HTMLElement>("[data-spine]"));
    geo.current = { els, mid: els.map((el) => el.offsetLeft + el.offsetWidth / 2) };
  }, []);

  const paint = useCallback(() => {
    const scroller = scrollerRef.current;
    const g = geo.current;
    if (!scroller || !g) return;
    const half = scroller.clientWidth / 2;
    const center = scroller.scrollLeft + half;
    let first = -1;
    let last = -1;
    for (let i = 0; i < g.els.length; i++) {
      const d = g.mid[i]! - center;
      if (Math.abs(d) > half + 400) continue; // offscreen: skip
      if (first < 0) first = i;
      last = i;
      const t = Math.max(-1, Math.min(1, d / half));
      const ry = -Math.sign(t) * Math.pow(Math.abs(t), 1.35) * 34;
      g.els[i]!.style.setProperty("--ry", `${ry}deg`);
    }
    if (first >= 0) {
      setRange((r) => (Math.abs(r.s - first) > 4 || Math.abs(r.e - last) > 4 ? { s: first, e: last } : r));
    }
  }, []);

  const curve = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      paint();
    });
  }, [paint]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (copies === 3) scroller.scrollLeft = scroller.scrollWidth / 3;
    measure();
    curve();
  }, [copies, curve, measure, books.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (copies === 3) {
        const seg = scroller.scrollWidth / 3;
        if (scroller.scrollLeft < seg * 0.5) scroller.scrollLeft += seg;
        else if (scroller.scrollLeft > seg * 1.5) scroller.scrollLeft -= seg;
      }
      curve();
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scroller.scrollLeft += e.deltaY * 1.65;
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", curve);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", curve);
    };
  }, [copies, curve]);

  useEffect(() => {
    const row = rowRef.current;
    const scroller = scrollerRef.current;
    if (!row || !scroller) return;
    const ro = new ResizeObserver(() => {
      setOverflowing(row.scrollWidth > scroller.clientWidth + 4);
      measure();
      curve();
    });
    ro.observe(row);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [curve, measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      if (e.key === "ArrowLeft") scroller.scrollLeft -= 320;
      if (e.key === "ArrowRight") scroller.scrollLeft += 320;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!justAdded) return;
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-id="${justAdded}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [justAdded]);

  // drag to scroll
  const drag = useRef<{ x: number; left: number } | null>(null);

  const openAt = (index: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setOpen({ index: index % books.length, rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="no-scrollbar overflow-x-auto overflow-y-hidden pt-16 pb-6"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 65%" }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, left: scrollerRef.current?.scrollLeft ?? 0 };
        }}
        onPointerMove={(e) => {
          if (!drag.current || !scrollerRef.current) return;
          if (e.buttons !== 1) return;
          scrollerRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <div
          ref={rowRef}
          className={`flex items-end gap-[2px] px-10 ${overflowing ? "" : "justify-center"}`}
          style={{ transformStyle: "preserve-3d", minWidth: overflowing ? "max-content" : "100%" }}
        >
          {rendered.map((book, i) => (
            <div
              key={`${book.id}-${i}`}
              data-spine
              data-id={book.id}
              className={justAdded === book.id ? "animate-shelve-in" : undefined}
              style={
                {
                  "--ry": "0deg",
                  "--spine-w": `${book.width}px`,
                  transformStyle: "preserve-3d",
                } as React.CSSProperties
              }
            >
              <BookSpine book={book} onOpen={(el) => openAt(i, el)} />
            </div>
          ))}
        </div>
      </div>

      {overflowing ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Scroll shelf left"
            title="Scroll shelf left"
            onClick={() => scrollShelf(-1)}
            className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border-foreground/20 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Scroll shelf right"
            title="Scroll shelf right"
            onClick={() => scrollShelf(1)}
            className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border-foreground/20 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Button>
        </>
      ) : null}

      <div className="mx-10 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
      <div className="mx-10 h-8 bg-gradient-to-b from-foreground/8 to-transparent" />

      {open ? (
        <BookDetail
          books={books}
          index={open.index}
          rect={open.rect}
          onIndex={(i) => setOpen((o) => (o ? { ...o, index: i } : o))}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
