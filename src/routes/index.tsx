import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bus,
  ChevronDown,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  HandCoins,
  LayoutGrid,
  Pi,
  Search,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { Screen } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Max it — Votre super app Orange" },
      {
        name: "description",
        content:
          "Transferts, paiements, crédit et Max it Partage : tous vos services Orange Money au même endroit.",
      },
      { property: "og:title", content: "Max it — Votre super app Orange" },
      {
        property: "og:description",
        content:
          "Tous vos services Orange Money, plus Max it Partage pour les collectes entre amis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaxitHome,
});

const SERVICES = [
  {
    label: "Transfert",
    icon: ArrowLeftRight,
    color: "bg-orange-500 text-black",
    glow: "shadow-orange-500/25",
  },
  {
    label: "Paiement",
    icon: ShoppingBasket,
    color: "bg-zinc-900 text-orange-500",
    glow: "shadow-black/20",
  },
  {
    label: "Crédit / Pass",
    icon: Wallet,
    color: "bg-orange-100 text-orange-700",
    glow: "shadow-orange-500/10",
  },
  {
    label: "PI-SPI",
    icon: Pi,
    color: "bg-zinc-800 text-orange-400",
    glow: "shadow-black/20",
  },
  {
    label: "SunuBRT",
    icon: Bus,
    color: "bg-orange-50 text-orange-600",
    glow: "shadow-orange-500/10",
  },
  {
    label: "Mastercard",
    icon: CreditCard,
    color: "bg-black text-white",
    glow: "shadow-black/20",
  },
  {
    label: "Tik Tak",
    icon: Coins,
    color: "bg-amber-300 text-black",
    glow: "shadow-amber-400/20",
  },
  {
    label: "Services",
    icon: LayoutGrid,
    color: "bg-zinc-100 text-zinc-900",
    glow: "shadow-zinc-300/30",
  },
] as const;

