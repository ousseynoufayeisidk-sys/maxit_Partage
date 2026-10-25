import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collected, contributed, isDone, remainingAmount } from "./collecte";

describe("événement de simulation Orange Money", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("propose un événement avec votre part encore impayée", async () => {
    const { useStore } = await import("./store");
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    expect(result.current?.motif).toBe("evenement");
    expect(result.current?.participants.find((p) => p.isMe)?.status).toBe("attente");
  });

  it("ajoute l’événement aux données existantes sans effacer les collectes", async () => {
    const existing = { id: "existing", title: "Ma collecte", participants: [] };
    localStorage.setItem("maxit-partage-v1", JSON.stringify({ collectes: [existing] }));
    const { hydrateStore, useStore } = await import("./store");
    hydrateStore();
    const { result } = renderHook(() => useStore((s) => s.collectes));
    expect(result.current.map((c) => c.id)).toEqual(["soiree-joj", "existing"]);
    expect(result.current[1]).toEqual(existing);
  });

  it("enregistre le paiement simulé et le conserve après rechargement", async () => {
    const { actions, useStore } = await import("./store");
    const { result, unmount } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    act(() => { actions.pay("soiree-joj", "me"); });
    const event = result.current;
    if (!event) throw new Error("Événement absent");
    expect(event.participants.find((p) => p.isMe)?.status).toBe("paye");
    expect(collected(event)).toBe(event.total);
    expect(isDone(event)).toBe(true);
    unmount();
    vi.resetModules();
    const reloaded = await import("./store");
    reloaded.hydrateStore();
    const restored = renderHook(() => reloaded.useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    expect(restored.result.current?.participants.find((p) => p.isMe)?.status).toBe("paye");
  });

  it("permet plusieurs versements et ne termine la part qu’au solde", async () => {
    const { actions, useStore } = await import("./store");
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    let firstRef = "";
    act(() => { firstRef = actions.pay("soiree-joj", "me", 2000); });
    const first = result.current;
    const me = first?.participants.find((p) => p.isMe);
    if (!first || !me) throw new Error("Événement absent");
    expect(contributed(me)).toBe(2000);
    expect(remainingAmount(me)).toBe(3000);
    expect(me.status).toBe("attente");
    expect(collected(first)).toBe(17000);
    expect(isDone(first)).toBe(false);
    act(() => { actions.pay("soiree-joj", "me", 3000); });
    const final = result.current;
    if (!final) throw new Error("Événement absent");
    expect(collected(final)).toBe(20000);
    expect(isDone(final)).toBe(true);
    expect(final.payments?.find((p) => p.ref === firstRef)?.amount).toBe(2000);
  });

  it("refuse les versements nuls, négatifs, décimaux et supérieurs au reste", async () => {
    const { actions, useStore } = await import("./store");
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    const before = result.current;
    for (const amount of [0, -1, 1.5, 5001, NaN, Infinity]) {
      act(() => { expect(actions.pay("soiree-joj", "me", amount)).toBe(""); });
      expect(result.current).toBe(before);
    }
  });

  it("conserve un versement partiel après rechargement", async () => {
    const { actions } = await import("./store");
    act(() => { actions.pay("soiree-joj", "me", 2000); });
    vi.resetModules();
    const restored = await import("./store");
    restored.hydrateStore();
    const { result } = renderHook(() => restored.useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    const me = result.current?.participants.find((p) => p.isMe);
    if (!me) throw new Error("Participant absent");
    expect(remainingAmount(me)).toBe(3000);
    expect(me.status).toBe("attente");
  });

  it("ne débite pas une part déjà réglée", async () => {
    const { actions, useStore } = await import("./store");
    act(() => { actions.pay("soiree-joj", "me"); });
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    act(() => { expect(actions.pay("soiree-joj", "me", 1)).toBe(""); });
    expect(result.current?.payments).toHaveLength(1);
  });
});