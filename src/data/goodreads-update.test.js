import { describe, expect, test } from "bun:test";
import { books } from "./books";
import { toRead } from "./toRead";
import midnightTrainCover from "../assets/midnight-train-goodreads.asset.json";
import streetwiseCover from "../assets/streetwise-goodreads.asset.json";

describe("October 2026 Goodreads update", () => {
  test("uses the verified Goodreads cover for The Midnight Train", () => {
    expect(books.find((book) => book.goodreadsId === "242380266")?.cover)
      .toBe(midnightTrainCover.url);
  });

  test("uses the verified Goodreads cover for Streetwise", () => {
    expect(books.find((book) => book.goodreadsId === "235699101")?.cover)
      .toBe(streetwiseCover.url);
  });
  test.skip("includes 118 read and three currently-reading books", () => {
    expect(books).toHaveLength(121);
    expect(books.filter((book) => book.finished === "Currently reading")).toHaveLength(3);
  });

  test.skip("includes all 38 to-read books", () => {
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
describe("November 2026 Goodreads update", () => {
  test("has 120 read, 3 currently reading, 36 to-read", () => {
    expect(books).toHaveLength(123);
    expect(books.filter((b) => b.finished === "Currently reading")).toHaveLength(3);
    expect(toRead).toHaveLength(36);
  });
  test("The Little Liar finished Nov 2026 rated 5", () => {
    const b = books.find((b) => b.goodreadsId === "112975105");
    expect(b?.finished).toBe("Nov 2026");
    expect(b?.rating).toBe(5);
  });
  test("Heart the Lover moved to main shelf, rated 3.25", () => {
    expect(toRead.some((b) => b.goodreadsId === "228110489")).toBe(false);
    expect(books.find((b) => b.goodreadsId === "228110489")?.rating).toBe(3.25);
  });
  test("Circe is currently reading", () => {
    expect(books.find((b) => b.goodreadsId === "35959740")?.finished).toBe("Currently reading");
  });
  test("Funny Story (did not finish) is excluded", () => {
    expect([...books, ...toRead].some((b) => b.goodreadsId === "194802722")).toBe(false);
  });
});
