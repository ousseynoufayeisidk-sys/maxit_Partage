import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Screen, TopBar } from "@/components/app/ui";
import { formatDate } from "@/lib/collecte";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Max it Partage" },
      { name: "description", content: "Paiements reçus, rappels et collectes terminées." },
      { property: "og:title", content: "Notifications — Max it Partage" },
      { property: "og:description", content: "Restez informé de vos collectes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const list = useStore((s) => s.notifications);
  return (
    <Screen>
      <TopBar title="Notifications" back={false}
        right={<button onClick={actions.readAll} className="text-xs font-semibold text-primary">Tout marquer lu</button>} />
      <ul className="space-y-2 px-5">
        {list.map((n) => (
          <li key={n.id} className={cn("flex gap-3 rounded-2xl p-4", n.read ? "bg-card" : "bg-primary-soft")}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-primary"><Bell className="size-5" /></span>
            <div><p className="text-sm font-medium">{n.text}</p><p className="text-xs text-muted-foreground">{formatDate(n.at)}</p></div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
