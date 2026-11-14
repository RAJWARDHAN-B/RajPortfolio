import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StrangerThings3D from "@/components/StrangerThings3D";
import { projectItems } from "@/data/portfolio";

vi.mock("@/components/StrangerThingsScene", () => ({
  default: ({ mode, initialMode, onContextLost }: {
    mode: string;
    initialMode: string;
    onContextLost: () => void;
  }) => (
    <div>
      <span>Scene: {mode}, started: {initialMode}</span>
      <button onClick={onContextLost}>Simulate context loss</button>
    </div>
  ),
}));

afterEach(cleanup);

describe("3D project world", () => {
  it("offers every project without loading the scene and restores focus after details", async () => {
    render(<StrangerThings3D />);
    const item = projectItems[projectItems.length - 1];
    const button = screen.getByRole("button", { name: item.title });
    expect(screen.queryByText(/Scene:/)).not.toBeInTheDocument();
    button.focus();
    fireEvent.click(button);
    const dialog = screen.getByRole("dialog", { name: item.title });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(button).toHaveFocus());
  });

  it("starts on foot when skipping the drive and switches travel modes", async () => {
    render(<StrangerThings3D />);
    fireEvent.click(screen.getByRole("button", { name: "Skip the drive" }));
    expect(await screen.findByText("Scene: walk, started: walk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Return to car" }));
    expect(screen.getByText("Scene: drive, started: walk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Get out of car" }));
    expect(screen.getByText("Scene: walk, started: walk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exit world" }));
    expect(screen.queryByText(/Scene:/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Enter by car" })).toHaveFocus());
  });

  it("keeps projects available when the WebGL context is lost", async () => {
    render(<StrangerThings3D />);
    fireEvent.click(screen.getByRole("button", { name: "Enter by car" }));
    expect(await screen.findByText("Scene: drive, started: drive")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simulate context loss" }));
    expect(screen.getByRole("alert")).toHaveTextContent("3D display was interrupted");
    fireEvent.click(screen.getByRole("button", { name: projectItems[0].title }));
    expect(screen.getByRole("dialog", { name: projectItems[0].title })).toBeInTheDocument();
  });
});
