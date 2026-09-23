import { useEffect, useState } from "react";

const FULL = "Welcome to my library";

export function TypedTitle() {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (n >= FULL.length) return;
    const t = setTimeout(() => setN((v) => v + 1), 95);
    return () => clearTimeout(t);
  }, [n]);

  const done = n >= FULL.length;

  return (
    <h1
      aria-label={FULL}
      className="font-display text-5xl font-light italic tracking-tight text-foreground sm:text-6xl"
    >
      <span aria-hidden="true">{FULL.slice(0, n)}</span>
      <span
        aria-hidden="true"
        className={done ? "animate-caret ml-1 font-thin not-italic opacity-60" : "ml-1 font-thin not-italic opacity-60"}
      >
        |
      </span>
    </h1>
  );
}
