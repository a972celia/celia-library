import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Book } from "@/data/books";
import { COVER_W, faceFont, finishSheen, textureImage } from "./bookFaces";

const PULL = 96;
const LIFT = -26;

type Props = {
  book: Book;
  onOpen: (el: HTMLElement) => void;
};

export function BookSpine({ book, onOpen }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  const [card, setCard] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
  }, []);

  const enter = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    const r = ref.current?.getBoundingClientRect();
    if (r) setCard({ left: r.left + r.width / 2, top: r.top - 14 });
    setHover(true);
  };

  const leave = () => {
    leaveTimer.current = window.setTimeout(() => {
      setHover(false);
      setCard(null);
    }, 90);
  };

  const lean = hover ? 0 : book.lean;
  const translateZ = (hover ? PULL : 0) + book.depth;
  const translateY = hover ? LIFT : 0;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`${book.title} by ${book.author}`}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={leave}
        onClick={() => ref.current && onOpen(ref.current)}
        className="relative shrink-0 cursor-pointer bg-transparent p-0 outline-none"
        style={{
          width: book.width,
          height: book.height,
          zIndex: hover ? 40 : 1,
          transformStyle: "preserve-3d",
        }}
      >
        <span
          className="absolute inset-0 block transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "bottom center",
            transform: `rotateY(var(--ry, 0deg)) rotateZ(${lean}deg) translateZ(${translateZ}px) translateY(${translateY}px)`,
          }}
        >
          {/* spine face */}
          <span
            className="absolute inset-0 overflow-hidden rounded-[2px]"
            style={{
              backgroundColor: book.spine,
              boxShadow: "0 18px 26px -18px rgba(40,30,20,0.55)",
            }}
          >
            {book.cover ? (
              <span
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage: `url(${book.cover})`,
                  backgroundSize: "auto 100%",
                  backgroundPosition: "left center",
                  filter: "saturate(0.9)",
                }}
              />
            ) : null}
            <span className="absolute inset-0" style={{ backgroundColor: book.spine, opacity: 0.74 }} />

            {book.band ? (
              <>
                <span className="absolute inset-x-0 top-3 h-[3px]" style={{ backgroundColor: book.band, opacity: 0.85 }} />
                <span
                  className="absolute inset-x-0 bottom-8 h-[3px]"
                  style={{ backgroundColor: book.band, opacity: 0.85 }}
                />
              </>
            ) : null}

            <span
              className={`absolute inset-x-0 top-8 bottom-10 flex items-center justify-center ${faceFont[book.face]}`}
              style={{ color: book.ink }}
            >
              <span
                className="whitespace-nowrap text-[11px] leading-none"
                style={{
                  writingMode: "vertical-rl",
                  letterSpacing: book.caps ? "0.12em" : "0.02em",
                  textTransform: book.caps ? "uppercase" : "none",
                  maxHeight: book.height - 84,
                  overflow: "hidden",
                }}
              >
                {book.title}
              </span>
            </span>

            {book.width >= 44 ? (
              <span
                className="absolute right-1 top-10 bottom-12 flex items-center font-mono text-[8px] opacity-70"
                style={{ color: book.ink, writingMode: "vertical-rl" }}
              >
                <span className="truncate">{book.author}</span>
              </span>
            ) : null}

            {book.width >= 30 && book.publisher ? (
              <span
                className="absolute inset-x-0 bottom-2 text-center font-mono text-[6px] uppercase tracking-widest opacity-60"
                style={{ color: book.ink }}
              >
                {book.publisher.slice(0, 10)}
              </span>
            ) : null}

            <span
              className="absolute inset-0 opacity-25 mix-blend-overlay"
              style={{ backgroundImage: textureImage }}
            />
            <span className="absolute inset-0" style={{ backgroundImage: finishSheen[book.finish] }} />
            <span
              className="absolute inset-0"
              style={{
                opacity: book.wear,
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,246,222,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 72%, rgba(60,40,20,0.5) 100%)",
              }}
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-[2px]"
              style={{ boxShadow: "inset 1px 0 0 rgba(255,255,255,0.18), inset -1px 0 0 rgba(0,0,0,0.25)" }}
            />
          </span>

          {/* page block on top */}
          <span
            className="pointer-events-none absolute left-0 top-0 origin-top"
            style={{
              width: book.width,
              height: COVER_W,
              transform: "rotateX(78deg)",
              background: "linear-gradient(180deg, #efe6d4 0%, #d9ccb4 60%, #c8b99e 100%)",
              transformOrigin: "top center",
            }}
          >
            {book.binding === "hardcover" ? (
              <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: book.band ?? book.spine }} />
            ) : null}
          </span>

          {/* hinged front cover */}
          <span
            className="pointer-events-none absolute top-0 left-full h-full overflow-hidden"
            style={{
              width: COVER_W,
              transformOrigin: "left center",
              transform: "rotateY(90deg)",
              backgroundColor: book.spine,
              backgroundImage: book.cover ? `url(${book.cover})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </span>
      </button>

      {hover && card
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[100] w-[248px] -translate-x-1/2 -translate-y-full rounded-md border border-border/70 bg-popover/95 p-4 shadow-xl backdrop-blur-sm"
              style={{ left: card.left, top: card.top }}
            >
              <p className="font-display text-[20px] leading-tight text-foreground">{book.title}</p>
              <p className="mt-1 text-[15px] italic text-muted-foreground">{book.author}</p>
              <p className="mt-2 font-mono text-[14px] uppercase tracking-wide text-muted-foreground">
                {[book.year || null, book.binding, book.rating ? `${book.rating}★` : "unrated"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {book.genres?.length ? (
                <p className="mt-1 text-[14px] text-primary">{book.genres.join(" / ")}</p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
