import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SavePage } from "@/pages/SavePage";

const user = {
  id: "1",
  email: "ada@example.com",
  display_name: "Ada",
  created_at: "2026-01-01T00:00:00Z",
  last_login_at: null,
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

describe("save page", () => {
  it("fills the URL from the query string and applies preview title and tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path === "/api/auth/me") return Promise.resolve(jsonResponse(user));
        if (path === "/api/folders" || path === "/api/tags") return Promise.resolve(jsonResponse([]));
        if (path === "/api/bookmarks/preview") {
          return Promise.resolve(
            jsonResponse({
              url: "https://react.dev/learn",
              title: "React Docs",
              description: "Learn React",
              favicon_url: null,
              page_domain: "react.dev",
              metadata_status: "ok",
              suggested_tags: ["javascript", "react"],
            }),
          );
        }
        return Promise.resolve(jsonResponse({}));
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/save?url=https://react.dev/learn&title=React"]}>
          <Routes>
            <Route path="/save" element={<SavePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByDisplayValue("https://react.dev/learn")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByDisplayValue("React Docs")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    expect(await screen.findByRole("button", { name: "javascript ×" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "react ×" })).toBeInTheDocument();
  });
});
