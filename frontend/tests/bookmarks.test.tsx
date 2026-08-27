import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BookmarkCollection } from "@/features/bookmarks/BookmarkCollection";
import type { Bookmark } from "@/types";

const sample: Bookmark = {
  id: "1",
  folder_id: null,
  url: "https://react.dev/",
  normalized_url: "https://react.dev",
  title: "React documentation",
  description: "Learn React",
  notes: null,
  favicon_url: null,
  page_domain: "react.dev",
  metadata_status: "ok",
  is_favorite: false,
  is_archived: false,
  visit_count: 0,
  last_visited_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  tags: [{ id: "t1", name: "docs", created_at: "2026-01-01T00:00:00Z" }],
  folder: null,
};

function renderCollection(items: Bookmark[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ items, page: 1, page_size: 50, total: items.length }),
    }),
  );
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BookmarkCollection
          title="All Bookmarks"
          emptyTitle="You Haven't Saved Any Bookmarks Yet."
          emptyDescription="Add Your First Bookmark To Start Building Your Collection."
          filters={{ archived: false }}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("bookmark list", () => {
  it("renders bookmarks", async () => {
    renderCollection([sample]);
    expect(await screen.findByText("React documentation")).toBeInTheDocument();
    expect(screen.getByText("react.dev")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy URL" })).toBeInTheDocument();
  });

  it("copies the bookmark URL", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderCollection([sample]);
    await screen.findByText("React documentation");
    await user.click(screen.getByRole("button", { name: "Copy URL" }));
    expect(writeText).toHaveBeenCalledWith("https://react.dev/");
  });

  it("shows an empty state", async () => {
    renderCollection([]);
    expect(await screen.findByText("You Haven't Saved Any Bookmarks Yet.")).toBeInTheDocument();
  });

  it("can render a search empty state", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ items: [], page: 1, page_size: 50, total: 0 }),
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkCollection
            title="Search"
            emptyTitle="No Bookmarks Match Your Search."
            emptyDescription="Try A Different Title, URL, Note, Or Tag."
            filters={{ search: "missing", archived: false }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("No Bookmarks Match Your Search.")).toBeInTheDocument();
  });
});
