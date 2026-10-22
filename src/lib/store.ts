import { useSyncExternalStore } from "react";
import { perPerson, type Collecte, type Motif, type Participant } from "./collecte";

const KEY = "maxit-partage-v1";

export const ME = { name: "Ousmane Diallo", phone: "+221 77 123 45 67" };

const p = (id: string, name: string, amount: number, status: Participant["status"], isMe = false): Participant => ({
  id, name, amount, status, isMe,
});

const seed: Collecte[] = [
  {
    id: "soiree-joj", title: "Soirée d’ouverture des JOJ", motif: "evenement", total: 20000,
    deadline: "2026-10-31", createdBy: "Aminata", createdAt: "2026-10-22",
    message: "On se retrouve entre amis pour célébrer l’ouverture des Jeux à Dakar !",
    participants: [
      p("me", "Vous", 5000, "attente", true), p("awa", "Awa", 5000, "paye"),
      p("mam", "Mamadou", 5000, "paye"), p("kha", "Khady", 5000, "paye"),
    ],
    history: [
      { at: "2026-10-22", text: "Collecte créée par Aminata" },
      { at: "2026-10-22", text: "Awa, Mamadou et Khady ont payé leur part" },
    ],
  },
  {
    id: "fatou", title: "Anniversaire de Fatou", motif: "anniversaire", total: 30000,
    deadline: "2026-10-30", createdBy: "Aminata", createdAt: "2026-10-12",
    message: "Joyeux anniversaire Fatou ! On t'offre ce petit cadeau ensemble.",
    participants: [
      p("me", "Vous", 5000, "paye", true), p("awa", "Awa", 5000, "paye"), p("mam", "Mamadou", 5000, "attente"),
      p("fat", "Fatou", 5000, "attente"), p("ali", "Ali", 5000, "attente"), p("sok", "Sokhna", 5000, "attente"),
    ],
    history: [{ at: "2026-10-12", text: "Collecte créée par Aminata" }, { at: "2026-10-13", text: "Awa a payé 5 000 FCFA" }, { at: "2026-10-14", text: "Vous avez payé 5 000 FCFA" }],
  },
  {
    id: "sortie", title: "Sortie entre amis", motif: "sortie", total: 20000, deadline: "2026-10-23",
    createdBy: "Vous", createdAt: "2026-10-15",
    participants: [p("me", "Vous", 5000, "paye", true), p("a", "Khady", 5000, "paye"), p("b", "Moussa", 5000, "paye"), p("c", "Binta", 5000, "attente")],
    history: [{ at: "2026-10-15", text: "Collecte créée" }],
  },
  {
    id: "facture", title: "Facture électricité", motif: "facture", total: 15000, createdBy: "Vous", createdAt: "2026-10-10",
    participants: [p("me", "Vous", 5000, "paye", true), p("a", "Ibrahima", 5000, "paye"), p("b", "Seynabou", 5000, "paye")],
    history: [{ at: "2026-10-10", text: "Collecte créée" }, { at: "2026-10-11", text: "Collecte terminée" }],
  },
  {
    id: "maman", title: "Cadeau pour Maman", motif: "cadeau", total: 25000, createdBy: "Vous", createdAt: "2026-10-01",
    participants: [p("me", "Vous", 12500, "paye", true), p("a", "Aïssatou", 12500, "paye")],
    history: [{ at: "2026-10-01", text: "Collecte créée" }],
  },
];

export interface Draft {
  motif: Motif;
  title: string;
  total: number;
  count: number;
  split: "egale" | "perso";
  deadline: string;
  names: string[];
}

export const emptyDraft = (): Draft => ({
  motif: "anniversaire", title: "", total: 0, count: 2, split: "egale", deadline: "", names: [],
});

interface State {
  collectes: Collecte[];
  draft: Draft;
  notifications: { id: string; text: string; at: string; read: boolean }[];
}

let state: State = {
  collectes: seed,
  draft: emptyDraft(),
  notifications: [
    { id: "n1", text: "Awa a payé sa part pour « Anniversaire de Fatou »", at: "2026-10-13", read: false },
    { id: "n2", text: "Rappel : « Sortie entre amis » se termine dans 2 jours", at: "2026-10-21", read: false },
    { id: "n3", text: "« Facture électricité » est terminée 🎉", at: "2026-10-11", read: false },
  ],
};
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
  // Add this demo to existing installations without resetting payments or drafts.
  const event = seed.find((c) => c.id === "soiree-joj");
  if (event && !state.collectes.some((c) => c.id === event.id)) {
    state = { ...state, collectes: [event, ...state.collectes] };
    emit();
  }
  listeners.forEach((l) => l());
}

const serverState = state;
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(serverState),
  );
}

function set(fn: (s: State) => State) {
  state = fn(state);
  emit();
}

export const actions = {
  updateDraft: (patch: Partial<Draft>) => set((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
  resetDraft: () => set((s) => ({ ...s, draft: emptyDraft() })),
  createFromDraft: (): string => {
    const d = state.draft;
    const id = `c${Date.now().toString(36)}`;
    const share = perPerson(d.total, d.count);
    const others = Array.from({ length: d.count - 1 }, (_, i) =>
      p(`p${i}`, d.names[i]?.trim() || `Participant ${i + 2}`, share, "attente"),
    );
    const today = new Date().toISOString().slice(0, 10);
    const c: Collecte = {
      id, title: d.title.trim(), motif: d.motif, total: d.total, deadline: d.deadline || undefined,
      createdBy: "Vous", createdAt: today,
      participants: [p("me", "Vous", share, "attente", true), ...others],
      history: [{ at: today, text: "Collecte créée" }],
    };
    set((s) => ({ ...s, collectes: [c, ...s.collectes], draft: emptyDraft() }));
    return id;
  },
  pay: (collecteId: string, participantId: string) => {
    let ref = "";
    set((s) => ({
      ...s,
      collectes: s.collectes.map((c) => {
        if (c.id !== collecteId) return c;
        const who = c.participants.find((x) => x.id === participantId);
        ref = `MXP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}`;
        return {
          ...c,
          participants: c.participants.map((x) => (x.id === participantId ? { ...x, status: "paye" as const } : x)),
          history: [...c.history, { at: new Date().toISOString(), text: `${who?.isMe ? "Vous avez" : `${who?.name} a`} payé ${who?.amount} FCFA` }],
        };
      }),
    }));
    return ref;
  },
  readAll: () => set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
};
