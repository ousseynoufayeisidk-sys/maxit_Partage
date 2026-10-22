export type Motif = "anniversaire" | "sortie" | "facture" | "cadeau" | "evenement" | "autre";
export type PayStatus = "paye" | "attente";

export interface Participant {
  id: string;
  name: string;
  phone?: string;
  amount: number;
  status: PayStatus;
  isMe?: boolean;
}

export interface Collecte {
  id: string;
  title: string;
  motif: Motif;
  total: number;
  deadline?: string | undefined;
  message?: string;
  createdBy: string;
  createdAt: string;
  participants: Participant[];
  history: { at: string; text: string }[];
}

export const formatFCFA = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/\u202f|\u00a0/g, " ")} FCFA`;

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/\u202f|\u00a0/g, " ");

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Equal split: rounds each share up to the nearest FCFA so the total is always covered. */
export function perPerson(total: number, count: number) {
  if (count <= 0 || total <= 0) return 0;
  return Math.ceil(total / count);
}

export function collected(c: Collecte) {
  return c.participants.filter((p) => p.status === "paye").reduce((s, p) => s + p.amount, 0);
}
export function paidCount(c: Collecte) {
  return c.participants.filter((p) => p.status === "paye").length;
}
export function isDone(c: Collecte) {
  return c.participants.length > 0 && paidCount(c) === c.participants.length;
}
export function daysLeft(c: Collecte, now = new Date()) {
  if (!c.deadline) return null;
  return Math.max(0, Math.ceil((new Date(c.deadline).getTime() - now.getTime()) / 86400000));
}
