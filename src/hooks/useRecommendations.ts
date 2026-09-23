import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Book } from "@/data/books";

type Row = {
  id: string;
  recommender: string;
  note: string | null;
  title: string;
  author: string;
  cover: string;
  year: number;
  publisher: string;
  binding: string;
  finish: string;
  spine: string;
  band: string | null;
  ink: string;
  face: string;
  caps: boolean;
  width: number;
  height: number;
  lean: number;
  depth: number;
  wear: number;
};

function toBook(r: Row): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    genres: [],
    cover: r.cover,
    year: r.year,
    blurb: r.note ?? "",
    rating: 0,
    finished: `Recommended by ${r.recommender}`,
    recommender: r.recommender,
    publisher: r.publisher,
    binding: r.binding as Book["binding"],
    finish: r.finish as Book["finish"],
    spine: r.spine,
    ...(r.band ? { band: r.band } : {}),
    ink: r.ink,
    face: r.face as Book["face"],
    caps: r.caps,
    width: r.width,
    height: r.height,
    lean: r.lean,
    depth: r.depth,
    wear: r.wear,
  };
}

export type RecommendInput = Omit<Row, "id">;

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (alive && data) setRecommendations((data as unknown as Row[]).map(toBook));
      });
    return () => {
      alive = false;
    };
  }, []);

  const recommend = useCallback(async (input: RecommendInput) => {
    const { data, error } = await supabase
      .from("recommendations")
      .insert(input as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const book = toBook(data as unknown as Row);
    setRecommendations((prev) => [book, ...prev]);
    setJustAdded(book.id);
    window.setTimeout(() => setJustAdded(null), 1400);
    return book;
  }, []);

  return { recommendations, justAdded, recommend };
}
