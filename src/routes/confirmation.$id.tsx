import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock, Hash, Share2, Smartphone } from "lucide-react";
import { Btn, JojCheer, MotifBadge, Progress, Screen } from "@/components/app/ui";
import { contributed, formatFCFA, remainingAmount } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import { share } from "@/lib/share";
import type { ReactNode } from "react";

export const Route = createFileRoute("/confirmation/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s["ref"] === "string" ? s["ref"] : "" }),
  head: () => ({
    meta: [
      { title: "Contribution enregistrée — Max it Partage" },
      { name: "description", content: "Paiement réussi : montant versé, reste à payer et référence de la transaction." },
      { property: "og:title", content: "Contribution enregistrée — Max it Partage" },
      { property: "og:description", content: "Votre paiement est enregistré. Consultez votre montant versé et votre reste à payer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Confirmation,
});

const CONFETTI = ["left-[12%] top-24 bg-primary", "left-[28%] top-14 bg-success", "right-[20%] top-16 bg-warning", "right-[10%] top-28 bg-primary", "left-[20%] top-36 bg-warning", "right-[30%] top-32 bg-success"];

function Confirmation() {
  const { id } = Route.useParams();
  const { ref } = Route.useSearch();
  const c = useStore((s) => s.collectes.find((x) => x.id === id));
  const me = c?.participants.find((p) => p.isMe);
  const payment = c?.payments?.find((p) => p.ref === ref);
  const now = payment ? new Date(payment.at) : new Date();
  const part = me?.amount ?? 0;
  const paid = me ? contributed(me) : 0;
  const remaining = me ? remainingAmount(me) : 0;
  const settled = part > 0 && remaining === 0;
  const amount = payment?.amount ?? me?.amount ?? 0;

  return (
    <Screen nav={false} className="bg-gradient-celebrate">
      <div className="relative px-5 pb-10 pt-14 text-center">
        {CONFETTI.map((cl, i) => <span key={i} className={`animate-confetti absolute h-1.5 w-4 rounded-full ${cl}`} style={{ animationDelay: `${i * 0.12}s` }} />)}

        <div className="animate-pop relative mx-auto size-24">
          <span aria-hidden className="absolute inset-0 rounded-full bg-success/15" />
          <span aria-hidden className="absolute -inset-2 rounded-full border-2 border-success/25" />
          <div className="relative grid size-24 place-items-center rounded-full bg-success text-primary-foreground shadow-glow ring-8 ring-card/60">
            <Check className="size-12" strokeWidth={3} />
          </div>
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-success">
          <CheckCircle2 className="size-3.5" /> Paiement réussi
        </span>
        <h1 className="mt-3 text-2xl font-extrabold">Contribution enregistrée !</h1>
        <p className="mt-1 text-muted-foreground">Merci pour votre participation 🎉</p>

        <JojCheer />

        <section aria-label="Reçu du versement" className="mt-7 overflow-hidden rounded-3xl bg-card text-left shadow-card">
          <div className="relative overflow-hidden bg-gradient-primary px-5 py-4 text-primary-foreground">
            <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-primary-foreground/10" />
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Montant versé</p>
            <p className="mt-1 text-3xl font-extrabold leading-tight">{formatFCFA(amount)}</p>
          </div>
          <div className="divide-y divide-border px-5 py-1">
            <Row icon={Smartphone} k="Payé avec" v="Orange Money · Sénégal" />
            <Row icon={CalendarDays} k="Date" v={now.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} />
            <Row icon={Hash} k="Référence" v={ref ? <span className="font-mono text-sm break-all">{ref}</span> : "—"} />
          </div>
        </section>

        {c && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card">
            <MotifBadge motif={c.motif} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{c.title}</p>
              <p className="text-xs text-muted-foreground">Collecte lancée par {c.createdBy}</p>
            </div>
          </div>
        )}

        {me && (
          <section aria-label="Votre part" className="mt-4 rounded-3xl bg-card p-5 text-left shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">Votre part</p>
              <p className="text-xs text-muted-foreground">{formatFCFA(paid)} versés sur {formatFCFA(part)}</p>
            </div>
            <Progress value={part > 0 ? paid / part : 0} className="mt-3" />

            {settled ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-success-soft p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-primary-foreground"><CheckCircle2 className="size-5" /></span>
                <div>
                  <p className="font-bold text-success">Votre part est réglée</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Il ne vous reste plus rien à verser.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-warning-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-warning"><Clock className="size-3.5" /> Reste à payer</span>
                  <strong className="text-2xl font-extrabold text-warning">{formatFCFA(remaining)}</strong>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Vous pouvez régler le reste quand vous le souhaitez.</p>
                <Link to="/paiement/$id" params={{ id }} className="mt-4 block">
                  <Btn className="h-11">Payer le reste <ArrowRight className="size-4" /></Btn>
                </Link>
              </div>
            )}
          </section>
        )}

        <div className="mt-6 space-y-3">
          <Link to="/collecte/$id" params={{ id }} className="block"><Btn variant={settled ? "primary" : "outline"}>Voir la collecte</Btn></Link>
          <Btn variant="soft" onClick={() => share(c?.title ?? "")}><Share2 className="size-4" /> Partager le récapitulatif</Btn>
          <Link to="/partage" className="block pt-2 text-sm font-medium text-muted-foreground">Retour à l'accueil</Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">Simulation Orange Money · Aucun débit réel</p>
      </div>
    </Screen>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof Hash; k: string; v: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{k}</p><div className="font-semibold">{v}</div></div>
    </div>
  );
}
