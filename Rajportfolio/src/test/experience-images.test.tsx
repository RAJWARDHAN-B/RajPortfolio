import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ContentRow from "@/components/ContentRow";
import SearchResults from "@/components/SearchResults";
import { experienceItems } from "@/data/portfolio";

afterEach(cleanup);

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterAll(() => vi.unstubAllGlobals());

describe("experience imagery", () => {
  it("shows the supplied logo without cropping in experience cards and details", () => {
    const michelin = experienceItems.find((item) => item.title.includes("@ Michelin"));
    expect(michelin).toBeDefined();
    if (!michelin) throw new Error("Michelin experience is missing");

    render(<ContentRow title="Experience" items={[michelin]} />);
    const image = screen.getByAltText("Michelin logo");
    expect(image).toHaveClass("object-contain");
    fireEvent.click(image);

    const dialog = screen.getByRole("dialog", { name: michelin.title });
    expect(within(dialog).getByAltText("Michelin logo")).toHaveClass("object-contain");
  });

  it("shows the supplied Learncraft experience in search and its details", () => {
    render(<SearchResults query="Learncraft" items={experienceItems} />);

    const image = screen.getByAltText("Learncraft logo");
    expect(image).toHaveClass("object-contain");
    fireEvent.click(image);

    expect(within(screen.getByRole("dialog")).getByAltText("Learncraft logo")).toHaveClass("object-contain");
    expect(screen.getByText("Created an online learning platform with various courses using React.")).toBeInTheDocument();
  });
});
