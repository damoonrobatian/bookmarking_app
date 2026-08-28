import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";

const user = {
  id: "1",
  email: "ada@example.com",
  display_name: "Ada",
  theme: "terracotta",
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

function stubViewport(isDesktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: isDesktop && query.includes("min-width: 1024px"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  );
}

function renderLayout(path = "/app") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/auth/me") return Promise.resolve(jsonResponse(user));
      if (url === "/api/folders") return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse({}));
    }),
  );
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<div>All page</div>} />
            <Route path="/app/favorites" element={<div>Favorites page</div>} />
            <Route path="/settings" element={<div>Settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("overlay sidebar", () => {
  it("closes after choosing a destination on a narrow viewport", async () => {
    stubViewport(false);
    const events = userEvent.setup();
    renderLayout();
    await events.click(await screen.findByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close sidebar" })).toBeInTheDocument();
    await events.click(screen.getByRole("link", { name: "Favorites" }));
    expect(screen.getByText("Favorites page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close sidebar" })).not.toBeInTheDocument();
  });

  it("closes after choosing the page that is already open", async () => {
    stubViewport(false);
    const events = userEvent.setup();
    renderLayout("/app/favorites");
    await events.click(await screen.findByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close sidebar" })).toBeInTheDocument();
    await events.click(screen.getByRole("link", { name: "Favorites" }));
    expect(screen.queryByRole("button", { name: "Close sidebar" })).not.toBeInTheDocument();
  });
});
