import { displayTitle, looksLikeKeywordList } from "@/utils/title";

describe("displayTitle", () => {
  it("keeps a normal title and shortens a keyword dump to the first clause", () => {
    expect(looksLikeKeywordList("React Docs")).toBe(false);
    expect(displayTitle("React Docs")).toBe("React Docs");
    expect(
      displayTitle(
        "Register Domain, .ca Domain, Domain Registration Canada, Canadian Hosting",
      ),
    ).toBe("Register Domain");
  });
});
