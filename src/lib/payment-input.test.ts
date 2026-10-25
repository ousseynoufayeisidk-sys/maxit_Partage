import { describe, expect, it } from "vitest";
import { displayPhone, nationalPhone } from "./payment-input";

describe("numéro Orange Money", () => {
  it("sépare l'indicatif du numéro prérempli", () => {
    expect(nationalPhone("+221 77 123 45 67")).toBe("771234567");
    expect(displayPhone("+221 77 123 45 67")).toBe("77 123 45 67");
  });
  it("accepte un numéro international collé", () => {
    expect(nationalPhone("00221 77 116 01 08")).toBe("771160108");
  });
  it("retire les lettres et limite la saisie au numéro national", () => {
    expect(nationalPhone("77abc1234567890")).toBe("771234567");
  });
});