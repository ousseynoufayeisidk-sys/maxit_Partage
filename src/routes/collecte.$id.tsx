import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, ChevronRight, Coins, QrCode, Share2, Users, X } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { Avatar, Btn, DoneBanner, MotifBadge, motifLabel, Progress, Screen, StatusPill, TopBar } from "@/components/app/ui";
import { collected, contributed, formatDate, formatFCFA, formatNumber, isDone, paidCount, remainingAmount, type Collecte } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { share } from "@/lib/share";
import { collecteImages } from "@/lib/collecte-images";

export const Route = createFileRoute("/collecte/$id")({
  head: () => ({
    meta: [
      { title: "Détail de la collecte — Max it Partage" },
      { name: "description", content: "Montant, participants et historique de votre collecte." },
      { property: "og:title", content: "Détail de la collecte — Max it Partage" },
      { property: "og:description", content: "Toutes les informations de la collecte au même endroit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

const TABS = ["Détails", "Participants", "Historique"] as const;

function Detail() {
  const { id } = Route.useParams();
  const c = useStore((s) => s.collectes.find((x) => x.id === id));
  const [tab, setTab] = useState<(typeof TABS)[number]>("Détails");
  if (!c) throw notFound();
  const got = collected(c), me = c.participants.find((p) => p.isMe);

  return (
    <Screen nav={false}>
      <TopBar title="Détails" />
      <div className="px-5 pb-40">
        <div className="relative">
          <img src={collecteImages[c.motif].src} alt={collecteImages[c.motif].alt} width={1088} height={608} className="aspect-[16/9] w-full rounded-3xl object-cover" />
          <div className="absolute -bottom-6 left-4 rounded-full bg-card p-1 shadow-card"><MotifBadge motif={c.motif} size="lg" /></div>
        </div>
        <h1 className="mt-9 text-xl font-bold">{c.title}</h1>
        <p className="text-sm text-muted-foreground">{motifLabel(c.motif)} • {c.participants.length} participants</p>
        {isDone(c) && <div className="mt-4"><DoneBanner c={c} /></div>}

        <div role="tablist" className="mt-5 grid grid-cols-3 border-b">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn("-mb-px border-b-2 py-3 text-sm font-medium", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>{t}</button>
          ))}
        </div>

        {tab === "Détails" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <p className="flex items-baseline gap-2"><CheckCircle2 className="size-5 self-center text-success" />
                <span className="text-2xl font-extrabold">{formatNumber(got)}</span>
                <span className="text-sm text-muted-foreground">/ {formatFCFA(c.total)}</span></p>
              <Progress value={got / c.total} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">{paidCount(c)}/{c.participants.length} participants ont payé</p>
            </div>
            <dl className="divide-y rounded-2xl bg-card shadow-card">
              <Line icon={Coins} k="Montant par personne" v={formatFCFA(me?.amount ?? c.participants[0]?.amount ?? 0)} />
              <Line icon={CalendarDays} k="Date limite" v={formatDate(c.deadline)} />
              <Line icon={Users} k="Créée par" v={c.createdBy} />
            </dl>
            {c.message && (
              <figure className="rounded-2xl bg-primary-soft p-4">
                <blockquote className="text-sm italic">« {c.message} »</blockquote>
                <figcaption className="mt-3 flex items-center gap-2 text-xs"><Avatar p={{ name: c.createdBy }} size={28} />
                  <span>Créée par <strong>{c.createdBy}</strong><br /><span className="text-muted-foreground">{formatDate(c.createdAt)}</span></span></figcaption>
              </figure>
            )}
            <Link to="/suivi/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-semibold shadow-card">
              Suivre les paiements <ChevronRight className="size-4" />
            </Link>
            <QrInvite c={c} />
            {me && contributed(me) > 0 && remainingAmount(me) > 0 && <div className="border-y py-4"><div className="flex justify-between gap-2 text-sm"><span className="text-muted-foreground">Votre part déjà versée</span><strong>{formatFCFA(contributed(me))}</strong></div><div className="mt-2 flex justify-between gap-2 text-sm"><span className="text-muted-foreground">Votre reste à payer</span><strong className="text-primary">{formatFCFA(remainingAmount(me))}</strong></div></div>}
          </div>
        )}

        {tab === "Participants" && (
          <ul className="mt-4 divide-y rounded-2xl bg-card shadow-card">
            {c.participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Avatar p={p} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{formatFCFA(p.amount)}</p>{contributed(p) > 0 && remainingAmount(p) > 0 && <p className="mt-1 text-xs text-primary">{formatFCFA(contributed(p))} versés · reste {formatFCFA(remainingAmount(p))}</p>}</div>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        )}

        {tab === "Historique" && (
          <ol className="mt-4 space-y-4 border-l-2 border-primary/20 pl-5">
            {[...c.history].reverse().map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-sm font-medium">{h.text}</p><p className="text-xs text-muted-foreground">{formatDate(h.at)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md space-y-2 border-t bg-card/95 p-4 pb-safe backdrop-blur">
        {me?.status === "attente" && !isDone(c) ? (
          <Link to="/paiement/$id" params={{ id: c.id }} className="block"><Btn>{contributed(me) > 0 ? "Continuer ma contribution" : "Payer avec Orange Money"} · {formatFCFA(remainingAmount(me))}</Btn></Link>
        ) : null}
        <Btn variant={me?.status === "attente" ? "soft" : "primary"} onClick={() => share(c.title)}><Share2 className="size-4" /> Partager</Btn>
      </div>
    </Screen>
  );
}

function Line({ icon: Icon, k, v }: { icon: typeof Coins; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between p-4 text-sm">
      <dt className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" /> {k}</dt><dd className="font-semibold">{v}</dd>
    </div>
  );
}

/** QR code d'invitation : le jury ou les amis scannent et arrivent directement sur la collecte. */
function QrInvite({ c }: { c: Collecte }) {
  const [open, setOpen] = useState(false);
  const url = `${window.location.origin}/collecte/${c.id}`;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-sm font-semibold shadow-card">
        <span className="flex items-center gap-2"><QrCode className="size-4 text-primary" /> Inviter par QR code</span>
        <ChevronRight className="size-4" />
      </button>
    );
  }

  return (
    <section aria-label="QR code d'invitation" className="animate-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-center text-primary-foreground shadow-card">
      <div aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-12 -left-8 size-32 rounded-full bg-white/10" />
      <button onClick={() => setOpen(false)} aria-label="Fermer le QR code" className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5"><X className="size-4" /></button>
      <p className="text-xs font-bold uppercase tracking-widest opacity-90">Invitation instantanée</p>
      <p className="mt-1 text-lg font-extrabold">Scannez pour participer</p>
      <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-4 shadow-lg">
        <QRCode value={url} size={168} fgColor="#1A1A1A" bgColor="#FFFFFF" />
      </div>
      <p className="mt-3 text-sm font-semibold">« {c.title} »</p>
      <p className="mt-1 break-all text-[11px] opacity-80">{url}</p>
      <p className="mt-2 text-xs opacity-90">Chacun scanne, paie sa part avec Orange Money, et la cagnotte se remplit en direct 📲</p>
    </section>
  );
}
