import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { books } from "@/data/books";

const Input = z.object({ query: z.string().min(2).max(300) });

export const smartSearch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const catalogue = books
      .map(
        (b) =>
          `${b.id} :: ${b.title} :: ${b.author} :: ${b.year} :: ${(b.genres ?? []).join("/")} :: ${b.blurb.slice(0, 160)}`,
      )
      .join("\n");

    const fallback = () => {
      const q = data.query.toLowerCase();
      return {
        ids: books
          .filter((b) =>
            `${b.title} ${b.author} ${(b.genres ?? []).join(" ")} ${b.blurb}`.toLowerCase().includes(q),
          )
          .slice(0, 20)
          .map((b) => b.id),
      };
    };

    if (!apiKey) return fallback();

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You match a reader's natural-language request against a personal book catalogue. Each line is `id :: title :: author :: year :: genres :: blurb`. Reply with ONLY JSON: {\"ids\":[\"id1\",\"id2\"]}, best match first, at most 20 ids. Return an empty array if nothing fits.\n\nCATALOGUE:\n" +
                catalogue,
            },
            { role: "user", content: data.query },
          ],
        }),
      });

      if (res.status === 429) throw new Error("Too many searches — try again in a moment.");
      if (res.status === 402) throw new Error("Search credits exhausted.");
      if (!res.ok) throw new Error("Search is unavailable right now.");

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { ids?: unknown };
      const valid = new Set(books.map((b) => b.id));
      const ids = Array.isArray(parsed.ids)
        ? parsed.ids.filter((i): i is string => typeof i === "string" && valid.has(i)).slice(0, 20)
        : [];
      return { ids };
    } catch (err) {
      if (err instanceof Error && /searches|credits/.test(err.message)) throw err;
      return fallback();
    }
  });
