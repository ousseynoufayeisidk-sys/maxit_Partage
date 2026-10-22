import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Check, Hash, Share2, Users, Wallet } from "lucide-react";
import { Btn, Screen } from "@/components/app/ui";
import { formatFCFA } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import { share } from "@/lib/share";

export const Route = createFileRoute("/confirmation/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s["ref"] === "string" ? s["ref"] : "" }),
  head: () => ({
    meta: [
      { title: "Contribution enregistrée — Max it Partage" },
      { name: "description", content: "Votre paiement a bien été enregistré." },
      { property: "og:title", content: "Contribution enregistrée — Max it Partage" },
      { property: "og:description", content: "Merci pour votre participation." },
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
  const now = new Date();

  return (
    <Screen nav={false} className="bg-gradient-celebrate">
      <div className="relative px-5 pb-10 pt-16 text-center">
        {CONFETTI.map((cl, i) => <span key={i} className={`animate-confetti absolute h-1.5 w-4 rounded-full ${cl}`} style={{ animationDelay: `${i * 0.12}s` }} />)}
        <div className="animate-pop mx-auto grid size-24 place-items-center rounded-full bg-success text-primary-foreground shadow-card ring-8 ring-card/60">
          <Check className="size-12" strokeWidth={3} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Contribution enregistrée !</h1>
        <p className="mt-1 text-muted-foreground">Merci pour votre participation 🎉</p>

        <dl className="mt-8 space-y-4 rounded-3xl bg-card p-5 text-left shadow-card">
          <Item icon={Wallet} k="Montant" v={formatFCFA(me?.amount ?? 0)} big />
          <Item icon={Users} k="Collecte" v={c?.title ?? "—"} />
          <Item icon={CalendarDays} k="Date" v={now.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} />
          <Item icon={Hash} k="Référence" v={ref || "—"} />
        </dl>

        <div className="mt-6 space-y-3">
          <Link to="/collecte/$id" params={{ id }} className="block"><Btn>Voir la collecte</Btn></Link>
          <Btn variant="outline" onClick={() => share(c?.title ?? "")}><Share2 className="size-4" /> Partager le récapitulatif</Btn>
          <Link to="/" className="block pt-2 text-sm font-medium text-muted-foreground">Retour à l'accueil</Link>
        </div>
      </div>
    </Screen>
  );
}

function Item({ icon: Icon, k, v, big }: { icon: typeof Wallet; k: string; v: string; big?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary"><Icon className="size-5" /></span>
      <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className={big ? "text-xl font-extrabold" : "font-semibold"}>{v}</dd></div>
    </div>
  );
}
