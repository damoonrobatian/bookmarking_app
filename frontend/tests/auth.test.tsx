import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
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
      json: async () => ({ detail: "Invalid Email Or Password." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid Email Or Password.");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      email: "ada@example.com",
      password: "wrong-password",
      remember_me: false,
    });
  });

  it("sends remember_me when the checkbox is checked", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid Email Or Password." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByLabelText("Remember Me"));
    await user.click(screen.getByRole("button", { name: "Sign In" }));
    await screen.findByRole("alert");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toMatchObject({
      remember_me: true,
    });
  });

  it("reveals the password when Show Password is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");
    await user.type(field, "secret-password");
    await user.click(screen.getByRole("button", { name: "Show Password" }));
    expect(field).toHaveAttribute("type", "text");
    expect(field).toHaveValue("secret-password");
    await user.click(screen.getByRole("button", { name: "Hide Password" }));
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
