import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "@/features/tags/TagInput";

const suggestions = [
  { id: "1", name: "react", created_at: "" },
  { id: "2", name: "reading", created_at: "" },
];

describe("tag input", () => {
  it("moves the highlight through suggestions with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} suggestions={suggestions} />);
    const field = screen.getByLabelText("Add Tag");
    await user.type(field, "re");
    const react = await screen.findByRole("option", { name: "react" });
    const reading = screen.getByRole("option", { name: "reading" });
    expect(react).toHaveAttribute("aria-selected", "false");
    await user.keyboard("{ArrowDown}");
    expect(react).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    expect(reading).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(["reading"]);
  });
});
