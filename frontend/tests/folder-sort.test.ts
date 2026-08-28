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
  const apple = folder({ id: "a", name: "Apple", position: 0, created_at: "2026-01-01T00:00:00Z" });
  const banana = folder({ id: "b", name: "Banana", position: 1, created_at: "2026-06-01T00:00:00Z" });

  it("sorts recently added newest first", () => {
    expect(sortedFolders([apple, banana], "created_at").map((item) => item.name)).toEqual(["Banana", "Apple"]);
  });

  it("sorts titles A to Z", () => {
    expect(sortedFolders([banana, apple], "name").map((item) => item.name)).toEqual(["Apple", "Banana"]);
  });
});

describe("folderSortFromStorage", () => {
  afterEach(() => {
    localStorage.removeItem("neshanak.folderSort");
  });

  it("defaults to recently added, like bookmarks", () => {
    expect(folderSortFromStorage()).toBe("created_at");
  });

  it("reads a stored sort", () => {
    localStorage.setItem("neshanak.folderSort", "name");
    expect(folderSortFromStorage()).toBe("name");
  });

  it("ignores unknown values, including the old added-order key", () => {
    expect(isFolderSort("title")).toBe(false);
    expect(isFolderSort("position")).toBe(false);
    localStorage.setItem("neshanak.folderSort", "position");
    expect(folderSortFromStorage()).toBe("created_at");
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