function MaxitHome() {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <Screen nav={false}>
      <main className="relative min-h-screen overflow-hidden bg-[#fffaf5] pb-40 text-zinc-950">
        {/* Décoration de fond */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[430px] bg-[radial-gradient(circle_at_92%_5%,rgba(255,121,0,0.24),transparent_32%),radial-gradient(circle_at_0%_30%,rgba(255,177,102,0.35),transparent_28%)]"
        />

        <div className="relative px-5 pt-5">
          {/* Entête */}
          <header className="flex items-center justify-between">
            <button
              aria-label="Paramètres"
              className="grid size-11 place-items-center rounded-2xl border border-black/5 bg-white/80 text-zinc-900 shadow-sm backdrop-blur transition duration-200 active:scale-95"
            >
              <Settings className="size-5" />
            </button>

            

            <button
              aria-label="Rechercher"
              className="grid size-11 place-items-center rounded-2xl border border-black/5 bg-white/80 text-zinc-900 shadow-sm backdrop-blur transition duration-200 active:scale-95"
            >
              <Search className="size-5" />
            </button>
          </header>

          {/* Numéro */}
          <button className="mx-auto mt-6 flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-lg shadow-black/15 transition active:scale-95">
            78 *** ** 84
            <ChevronDown className="size-4 text-orange-500" />
          </button>

          {/* Carte principale */}
          <section
            aria-label="Solde du compte Orange Money"
            className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#111111] p-5 text-white shadow-2xl shadow-orange-950/25"
          >
            <div
              aria-hidden
              className="absolute -right-16 -top-20 size-56 rounded-full bg-orange-500/90 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-20 size-52 rounded-full bg-orange-700/50 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.07)_25%,transparent_45%)]"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-orange-500 shadow-[0_0_15px_#ff7900]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                      Max it
                    </p>
                  </div>

                  <button
                    onClick={() => setShowBalance((value) => !value)}
                    aria-label={
                      showBalance ? "Masquer le solde" : "Afficher le solde"
                    }
                    className="mt-4 flex items-center gap-2 transition active:scale-[0.98]"
                  >
                    {showBalance ? (
                      <Eye className="size-5 text-orange-500" />
                    ) : (
                      <EyeOff className="size-5 text-orange-500" />
                    )}

                    <span className="text-3xl font-black tracking-tight">
                      {showBalance ? "125 000" : "••••••"}
                      <span className="ml-1 text-lg text-orange-500">F</span>
                    </span>
                  </button>

                  <p className="mt-3 text-xs text-zinc-400">
                    Compte principal · Sénégal
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-2.5 shadow-xl shadow-black/30">
                  <QRCode
                    value="https://pocket-pals-collective.lovable.app"
                    size={78}
                    fgColor="#111111"
                    bgColor="#FFFFFF"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <button className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-black transition active:scale-95">
                  <ArrowUpRight className="size-4" />
                  Envoyer
                </button>

                <button className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 active:scale-95">
                  <ArrowDownLeft className="size-4 text-orange-500" />
                  Recevoir
                </button>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  Votre univers
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Mes services
                </h2>
              </div>

              <button className="text-sm font-bold text-orange-600 transition hover:text-orange-700">
                Tout voir
              </button>
            </div>

            <ul className="mt-5 grid grid-cols-4 gap-x-3 gap-y-6">
              <li>
                <Link
                  to="/partage"
                  aria-label="Max it Partage — Les collectes entre amis"
                  className="group flex flex-col items-center gap-2"
                  onClick={() => {
                    // Enregistrer qu'on vient de la page d'accueil
                    sessionStorage.setItem('maxitPartage_previousRoute', '/');
                  }}
                >
                  <span className="relative grid size-16 place-items-center rounded-[1.35rem] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-black shadow-lg shadow-orange-500/30 transition duration-200 group-hover:-translate-y-1 group-active:scale-95">
                    <HandCoins className="size-7" />
                    <span className="absolute -right-1 -top-1 rounded-full border-2 border-[#fffaf5] bg-black px-1.5 py-0.5 text-[8px] font-black tracking-wide text-orange-500">
                      NEW
                    </span>
                  </span>
                  <span className="text-center text-xs font-extrabold leading-tight text-orange-700">
                    Max it
                    <br />
                    Partage
                  </span>
                </Link>
              </li>

              {SERVICES.map((service) => {
                const Icon = service.icon;

                return (
                  <li key={service.label}>
                    <button className="group flex w-full flex-col items-center gap-2">
                      <span
                        className={cn(
                          "grid size-16 place-items-center rounded-[1.35rem] shadow-lg transition duration-200 group-hover:-translate-y-1 group-active:scale-95",
                          service.color,
                          service.glow,
                        )}
                      >
                        <Icon className="size-7" />
                      </span>
                      <span className="text-center text-xs font-semibold leading-tight text-zinc-700">
                        {service.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Activité récente */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  Activité
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Dernières opérations
                </h2>
              </div>

              <button className="rounded-full bg-orange-100 px-3 py-2 text-xs font-bold text-orange-700 transition active:scale-95">
                Voir plus
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-lg shadow-black/[0.04]">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-orange-600">
                  <ArrowLeftRight className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-zinc-900">
                    Transfert 777207230
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Aujourd’hui à 11:21
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-zinc-950">- 500 F</p>
                  <p className="mt-0.5 text-[10px] font-bold text-orange-600">
                    Envoyé
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Navigation flottante */}
        <nav
          aria-label="Navigation principale Max it"
          className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-5 pb-6"
        >
          <ul className="flex items-center justify-between rounded-[1.7rem] border border-white/10 bg-black px-3 py-3 shadow-2xl shadow-black/30">
            <li>
              <button
                aria-label="Transferts"
                className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/25 transition active:scale-95"
              >
                <ArrowLeftRight className="size-5" />
              </button>
            </li>

            <li>
              <button
                aria-label="Services"
                className="grid size-12 place-items-center rounded-2xl text-zinc-400 transition hover:bg-white/10 hover:text-orange-500 active:scale-95"
              >
                <LayoutGrid className="size-5" />
              </button>
            </li>

            <li>
              <button
                aria-label="Marché"
                className="grid size-12 place-items-center rounded-2xl text-zinc-400 transition hover:bg-white/10 hover:text-orange-500 active:scale-95"
              >
                <ShoppingCart className="size-5" />
              </button>
            </li>

            <li>
              <button
                aria-label="Cartes"
                className="grid size-12 place-items-center rounded-2xl text-zinc-400 transition hover:bg-white/10 hover:text-orange-500 active:scale-95"
              >
                <CreditCard className="size-5" />
              </button>
            </li>
          </ul>
        </nav>
      </main>
    </Screen>
  );
}
