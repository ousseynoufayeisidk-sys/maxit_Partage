import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BellRing, CalendarDays, Coins, MoreVertical, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Btn, DoneBanner, MotifBadge, motifLabel, Ring, Screen, StatusPill, TopBar } from "@/components/app/ui";
import { collected, contributed, formatDate, formatFCFA, formatNumber, isDone, paidCount, remainingAmount } from "@/lib/collecte";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/suivi/$id")({
  head: () => ({
    meta: [
      { title: "Suivi de la collecte — Max it Partage" },
      { name: "description", content: "Voyez qui a payé et envoyez un rappel." },
      { property: "og:title", content: "Suivi de la collecte — Max it Partage" },
      { property: "og:description", content: "Qui a payé, qui doit encore contribuer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Suivi,
});

function Suivi() {
  const { id } = Route.useParams();
  const c = useStore((s) => s.collectes.find((x) => x.id === id));
  if (!c) throw notFound();
  const me = c.participants.find((p) => p.isMe);
  const pending = c.participants.filter((p) => p.status === "attente" && !p.isMe);

  return (
    <Screen nav={false}>
      <TopBar title="Suivi de la collecte" right={<MoreVertical className="size-5 text-muted-foreground" />} />
      <div className="space-y-5 px-5 pb-40">
        <div className="flex items-center gap-3"><MotifBadge motif={c.motif} />
          <div><p className="font-bold">{c.title}</p><p className="text-xs text-muted-foreground">{motifLabel(c.motif)} • {c.participants.length} participants</p></div></div>

        {isDone(c) && <DoneBanner c={c} />}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-5">
            <Ring value={paidCount(c) / c.participants.length} label={`${paidCount(c)}/${c.participants.length}`} />
            <div>
              <p className="text-2xl font-extrabold">{formatNumber(collected(c))}<span className="text-xs font-medium text-muted-foreground"> / {formatFCFA(c.total)}</span></p>
              <span className="mt-1 inline-flex rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Collecté</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x border-t pt-4 text-sm">
            <div className="flex items-center gap-2"><Coins className="size-4 text-muted-foreground" /><div><p className="font-semibold">{formatFCFA(me?.amount ?? 0)}</p><p className="text-xs text-muted-foreground">Par personne</p></div></div>
            <div className="flex items-center gap-2 pl-4"><CalendarDays className="size-4 text-muted-foreground" /><div><p className="font-semibold">{formatDate(c.deadline)}</p><p className="text-xs text-muted-foreground">Date limite</p></div></div>
          </div>
        </div>

        <section>
          <h2 className="mb-2 font-bold">Participants</h2>
          <ul className="divide-y rounded-2xl bg-card shadow-card">
            {c.participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Avatar p={p} />
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{formatFCFA(p.amount)}</p>{contributed(p) > 0 && remainingAmount(p) > 0 && <p className="mt-1 text-xs text-primary">{formatFCFA(contributed(p))} versés · reste {formatFCFA(remainingAmount(p))}</p>}</div>
                {p.status === "attente" && !p.isMe ? (
                  <button onClick={() => toast.success(`Rappel envoyé à ${p.name}`)} aria-label={`Relancer ${p.name}`}
                    className="tap mr-1 grid size-8 place-items-center rounded-full bg-muted text-muted-foreground"><BellRing className="size-4" /></button>
                ) : null}
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md space-y-2 border-t bg-card/95 p-4 pb-safe backdrop-blur">
        {me?.status === "attente" && (
          <Link to="/paiement/$id" params={{ id: c.id }} className="block"><Btn>{contributed(me) > 0 ? "Continuer ma contribution" : "Payer ma part"} · {formatFCFA(remainingAmount(me))}</Btn></Link>
        )}
        <Btn variant={me?.status === "attente" ? "soft" : "primary"} disabled={pending.length === 0}
          onClick={() => toast.success(`Rappel envoyé à ${pending.length} participant${pending.length > 1 ? "s" : ""}`)}>
          <Send className="size-4" /> {pending.length ? "Rappeler les participants" : "Tout le monde a payé"}
        </Btn>
      </div>
    </Screen>
  );
}
