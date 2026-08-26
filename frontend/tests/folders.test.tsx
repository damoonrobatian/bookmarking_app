import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FolderTree } from "@/features/folders/FolderTree";

describe("folder navigation", () => {
  it("renders a folder hierarchy", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => [
          {
            id: "1",
            parent_id: null,
            name: "Work",
            position: 0,
            created_at: "",
            updated_at: "",
          },
          {
            id: "2",
            parent_id: "1",
            name: "Docs",
            position: 0,
            created_at: "",
            updated_at: "",
          },
        ],
      }),
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
});
