import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import {
  Avatar,
  avatarUrl,
  CollecteCard,
  Logo,
  MotifBadge,
  Screen,
  SectionTitle,
  SplashPartage,
} from "@/components/app/ui";
import { formatDate, formatNumber, isDone } from "@/lib/collecte";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/partage")({
  head: () => ({
    meta: [
      { title: "Accueil — Max it Partage" },
      { name: "description", content: "Vos collectes entre amis en un coup d'œil. Créez un partage en un clic." },
      { property: "og:title", content: "Max it Partage — Ensemble, c'est plus simple" },
      { property: "og:description", content: "Partagez une dépense entre amis et suivez qui a payé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const collectes = useStore((s) => s.collectes);
  const enCours = collectes.filter((c) => !isDone(c));
  const recent = collectes.slice(0, 3);

  return (
    <Screen>
      <SplashPartage />
      <div className="px-5 pt-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Retour à l'accueil Max it"
              className="tap grid size-10 place-items-center rounded-full bg-card shadow-card"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <Logo />
          </div>
          <Link to="/profil" aria-label="Profil">
            <img src={avatarUrl} alt="" className="size-10 rounded-full object-cover ring-2 ring-primary/30" />
          </Link>
        </header>

        <h1 className="mt-6 text-2xl font-extrabold">Bonjour Ousmane 👋</h1>
        <p className="text-sm text-muted-foreground">Prêt à partager de bons moments ?</p>

        <Link to="/creer" className="tap relative mt-5 flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
          <div className="absolute -right-8 -top-10 size-36 rounded-full bg-primary-foreground/10" aria-hidden />
          <div>
            <p className="text-lg font-bold">Créer un partage</p>
            <p className="mt-1 text-sm opacity-90">Une dépense à plusieurs ?<br />C'est ici !</p>
          </div>
          <span className="relative grid size-12 place-items-center rounded-full bg-primary-foreground text-primary">
            <Plus className="size-6" strokeWidth={2.5} />
          </span>
        </Link>

        <SectionTitle to="/partages">Mes collectes en cours</SectionTitle>
        {enCours.length === 0 ? (
          <Link to="/creer" className="flex items-center justify-between rounded-2xl border-2 border-dashed p-4 text-sm text-muted-foreground">
            Aucune collecte en cours — lancez-en une <ArrowRight className="size-4" />
          </Link>
        ) : (
          <div className="space-y-3">
            {enCours.slice(0, 2).map((c) => (
              <div key={c.id} className="relative">
                <CollecteCard c={c} showChevron={false} />
                <div className="pointer-events-none absolute bottom-3 right-4 flex -space-x-2">
                  {c.participants.slice(0, 3).map((p) => <Avatar key={p.id} p={p} size={22} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <SectionTitle to="/partages">Dernières collectes</SectionTitle>
        <ul className="divide-y rounded-2xl bg-card shadow-card">
          {recent.map((c) => (
            <li key={c.id}>
              <Link to="/collecte/$id" params={{ id: c.id }} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                <MotifBadge motif={c.motif} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{isDone(c) ? "Terminé" : "En cours"} • {formatNumber(c.total)} FCFA</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{formatDate(c.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}
