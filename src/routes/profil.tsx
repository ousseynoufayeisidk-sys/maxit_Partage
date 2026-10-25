import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, CircleHelp, Info, Settings, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { avatarUrl, Screen } from "@/components/app/ui";
import { ME, useStore } from "@/lib/store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Max it Partage" },
      { name: "description", content: "Gérez vos informations, notifications et paramètres." },
      { property: "og:title", content: "Profil — Max it Partage" },
      { property: "og:description", content: "Vos infos, notifications et aide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profil,
});

function Profil() {
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const soon = () => toast("Bientôt disponible");
  const items = [
    { icon: User, label: "Mes informations", onClick: soon },
    { icon: Bell, label: "Notifications", to: "/notifications" as const, badge: unread },
    { icon: CircleHelp, label: "Aide et assistance", onClick: soon },
    { icon: Info, label: "À propos de Max it Partage", onClick: () => toast("Max it Partage v1.0 — Max it Week 2026") },
    { icon: Settings, label: "Paramètres", onClick: soon },
  ];
  return (
    <Screen>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-extrabold">Profil</h1>
        <div className="mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card">
          <img src={avatarUrl} alt={ME.name} className="size-20 rounded-full object-cover ring-4 ring-primary-soft" />
          <div className="flex-1">
            <p className="text-lg font-bold">{ME.name}</p>
            <p className="text-sm text-muted-foreground">{ME.phone}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"><ShieldCheck className="size-3.5" /> Membre Max it</span>
          </div>
          <button onClick={soon} aria-label="Modifier le profil" className="tap grid size-9 place-items-center rounded-full bg-primary-soft text-primary"><ChevronRight className="size-5" /></button>
        </div>

        <ul className="mt-5 divide-y rounded-2xl bg-card shadow-card">
          {items.map((it) => {
            const inner = (
              <>
                <it.icon className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{it.label}</span>
                {it.badge ? <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{it.badge}</span> : null}
                <ChevronRight className="size-4 text-muted-foreground" />
              </>
            );
            const cls = "tap flex w-full items-center gap-3 p-4 text-left";
            return <li key={it.label}>{it.to ? <Link to={it.to} className={cls}>{inner}</Link> : <button onClick={it.onClick} className={cls}>{inner}</button>}</li>;
          })}
        </ul>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-primary-soft p-5">
          <p className="text-2xl font-extrabold">Max <span className="text-primary">it</span></p>
          <p className="mt-1 max-w-[60%] text-xs text-muted-foreground">Plus qu'une application, une meilleure expérience.</p>
          <div className="absolute -bottom-6 -right-4 h-24 w-32 rotate-[-20deg] rounded-2xl bg-gradient-primary shadow-glow" aria-hidden />
        </div>
      </div>
    </Screen>
  );
}
