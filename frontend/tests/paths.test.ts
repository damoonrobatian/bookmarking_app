import { safeInternalPath } from "@/utils/paths";

describe("safeInternalPath", () => {
  it("keeps in-app paths, including a save URL that contains https", () => {
    expect(safeInternalPath("/app")).toBe("/app");
    expect(safeInternalPath("/save?url=https://react.dev/learn&title=React")).toBe(
      "/save?url=https://react.dev/learn&title=React",
    );
  });

  it("rejects values that would leave the site", () => {
    expect(safeInternalPath("https://evil.example/")).toBe("/app");
    expect(safeInternalPath("//evil.example/phish")).toBe("/app");
    expect(safeInternalPath("/\\evil.example")).toBe("/app");
    expect(safeInternalPath(null)).toBe("/app");
  });
});
