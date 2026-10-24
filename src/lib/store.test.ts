import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collected, isDone } from "./collecte";

describe("événement de simulation Orange Money", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("propose un événement avec votre part encore impayée", async () => {
    const { useStore } = await import("./store");
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    expect(result.current?.motif).toBe("evenement");
    expect(result.current?.participants.find((p) => p.isMe)?.status).toBe("attente");
  });

  it("ajoute l'événement aux données existantes sans effacer les collectes", async () => {
    const existing = { id: "existing", title: "Ma collecte", participants: [] };
    localStorage.setItem("maxit-partage-v1", JSON.stringify({ collectes: [existing] }));
    const { hydrateStore, useStore } = await import("./store");
    await hydrateStore();
    const { result } = renderHook(() => useStore((s) => s.collectes));
    expect(result.current.map((c) => c.id)).toEqual(["soiree-joj", "existing"]);
    expect(result.current[1]).toEqual(existing);
  });

  it("enregistre le paiement simulé et le conserve après rechargement", async () => {
    const { actions, useStore } = await import("./store");
    const { result, unmount } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    
    // Pay is now async, must await it
    await act(async () => { 
      await actions.pay("soiree-joj", "me"); 
    });
    
    const event = result.current;
    if (!event) throw new Error("Événement absent");
    expect(event.participants.find((p) => p.isMe)?.status).toBe("paye");
    expect(collected(event)).toBe(event.total);
    expect(isDone(event)).toBe(true);
    
    unmount();
    vi.resetModules();
    
    const reloaded = await import("./store");
    await reloaded.hydrateStore();
    const restored = renderHook(() => reloaded.useStore((s) => s.collectes.find((c) => c.id === "soiree-joj")));
    expect(restored.result.current?.participants.find((p) => p.isMe)?.status).toBe("paye");
  });

  it("crée une collecte et l'ajoute au store", async () => {
    const { actions, useStore } = await import("./store");
    
    // Set up draft
    act(() => {
      actions.updateDraft({
        motif: "anniversaire",
        title: "Test Anniversaire",
        total: 10000,
        count: 3,
        split: "egale",
        deadline: "2026-12-31",
        names: ["Fatou", "Mamadou"],
        phones: ["771234567", "779876543"],
      });
    });

    // createFromDraft is now async
    let collecteId: string = "";
    await act(async () => {
      collecteId = await actions.createFromDraft();
    });

    expect(collecteId).toBeTruthy();
    
    const { result } = renderHook(() => useStore((s) => s.collectes.find((c) => c.id === collecteId)));
    expect(result.current?.title).toBe("Test Anniversaire");
    expect(result.current?.total).toBe(10000);
    expect(result.current?.participants.length).toBe(3);
  });
});
