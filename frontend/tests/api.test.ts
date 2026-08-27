import { apiFetch } from "@/services/api";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  };
}

describe("apiFetch", () => {
  it("refreshes the session when /api/auth/me returns 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Not Authenticated." }))
      .mockResolvedValueOnce(jsonResponse(200, { email: "ada@example.com" }))
      .mockResolvedValueOnce(jsonResponse(200, { email: "ada@example.com", display_name: "Ada" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/auth/me")).resolves.toMatchObject({
      email: "ada@example.com",
      display_name: "Ada",
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/me");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/auth/me");
  });

  it("does not refresh after a failed login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { detail: "Invalid Email Or Password." }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/auth/login", { method: "POST", body: "{}" })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
