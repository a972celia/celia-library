import { describe, expect, test } from "bun:test";
import { books } from "./books";
import { toRead } from "./toRead";

describe("October 2026 Goodreads update", () => {
  test("includes 118 read and three currently-reading books", () => {
    expect(books).toHaveLength(121);
    expect(books.filter((book) => book.finished === "Currently reading")).toHaveLength(3);
  });

  test("includes all 38 to-read books", () => {
    expect(toRead).toHaveLength(38);
    expect(toRead.every((book) => book.finished === "Want to read")).toBe(true);
    expect(toRead[0]?.title).toBe("East of Eden");
  });

  test("imports the latest reading date and fractional rating", () => {
    const book = books.find((book) => book.goodreadsId === "45152372");
    expect(book?.finished).toBe("Oct 2026");
    expect(book?.rating).toBe(3.75);
  });

  test("moves The Code from currently reading to completed", () => {
    const book = books.find((book) => book.title.startsWith("The Code:"));
    expect(book?.finished).toBe("Oct 2026");
    expect(book?.rating).toBe(4);
  });

  test("updates The Wedding People rating", () => {
    expect(books.find((book) => book.title === "The Wedding People")?.rating).toBe(5);
  });

  test("retains the reviewed Remarkably Bright Creatures cover", () => {
    expect(books.find((book) => book.title === "Remarkably Bright Creatures")?.cover)
      .toBe("https://covers.openlibrary.org/b/id/14809692-L.jpg");
  });

  test("retains Think Again identity despite author name changes", () => {
    const matches = books.filter((book) => book.title.startsWith("Think Again:"));
    expect(matches).toHaveLength(1);
    expect(matches[0]?.author).toBe("Adam  Grant");
    expect(matches[0]?.id).toBe("think-again-the-power-of-knowi-74");
  });

  test("stores unique Goodreads identities across both shelves", () => {
    const ids = [...books, ...toRead].map((book) => book.goodreadsId);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(159);
  });
});