import { removeAnchor } from "../popularity";

describe("Cdtn popularity", () => {
  it("removeAnchor should return the website url", async () => {
    const res = removeAnchor(
      "CDTN/outil/préavis-demission?xtor=AD-1-[]-[]-[]-[AMNET]-[]-[]\n"
    );
    expect(res).toBe("cdtn/outil/préavis-demission");
  });
  it("removeAnchor should return the website url s", async () => {
    const res = removeAnchor(
      "information/indemnite-inflation-infographies?test"
    );
    expect(res).toBe("information/indemnite-inflation-infographies");
  });
  it("removeAnchor should return the website before ? and #", async () => {
    const res = removeAnchor("convention-collective#santé#travail?tests");
    expect(res).toBe("convention-collective");
  });
});
