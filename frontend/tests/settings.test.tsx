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

  it("separates save methods and shows only the chosen browser", async () => {
    const user = userEvent.setup();
    renderSettings("/settings/save-from-browser");

    expect(screen.getByRole("heading", { name: "1. Drag To The Bookmarks Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2. Button Next To The Address Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3. Bookmarks Bar Button With Icon" })).toBeInTheDocument();
    expect(screen.getByText(/Works without the Neshanak icon/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Save To Neshanak" });
    expect(link.querySelector("img")).toBeNull();
    expect(link.getAttribute("href") ?? "").toMatch(/^javascript:/);

    expect(screen.getByRole("button", { name: "Chrome or Edge", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("chrome://extensions")).toBeInTheDocument();
    expect(screen.getByText(/Other Bookmarks/)).toBeInTheDocument();
    expect(screen.queryByText("about:debugging")).not.toBeInTheDocument();
    expect(screen.queryByText(/Import Bookmarks from HTML/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download bar button" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Firefox" }));
    expect(screen.getByRole("button", { name: "Firefox", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("about:debugging")).toBeInTheDocument();
    expect(screen.getByText(/Import Bookmarks from HTML/)).toBeInTheDocument();
    expect(screen.queryByText("chrome://extensions")).not.toBeInTheDocument();
    expect(screen.queryByText(/Other Bookmarks/)).not.toBeInTheDocument();
  });
});
