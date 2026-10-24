import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { perPerson, type Collecte, type Motif, type Participant } from "./collecte";
import { supabase, getSession, signInAnon, type DbCollecte, type DbParticipant } from "./supabase";
import { generateInviteToken, normalizePhone } from "./invite";

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
  phones: string[];
}

export const emptyDraft = (): Draft => ({
  motif: "anniversaire", title: "", total: 0, count: 2, split: "egale", deadline: "", names: [], phones: [],
});

interface State {
  collectes: Collecte[];
  draft: Draft;
  notifications: { id: string; text: string; at: string; read: boolean }[];
  supabaseHydrated: boolean;
}

let state: State = {
  collectes: seed,
  draft: emptyDraft(),
  notifications: [
    { id: "n1", text: "Awa a payé sa part pour « Anniversaire de Fatou »", at: "2026-10-13", read: false },
    { id: "n2", text: "Rappel : « Sortie entre amis » se termine dans 2 jours", at: "2026-10-21", read: false },
    { id: "n3", text: "« Facture électricité » est terminée 🎉", at: "2026-10-11", read: false },
  ],
  supabaseHydrated: false,
};
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

/**
 * Transform a database row (collecte + participants + creator) to the Collecte type.
 * Maps DB schema to the client-side format, setting isMe flags and masking
 * phone numbers for participants that aren't the current user.
 */
function transformCollecteFromDB(
  raw: DbCollecte & { participants?: DbParticipant[]; creator?: { prenom: string; nom: string } | null },
  currentUserId: string
): Collecte {
  const createdBy = raw.created_by === currentUserId 
    ? "Vous" 
    : raw.creator 
      ? `${raw.creator.prenom} ${raw.creator.nom}`
      : "Un ami";
  
  const participants: Participant[] = (raw.participants || []).map((p) => {
    const isMe = p.profile_id === currentUserId;
    return {
      id: p.id,
      name: isMe ? "Vous" : `${p.prenom} ${p.nom.charAt(0)}.`,
      phone: isMe ? p.phone || undefined : undefined, // mask phone for others
      amount: p.amount,
      status: p.status,
      isMe,
    };
  });

  return {
    id: raw.id,
    title: raw.title,
    motif: raw.motif,
    total: raw.total,
    deadline: raw.deadline || undefined,
    message: raw.message || undefined,
    createdBy,
    createdAt: raw.created_at.slice(0, 10), // ISO date to YYYY-MM-DD
    participants,
    history: raw.history || [],
  };
}

export async function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  // Load from localStorage first for offline fallback
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      state = { ...state, ...cached };
    }
  } catch {}

  // Add demo collecte to existing installations
  const event = seed.find((c) => c.id === "soiree-joj");
  if (event && !state.collectes.some((c) => c.id === event.id)) {
    state = { ...state, collectes: [event, ...state.collectes] };
  }

  // Attempt to fetch from Supabase
  try {
    let session = await getSession();
    
    // Sign in anonymously if no session
    if (!session) {
      session = await signInAnon();
    }

    if (session?.user?.id) {
      const userId = session.user.id;

      // Fetch collectes with participants and creator profile (RLS filters to only user's collectes)
      const { data, error } = await supabase
        .from("collectes")
        .select("*, creator:profiles!created_by(prenom, nom), participants(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const collectes = data.map((row) => transformCollecteFromDB(row as any, userId));
        state = { ...state, collectes, supabaseHydrated: true };
        emit();
      } else {
        // No collectes in DB, keep seed/localStorage data
        state = { ...state, supabaseHydrated: true };
      }
    }
  } catch (err) {
    console.error("Supabase hydration failed:", err);
    toast.warning("Mode hors ligne activé");
    // Keep localStorage data, just mark as not hydrated from Supabase
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

/**
 * Local fallback for creating collecte without Supabase.
 * Used when offline or Supabase is unavailable.
 */
function createFromDraftLocal(): string {
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
}

/**
 * Local fallback for payment without Supabase.
 * Used when offline or Supabase is unavailable.
 */
function payLocal(collecteId: string, participantId: string): string {
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
}

export const actions = {
  updateDraft: (patch: Partial<Draft>) => set((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
  resetDraft: () => set((s) => ({ ...s, draft: emptyDraft() })),
  
  createFromDraft: async (): Promise<string> => {
    const d = state.draft;

    // Fallback to local if not hydrated from Supabase
    if (!state.supabaseHydrated) {
      return createFromDraftLocal();
    }

    try {
      const session = await getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast.error("Vous devez être en ligne pour créer une collecte");
        return createFromDraftLocal();
      }

      const share = perPerson(d.total, d.count);
      const today = new Date().toISOString();

      // Insert collecte
      const { data: collecteData, error: collecteError } = await supabase
        .from("collectes")
        .insert({
          title: d.title.trim(),
          motif: d.motif,
          total: d.total,
          deadline: d.deadline || null,
          message: null,
          created_by: userId,
          history: [{ at: today, text: "Collecte créée" }],
        })
        .select()
        .single();

      if (collecteError) throw collecteError;

      // Normalize phone numbers before inserting (E.164 format +221XXXXXXXXX)
      const normalizedPhones = d.phones.map((p) => {
        if (!p) return null;
        try {
          return normalizePhone(p);
        } catch (err) {
          console.warn(`Invalid phone ${p}, skipping:`, err);
          return null;
        }
      });

      // Insert participants: creator + invitees
      const participantsToInsert = [
        {
          collecte_id: collecteData.id,
          profile_id: userId,
          prenom: "Vous",
          nom: "",
          phone: null,
          amount: share,
          status: "attente" as const,
          invite_token: generateInviteToken(), // Creator also gets a token
        },
        ...Array.from({ length: d.count - 1 }, (_, i) => ({
          collecte_id: collecteData.id,
          profile_id: null,
          prenom: d.names[i]?.trim() || `Participant ${i + 2}`,
          nom: "",
          phone: normalizedPhones[i],
          amount: share,
          status: "attente" as const,
          invite_token: generateInviteToken(),
        })),
      ];

      const { error: participantsError } = await supabase
        .from("participants")
        .insert(participantsToInsert);

      if (participantsError) throw participantsError;

      // Refresh store from Supabase
      await hydrateStore();

      set((s) => ({ ...s, draft: emptyDraft() }));
      return collecteData.id;
    } catch (err) {
      console.error("Failed to create collecte in Supabase:", err);
      toast.warning("Création en mode hors ligne");
      return createFromDraftLocal();
    }
  },

  pay: async (collecteId: string, participantId: string): Promise<string> => {
    // Fallback to local if not hydrated from Supabase
    if (!state.supabaseHydrated) {
      return payLocal(collecteId, participantId);
    }

    try {
      const session = await getSession();

      if (!session?.user?.id) {
        toast.error("Vous devez être en ligne pour payer");
        return payLocal(collecteId, participantId);
      }

      // Call RPC function to process payment
      const { data, error } = await supabase.rpc("pay_participant", {
        collecte_id_input: collecteId,
        participant_id_input: participantId,
      });

      if (error) throw error;

      if (!data || !data.success) {
        throw new Error(data?.message || "Payment failed");
      }

      // Refresh store from Supabase
      await hydrateStore();

      return data.ref || `MXP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}`;
    } catch (err) {
      console.error("Failed to process payment in Supabase:", err);
      toast.error("Erreur de paiement");
      throw err;
    }
  },

  readAll: () => set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
};
