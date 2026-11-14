import { describe, expect, it } from "vitest";
import {
  certificationItems,
  experienceItems,
  languageItems,
  projectItems,
  publicationItems,
  skillItems,
  techStackItems,
} from "@/data/portfolio";

describe("portfolio content", () => {
  it("uses unique IDs across the combined search catalogue", () => {
    const items = [
      ...projectItems,
      ...experienceItems,
      ...techStackItems,
      ...languageItems,
      ...skillItems,
      ...certificationItems,
      ...publicationItems,
    ];
    const ids = items.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
