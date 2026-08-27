import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TagsPage } from "@/pages/TagsPage";

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

describe("tags page", () => {
  it("opens tag sets only for the folders that are selected", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path === "/api/folders") {
          return Promise.resolve(
            jsonResponse([
              {
                id: "f1",
                parent_id: null,
                name: "Work",
                position: 0,
                created_at: "",
                updated_at: "",
              },
            ]),
          );
        }
        if (path === "/api/tags/grouped") {
          return Promise.resolve(
            jsonResponse([
              {
                folder_id: "f1",
                folder_name: "Work",
                tags: [{ id: "t1", name: "docs", bookmark_count: 2 }],
              },
              {
                folder_id: null,
                folder_name: "No Folder",
                tags: [{ id: "t2", name: "news", bookmark_count: 1 }],
              },
            ]),
          );
        }
        return Promise.resolve(jsonResponse([]));
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <TagsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Select A Folder On The Left To Open Its Tags.")).toBeInTheDocument();
    await user.click(await screen.findByLabelText("Work"));
    expect(screen.getByRole("link", { name: /docs/ })).toHaveAttribute("href", "/app/folder/f1?tag=docs");
    expect(screen.queryByRole("link", { name: /news/ })).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("No Folder"));
    expect(screen.getByRole("link", { name: /news/ })).toHaveAttribute("href", "/app?tag=news");
  });
});
