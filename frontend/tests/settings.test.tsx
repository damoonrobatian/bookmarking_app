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
    expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Change Password/ }));
    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("shows the logo on the bookmarklet you drag to the bar", () => {
    renderSettings("/settings/save-from-browser");
    const link = screen.getByRole("link", { name: "Save To Neshanak" });
    expect(link.querySelector("img")).toHaveAttribute("src", "/favicon-32.png");
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain("https://neshanak.ca/favicon.ico");
  });
});
