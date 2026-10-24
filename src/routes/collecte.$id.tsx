import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, ChevronRight, Coins, Share2, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, Btn, DoneBanner, MotifBadge, motifLabel, Progress, Screen, StatusPill, TopBar } from "@/components/app/ui";
import { collected, formatDate, formatFCFA, formatNumber, isDone, paidCount } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { collecteImages } from "@/lib/collecte-images";
import { ShareSheet } from "@/components/ShareSheet";

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
  const [showWelcome, setShowWelcome] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  
  if (!c) throw notFound();
  
  const got = collected(c);
  const me = c.participants.find((p) => p.isMe);
  
  // Guest detection: if createdBy is not "Vous", this is a guest view
  const isGuest = c.createdBy !== "Vous";
  
  // Show welcome banner for guests on first visit
  useEffect(() => {
    if (isGuest && typeof window !== "undefined") {
      const key = `welcomed-${c.id}`;
      const hasBeenWelcomed = localStorage.getItem(key);
      if (!hasBeenWelcomed) {
        setShowWelcome(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [isGuest, c.id]);

  return (
    <Screen nav={false}>
      <TopBar title="Détails" />
      <div className="px-5 pb-40">
        {showWelcome && isGuest && me && (
          <div className="mb-4 rounded-2xl bg-success/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Bienvenue, {me.name.split(' ')[0]} !</p>
              <p className="text-xs text-muted-foreground mt-1">Vous ne verrez que votre part dans cette collecte.</p>
            </div>
            <button 
              onClick={() => setShowWelcome(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        
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
            {!isGuest && (
              <Link to="/suivi/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-2xl bg-card p-4 text-sm font-semibold shadow-card">
                Suivre les paiements <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        )}

        {tab === "Participants" && (
          <ul className="mt-4 divide-y rounded-2xl bg-card shadow-card">
            {c.participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Avatar p={p} /><div className="flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{formatFCFA(p.amount)}</p></div>
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
          <Link to="/paiement/$id" params={{ id: c.id }} className="block"><Btn>Payer avec Orange Money · {formatFCFA(me.amount)}</Btn></Link>
        ) : null}
        {!isGuest && (
          <Btn variant={me?.status === "attente" ? "soft" : "primary"} onClick={() => setShowShareSheet(true)}><Share2 className="size-4" /> Partager les invitations</Btn>
        )}
      </div>

      {showShareSheet && (
        <ShareSheet 
          collecteId={c.id} 
          collecteTitle={c.title}
          onClose={() => setShowShareSheet(false)} 
        />
      )}
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
