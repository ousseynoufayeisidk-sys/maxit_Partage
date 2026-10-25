import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Minus, Plus, Wallet } from "lucide-react";
import { Btn, MOTIFS, Screen, TopBar } from "@/components/app/ui";
import { formatFCFA, perPerson } from "@/lib/collecte";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { collecteImages } from "@/lib/collecte-images";

export const Route = createFileRoute("/creer")({
  head: () => ({
    meta: [
      { title: "Créer un partage — Max it Partage" },
      { name: "description", content: "Lancez une collecte entre amis en quelques secondes." },
      { property: "og:title", content: "Créer un partage — Max it Partage" },
      { property: "og:description", content: "Formulaire simple et rapide pour lancer une collecte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Creer,
});

const SUGGEST: Record<string, string> = {
  anniversaire: "Anniversaire de ", sortie: "Sortie entre amis", facture: "Facture ", cadeau: "Cadeau pour ", evenement: "", autre: "",
};
const QUICK = [10000, 20000, 30000, 50000];

function Creer() {
  const d = useStore((s) => s.draft);
  const nav = useNavigate();
  const share = perPerson(d.total, d.count);
  const valid = d.title.trim().length >= 2 && d.total >= 100 && d.count >= 2;

  return (
    <Screen nav={false}>
      <TopBar title="Créer un partage" />
      <form
        className="space-y-6 px-5 pb-32"
        onSubmit={(e) => { e.preventDefault(); if (valid) nav({ to: "/verifier" }); }}
      >
        <fieldset>
          <legend className="mb-3 font-semibold">Quel est le motif de votre collecte ?</legend>
          <div className="grid grid-cols-3 gap-3">
            {MOTIFS.map((m) => {
              const on = d.motif === m.id;
              return (
                  <Btn variant="soft" type="button" key={m.id} aria-pressed={on}
                  onClick={() => actions.updateDraft({ motif: m.id, title: d.title || (SUGGEST[m.id] ?? "") })}
                   className={cn("h-auto min-w-0 flex-col gap-0 overflow-hidden rounded-lg border p-0 text-xs font-medium",
                     on ? "border-primary bg-primary-soft text-primary ring-2 ring-primary/20" : "bg-card text-muted-foreground")}>
                   <img src={collecteImages[m.id].src} alt="" width={1088} height={608} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                   <span className="flex w-full items-center justify-center gap-1.5 py-2.5"><m.icon className="size-3.5 shrink-0" /> {m.label}</span>
                 </Btn>
              );
            })}
          </div>
        </fieldset>

        <img src={collecteImages[d.motif].src} alt={collecteImages[d.motif].alt} width={1088} height={608} className="aspect-[16/9] w-full rounded-xl object-cover" />

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Nom de la collecte</span>
          <input value={d.title} onChange={(e) => actions.updateDraft({ title: e.target.value })} placeholder="Ex : Anniversaire de Fatou"
            className="h-12 w-full rounded-xl border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
        </label>

        <div>
          <label htmlFor="total" className="mb-2 block text-sm font-semibold">Montant total (FCFA)</label>
          <div className="flex h-12 items-center gap-3 rounded-xl border bg-card px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
            <Wallet className="size-5 text-muted-foreground" />
            <input id="total" inputMode="numeric" value={d.total ? new Intl.NumberFormat("fr-FR").format(d.total) : ""}
              onChange={(e) => actions.updateDraft({ total: Number(e.target.value.replace(/\D/g, "")) || 0 })}
              placeholder="30 000" className="flex-1 bg-transparent text-base font-semibold outline-none" />
          </div>
          <div className="mt-2 flex gap-2">
            {QUICK.map((q) => (
              <button type="button" key={q} onClick={() => actions.updateDraft({ total: q })}
                className={cn("tap rounded-full border px-3 py-1 text-xs font-medium", d.total === q ? "border-primary bg-primary-soft text-primary" : "bg-card text-muted-foreground")}>
                {q / 1000}k
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold">Nombre de participants</span>
          <div className="flex h-14 items-center justify-between rounded-xl border bg-card px-2">
            <button type="button" aria-label="Moins" disabled={d.count <= 2} onClick={() => actions.updateDraft({ count: d.count - 1 })}
              className="tap grid size-10 place-items-center rounded-lg bg-muted disabled:opacity-40"><Minus className="size-4" /></button>
            <span className="text-xl font-bold" aria-live="polite">{d.count}</span>
            <button type="button" aria-label="Plus" disabled={d.count >= 50} onClick={() => actions.updateDraft({ count: d.count + 1 })}
              className="tap grid size-10 place-items-center rounded-lg bg-muted"><Plus className="size-4" /></button>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold">Répartition</span>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["egale", "perso"] as const).map((s) => (
              <button type="button" key={s} onClick={() => actions.updateDraft({ split: s })}
                className={cn("flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium", d.split === s ? "bg-card shadow-card" : "text-muted-foreground")}>
                <span className={cn("size-3.5 rounded-full border-2", d.split === s ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                {s === "egale" ? "Égale" : "Personnalisée"}
              </button>
            ))}
          </div>
          {d.split === "perso" && <p className="mt-2 text-xs text-muted-foreground">Vous pourrez ajuster chaque montant à l'étape suivante (bientôt disponible).</p>}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Date limite <span className="font-normal text-muted-foreground">(optionnel)</span></span>
          <div className="flex h-12 items-center gap-3 rounded-xl border bg-card px-4">
            <CalendarDays className="size-5 text-muted-foreground" />
            <input type="date" value={d.deadline} onChange={(e) => actions.updateDraft({ deadline: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-card/95 p-4 pb-safe backdrop-blur">
          {d.total > 0 && (
            <p className="mb-2 text-center text-sm text-muted-foreground">
              Chacun paiera <strong className="text-foreground">{formatFCFA(share)}</strong>
            </p>
          )}
          <Btn type="submit" disabled={!valid}>Continuer <ArrowRight className="size-4" /></Btn>
        </div>
      </form>
    </Screen>
  );
}
