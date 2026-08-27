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
          <BookmarkFormDialog open onOpenChange={() => undefined} title="Add Bookmark" onSubmit={onSubmit} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.type(screen.getByLabelText("URL"), "https://fastapi.tiangolo.com/");
    await user.type(screen.getByLabelText("Title"), "FastAPI");
    await user.click(screen.getByRole("button", { name: "Save bookmark" }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("applies a suggested title and tags for an initial URL", async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path === "/api/bookmarks/preview") {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            json: async () => ({
              url: "https://react.dev/learn",
              title: "React Docs",
              description: "Learn React",
              favicon_url: null,
              page_domain: "react.dev",
              metadata_status: "ok",
              suggested_tags: ["javascript"],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [],
        });
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkFormDialog
            open
            variant="page"
            onOpenChange={() => undefined}
            title="Save Bookmark"
            initialUrl="https://react.dev/learn"
            initialTitle="React"
            onSubmit={onSubmit}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByDisplayValue("https://react.dev/learn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("React")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "javascript ×" }, { timeout: 2000 })).toBeInTheDocument();
  });

  it("creates a folder from the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const folders: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string, init?: RequestInit) => {
        if (path === "/api/folders" && init?.method === "POST") {
          const folder = {
            id: "folder-1",
            parent_id: null,
            name: "Reading",
            position: 0,
            created_at: "",
            updated_at: "",
          };
          folders.push(folder);
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            json: async () => folder,
          });
        }
        if (path === "/api/folders") {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => "application/json" },
            json: async () => folders,
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [],
        });
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BookmarkFormDialog open onOpenChange={() => undefined} title="Add Bookmark" onSubmit={onSubmit} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "New folder" }));
    await user.type(screen.getByLabelText("New folder name"), "Reading");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByRole("option", { name: "Reading" })).toBeInTheDocument();
    expect(screen.getByLabelText("Folder")).toHaveValue("folder-1");
  });
});
