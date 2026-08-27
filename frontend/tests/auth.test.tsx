import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";

function renderWithProviders(ui: ReactElement, path = "/login") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("login form", () => {
  it("submits credentials and shows errors", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid email or password." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      email: "ada@example.com",
      password: "wrong-password",
      remember_me: true,
    });
  });

  it("sends remember_me false when the checkbox is cleared", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid email or password." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByLabelText("Remember me"));
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("alert");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      remember_me: false,
    });
  });

  it("keeps a save return path on the create-account link", () => {
    renderWithProviders(
      <LoginForm />,
      "/login?next=%2Fsave%3Furl%3Dhttps%253A%252F%252Freact.dev%252Flearn",
    );
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register?next=%2Fsave%3Furl%3Dhttps%253A%252F%252Freact.dev%252Flearn",
    );
  });

  it("reveals the password when Show password is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");
    await user.type(field, "secret-password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveValue("secret-password");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field).toHaveAttribute("type", "password");
  });
});

describe("register form", () => {
  it("requires a name, email, and password", () => {
    renderWithProviders(<RegisterForm />, "/register");
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });
});

describe("change password form", () => {
  it("does not invite the browser to fill the current password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />, "/settings");
    const current = screen.getByLabelText("Current password");
    expect(current).toHaveValue("");
    expect(current).toHaveAttribute("autocomplete", "off");
    expect(current).toHaveAttribute("readonly");
    await user.click(current);
    expect(current).not.toHaveAttribute("readonly");
  });
});
