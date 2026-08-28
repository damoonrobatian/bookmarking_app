import { firstHttpUrl, savePageFromSearch } from "@/utils/saveShare";

describe("savePageFromSearch", () => {
  it("uses url and title query params from the bookmarklet", () => {
    const params = new URLSearchParams("url=https://react.dev/learn&title=React");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "React" });
  });

  it("reads an Android share that puts the page address in text", () => {
    const params = new URLSearchParams("title=React Docs&text=https://react.dev/learn");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "React Docs" });
  });

  it("pulls a URL out of a share message", () => {
    const params = new URLSearchParams("text=Look at this https://react.dev/learn please");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "Look at this please" });
  });
});

describe("firstHttpUrl", () => {
  it("ignores non-http schemes", () => {
    expect(firstHttpUrl("javascript:alert(1)")).toBeNull();
  });
});
