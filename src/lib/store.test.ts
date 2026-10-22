import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collected, isDone } from "./collecte";

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
});