import { describe, expect, it } from "vitest";
import { perPerson, collected, isDone, type Collecte } from "./collecte";

describe("répartition égale", () => {
  it("30 000 FCFA pour 6 participants = 5 000 FCFA chacun", () => {
    expect(perPerson(30000, 6)).toBe(5000);
  });
  it("arrondit au FCFA supérieur pour couvrir le total", () => {
    expect(perPerson(10000, 3)).toBe(3334);
  });
  it("0 participant = 0", () => {
    expect(perPerson(10000, 0)).toBe(0);
  });
});

describe("montant collecté", () => {
  const c: Collecte = {
    id: "x", title: "t", motif: "autre", total: 15000, createdBy: "a", createdAt: "", history: [],
    participants: [
      { id: "1", name: "A", amount: 5000, status: "paye" },
      { id: "2", name: "B", amount: 5000, status: "attente" },
      { id: "3", name: "C", amount: 5000, status: "paye" },
    ],
  };
  it("ne compte que les parts payées", () => {
    expect(collected(c)).toBe(10000);
    expect(isDone(c)).toBe(false);
  });
});
