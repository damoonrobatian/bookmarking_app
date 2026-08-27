import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SettingsPage } from "@/pages/SettingsPage";

function renderSettings(path = "/settings") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:section" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("settings", () => {
  it("lists options without password fields until one is chosen", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(screen.getByRole("link", { name: /Change Password/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Change Password/ }));
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("explains three methods and keeps browser steps independent", async () => {
    const user = userEvent.setup();
    renderSettings("/settings/save-from-browser");

    expect(screen.getByText(/There are three ways to add a save button/)).toBeInTheDocument();
    expect(screen.getByText(/The first way is the easiest/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1. Drag To The Bookmarks Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2. Button Next To The Address Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3. Bookmarks Bar Button With Icon" })).toBeInTheDocument();
    expect(screen.getByText(/It works in Google Chrome and Mozilla Firefox/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Drag me to the bookmarks bar" });
    expect(link.querySelector("img")).toBeNull();
    expect(link.getAttribute("href") ?? "").toMatch(/^javascript:/);

    const chromeButtons = screen.getAllByRole("button", { name: "Chrome or Edge" });
    const firefoxButtons = screen.getAllByRole("button", { name: "Firefox" });
    expect(chromeButtons).toHaveLength(2);
    expect(firefoxButtons).toHaveLength(2);
    expect(chromeButtons[0]).toHaveAttribute("aria-pressed", "true");
    expect(chromeButtons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("chrome://extensions")).toBeInTheDocument();
    expect(screen.getByText(/Other Bookmarks/)).toBeInTheDocument();
    expect(screen.queryByText("about:debugging")).not.toBeInTheDocument();
    expect(screen.queryByText(/Import Bookmarks from HTML/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download bar button" })).toBeInTheDocument();

    await user.click(firefoxButtons[0]);
    expect(firefoxButtons[0]).toHaveAttribute("aria-pressed", "true");
    expect(chromeButtons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("about:debugging")).toBeInTheDocument();
    expect(screen.queryByText("chrome://extensions")).not.toBeInTheDocument();
    expect(screen.getByText(/Other Bookmarks/)).toBeInTheDocument();

    await user.click(firefoxButtons[1]);
    expect(firefoxButtons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Import Bookmarks from HTML/)).toBeInTheDocument();
    expect(screen.queryByText(/Other Bookmarks/)).not.toBeInTheDocument();
  });
});
