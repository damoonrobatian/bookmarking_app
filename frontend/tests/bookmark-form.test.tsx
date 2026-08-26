import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BookmarkFormDialog } from "@/features/bookmarks/BookmarkFormDialog";

describe("bookmark creation", () => {
  it("lets the user enter a URL and title", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => [],
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkFormDialog open onOpenChange={() => undefined} title="Add bookmark" onSubmit={onSubmit} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.type(screen.getByLabelText("URL"), "https://fastapi.tiangolo.com/");
    await user.type(screen.getByLabelText("Title"), "FastAPI");
    await user.click(screen.getByRole("button", { name: "Save bookmark" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
