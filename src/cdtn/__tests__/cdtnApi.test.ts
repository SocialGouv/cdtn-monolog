import { triggerSearch } from "../cdtnApi";

// TODO add mock here

describe("CDTN search API client", () => {
  it("should only count unique visits", async () => {
    const res = await triggerSearch("code du travail");
    expect(res.documents[0].algo).toBeDefined();
  });
});
