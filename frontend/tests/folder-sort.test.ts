import { compareFolders, folderSortFromStorage, isFolderSort, sortedFolders, type FolderSort } from "@/utils/folderSort";
import type { Folder } from "@/types";

function folder(overrides: Partial<Folder> & Pick<Folder, "id" | "name">): Folder {
  return {
    parent_id: null,
    position: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("compareFolders", () => {
  const zebra = folder({ id: "z", name: "Zebra", position: 0, created_at: "2026-01-01T00:00:00Z" });
  const apple = folder({ id: "a", name: "Apple", position: 1, created_at: "2026-06-01T00:00:00Z" });

  it("keeps added order by position", () => {
    expect(sortedFolders([apple, zebra], "position").map((item) => item.name)).toEqual(["Zebra", "Apple"]);
  });

  it("sorts names A to Z", () => {
    expect(sortedFolders([zebra, apple], "name").map((item) => item.name)).toEqual(["Apple", "Zebra"]);
  });

  it("sorts recently added newest first", () => {
    expect(sortedFolders([zebra, apple], "created_at").map((item) => item.name)).toEqual(["Apple", "Zebra"]);
  });
});

describe("folderSortFromStorage", () => {
  afterEach(() => {
    localStorage.removeItem("neshanak.folderSort");
  });

  it("defaults to added order", () => {
    expect(folderSortFromStorage()).toBe("position");
  });

  it("reads a stored sort", () => {
    localStorage.setItem("neshanak.folderSort", "name");
    expect(folderSortFromStorage()).toBe("name");
  });

  it("ignores unknown values", () => {
    expect(isFolderSort("title")).toBe(false);
    localStorage.setItem("neshanak.folderSort", "nope");
    expect(folderSortFromStorage()).toBe("position");
  });
});

describe("compareFolders name ties", () => {
  it("falls back to name when dates match", () => {
    const sort: FolderSort = "created_at";
    const a = folder({ id: "1", name: "Beta", created_at: "2026-01-01T00:00:00Z" });
    const b = folder({ id: "2", name: "Alpha", created_at: "2026-01-01T00:00:00Z" });
    expect(compareFolders(a, b, sort)).toBeGreaterThan(0);
  });
});
