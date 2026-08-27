import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookmarkCollection } from "@/features/bookmarks/BookmarkCollection";

describe("loading and error states", () => {
  it("shows skeletons while loading", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => undefined)));
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkCollection
            title="All Bookmarks"
            emptyTitle="empty"
            emptyDescription="empty"
            filters={{}}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Loading your library")).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "The server is unavailable. Please try again." }),
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkCollection
            title="All Bookmarks"
            emptyTitle="empty"
            emptyDescription="empty"
            filters={{}}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load bookmarks");
  });
});
