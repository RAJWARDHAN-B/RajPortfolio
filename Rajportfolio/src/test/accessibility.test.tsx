import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ContentRow from "@/components/ContentRow";
import SearchResults from "@/components/SearchResults";
import NetflixIntro from "@/components/NetflixIntro";
import NetflixNav from "@/components/NetflixNav";
import { experienceItems, projectItems } from "@/data/portfolio";

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
afterAll(() => vi.unstubAllGlobals());

describe("accessible portfolio interactions", () => {
  it("opens a named dialog from a card and returns focus on Escape", async () => {
    const item = projectItems.find((project) => project.url);
    if (!item) throw new Error("A project with a URL is required");

    render(<ContentRow title="Projects" items={[item]} />);
    const card = screen.getByRole("button", { name: `View details for ${item.title}` });
    card.focus();
    fireEvent.click(card);

    const dialog = screen.getByRole("dialog", { name: item.title });
    const link = within(dialog).getByRole("link", { name: "View" });
    expect(link).toHaveAttribute("href", item.url);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement ?? dialog, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(card).toHaveFocus());
  });

  it("opens search results as buttons and omits the view action when there is no link", () => {
    const item = experienceItems.find((experience) => !experience.url);
    if (!item) throw new Error("An experience without a URL is required");

    render(<SearchResults query={item.title} items={[item]} />);
    fireEvent.click(screen.getByRole("button", { name: `View details for ${item.title}` }));
    const dialog = screen.getByRole("dialog", { name: item.title });
    expect(within(dialog).queryByRole("link", { name: "View" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("skips the intro without replaying audio or completing later", () => {
    vi.useFakeTimers();
    const audio = { volume: 0, paused: true, play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() };
    vi.stubGlobal("Audio", vi.fn(() => audio));
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    const { unmount } = render(<NetflixIntro onComplete={onComplete} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(audio.play).toHaveBeenCalledOnce();
    unmount();
    vi.advanceTimersByTime(5000);
    expect(onComplete).not.toHaveBeenCalled();
    expect(audio.pause).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("immediately completes the intro for reduced-motion users", () => {
    const matchMedia = vi.spyOn(window, "matchMedia");
    matchMedia.mockReturnValue({ ...window.matchMedia(""), matches: true });
    const onComplete = vi.fn();

    render(<NetflixIntro onComplete={onComplete} onSkip={vi.fn()} />);
    expect(onComplete).toHaveBeenCalledOnce();
    matchMedia.mockRestore();
  });

  it("makes search controls keyboard accessible and clears search on Escape", () => {
    const onSearch = vi.fn();
    render(<NetflixNav onSearch={onSearch} />);

    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    const input = screen.getByRole("searchbox", { name: "Search portfolio" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "React" } });
    expect(onSearch).toHaveBeenLastCalledWith("React");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSearch).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveFocus();
    expect(screen.queryByText("Sign Out of Portfolio")).not.toBeInTheDocument();
  });
});
