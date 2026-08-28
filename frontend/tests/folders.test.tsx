import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FolderTree } from "@/features/folders/FolderTree";

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

describe("folder navigation", () => {
  afterEach(() => {
    localStorage.removeItem("neshanak.folderSort");
  });

  it("renders a folder hierarchy", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: "1",
            parent_id: null,
            name: "Work",
            position: 0,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "2",
            parent_id: "1",
            name: "Docs",
            position: 0,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <FolderTree />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });

  it("sorts sibling folders like bookmarks: recently added, then title", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: "1",
            parent_id: null,
            name: "Apple",
            position: 0,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "2",
            parent_id: null,
            name: "Banana",
            position: 1,
            created_at: "2026-06-01T00:00:00Z",
            updated_at: "2026-06-01T00:00:00Z",
          },
        ]),
      ),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <FolderTree />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const apple = await screen.findByRole("link", { name: "Apple" });
    const banana = screen.getByRole("link", { name: "Banana" });
    expect(banana.compareDocumentPosition(apple) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Sort folders"), "Title");
    expect(apple.compareDocumentPosition(banana) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Sort folders"), "Recently Added");
    expect(banana.compareDocumentPosition(apple) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
