import { getRateWith2decimalsGivenDenominatorAndNumerator } from "../../kpi";

describe("#getRateWith2decimalsGivenNumeratorAndDenominator", () => {
  it("should return 0 if denominator is 0", () => {
    // Given
    const numerator = 35;
    const denominator = 0;
    const expected = 0;
    // When
    const result = getRateWith2decimalsGivenDenominatorAndNumerator(
      denominator,
      numerator
    );

    // Then
    expect(result).toStrictEqual(expected);
  });
  it("should return 33.33 when numerator is 1 and denominator is 3", () => {
    // When
    const result = getRateWith2decimalsGivenDenominatorAndNumerator(3, 1);

    // Then
    expect(result).toStrictEqual(33.33);
  });
});
