import type { Book } from "@/data/books";

export type OLResult = {
  key: string;
  title: string;
  author: string;
  year: number;
  cover: string;
  pages: number;
  publisher: string;
};

export async function searchBooks(q: string, signal?: AbortSignal): Promise<OLResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "12");
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,publisher",
  );
  const res = await fetch(url.toString(), signal ? { signal } : {});
  if (!res.ok) throw new Error("Open Library is not responding.");
  const data = (await res.json()) as { docs?: Array<Record<string, unknown>> };
  return (data.docs ?? [])
    .filter((d) => d["title"] && d["cover_i"])
    .map((d) => ({
      key: String(d["key"] ?? ""),
      title: String(d["title"]),
      author: Array.isArray(d["author_name"]) ? String((d["author_name"] as string[])[0]) : "Unknown",
      year: Number(d["first_publish_year"] ?? 0),
      cover: `https://covers.openlibrary.org/b/id/${d["cover_i"]}-L.jpg`,
      pages: Number(d["number_of_pages_median"] ?? 300),
      publisher: Array.isArray(d["publisher"]) ? String((d["publisher"] as string[])[0]) : "",
    }));
}

type Palette = { spine: string; band?: string | undefined; ink: string };

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

export function readCoverPalette(src: string): Promise<Palette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const w = 80;
        const h = Math.max(1, Math.round((img.height / img.width) * w));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const edgeW = Math.max(1, Math.round(w * 0.06));
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < edgeW; x++) {
            const i = (y * w + x) * 4;
            r += data[i]!;
            g += data[i + 1]!;
            b += data[i + 2]!;
            n++;
          }
        }
        r /= n;
        g /= n;
        b /= n;
        let best: [number, number, number] | null = null;
        let bestSat = 0.18;
        for (let i = 0; i < data.length; i += 4 * 3) {
          const R = data[i]! / 255;
          const G = data[i + 1]! / 255;
          const B = data[i + 2]! / 255;
          const max = Math.max(R, G, B);
          const min = Math.min(R, G, B);
          const l = (max + min) / 2;
          if (l < 0.25 || l > 0.75) continue;
          const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
          if (s > bestSat) {
            bestSat = s;
            best = [data[i]!, data[i + 1]!, data[i + 2]!];
          }
        }
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        resolve({
          spine: hex(r, g, b),
          band: best ? hex(best[0], best[1], best[2]) : undefined,
          ink: lum > 0.55 ? "#241f19" : "#faf7f0",
        });
      } catch {
        resolve(null);
      }
    };
    img.src = src;
  });
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export async function buildBook(r: OLResult): Promise<Omit<Book, "id" | "blurb" | "finished" | "rating">> {
  const hv = hash(r.key || r.title);
  const pages = r.pages || 300;
  const binding: Book["binding"] = pages > 420 ? "hardcover" : pages < 260 ? "mass" : "paperback";
  const finish: Book["finish"] = binding === "hardcover" ? "cloth" : hv % 2 ? "gloss" : "matte";
  const height =
    binding === "hardcover" ? 236 + (hv % 19) : binding === "mass" ? 196 + (hv % 15) : 214 + (hv % 17);
  const width = Math.max(16, Math.min(58, Math.round(pages * 0.055 + ((hv % 7) - 3))));
  const pal: Palette = (await readCoverPalette(r.cover)) ?? {
    spine: `hsl(${hv % 360} 26% 30%)`,
    ink: "#faf7f0",
  };

  return {
    title: r.title,
    author: r.author,
    genres: [],
    cover: r.cover,
    year: r.year,
    publisher: r.publisher,
    binding,
    finish,
    spine: pal.spine,
    ...(pal.band ? { band: pal.band } : {}),
    ink: pal.ink,
    face: (["serif", "sans", "mono", "serif"] as const)[hv % 4]!,
    caps: hv % 3 === 0,
    width,
    height,
    lean: Math.round((-5 + (hv % 51) / 10) * 10) / 10,
    depth: Math.round((-7 + (hv % 141) / 10) * 10) / 10,
    wear: Math.round((hv % 36)) / 100,
  };
}
