import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SearchX } from "lucide-react";
import { useState } from "react";
import { CollecteCard, Screen } from "@/components/app/ui";
import { isDone } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partages")({
  head: () => ({
    meta: [
      { title: "Mes partages — Max it Partage" },
      { name: "description", content: "Retrouvez toutes vos collectes en cours et terminées." },
      { property: "og:title", content: "Mes partages — Max it Partage" },
      { property: "og:description", content: "Vos collectes en cours et terminées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Partages,
});

function Partages() {
  const all = useStore((s) => s.collectes);
  const [tab, setTab] = useState<"encours" | "termine">("encours");
  const [q, setQ] = useState("");
  const enCours = all.filter((c) => !isDone(c)), done = all.filter(isDone);
  const list = (tab === "encours" ? enCours : done).filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-extrabold">Mes partages</h1>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
          {([["encours", `En cours (${enCours.length})`], ["termine", `Terminés (${done.length})`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("rounded-full py-2.5 text-sm font-semibold transition", tab === k ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground")}>{l}</button>
          ))}
        </div>
        <label className="mt-4 flex h-12 items-center gap-2 rounded-full border bg-card px-4">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une collecte…" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="mt-4 space-y-3">
          {list.map((c) => <CollecteCard key={c.id} c={c} />)}
          {list.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <SearchX className="mx-auto mb-2 size-8" /> Aucune collecte ici.
              <Link to="/creer" className="mt-2 block font-semibold text-primary">Créer un partage</Link>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
