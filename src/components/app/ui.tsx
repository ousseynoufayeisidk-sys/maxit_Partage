import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft, Bell, CalendarDays, CheckCircle2, ChevronRight, Clock, Gift, House, LayoutGrid,
  Plus, Martini, FileText, CircleEllipsis, Sparkles, Trophy, User, Users, Zap, type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { collected, daysLeft, formatNumber, isDone, paidCount, type Collecte, type Motif, type Participant } from "@/lib/collecte";
import { useStore } from "@/lib/store";
import ouzImage from "@/assets/ouz.png";
import mascotJojImage from "@/assets/mascot-joj.png";

const ouz = { url: ouzImage };
const mascotJoj = { url: mascotJojImage };
import { collecteImages } from "@/lib/collecte-images";

export const MOTIFS: { id: Motif; label: string; icon: LucideIcon }[] = [
  { id: "anniversaire", label: "Anniversaire", icon: Gift },
  { id: "sortie", label: "Sortie", icon: Martini },
  { id: "facture", label: "Facture", icon: FileText },
  { id: "cadeau", label: "Cadeau", icon: Gift },
  { id: "evenement", label: "Événement", icon: CalendarDays },
  { id: "autre", label: "Autre", icon: CircleEllipsis },
];
export const motifIcon = (m: Motif) => MOTIFS.find((x) => x.id === m)?.icon ?? Users;
export const motifLabel = (m: Motif) => MOTIFS.find((x) => x.id === m)?.label ?? "Autre";

export const avatarUrl = ouz.url;

/** Mobile app frame: full screen on phones, centered phone-width column on desktop. */
export function Screen({ children, nav = true, className }: { children: ReactNode; nav?: boolean; className?: string }) {
  return (
    <div className="min-h-dvh bg-secondary">
      <div className={cn("relative mx-auto flex min-h-dvh max-w-md flex-col bg-background md:shadow-card", className)}>
        <AnimatedBackdrop />
        <main className={cn("relative flex-1", nav && "pb-28")}>{children}</main>
        {nav && (<><BottomNav /><JojMascot /></>)}
      </div>
    </div>
  );
}

/** Soft, slowly drifting orange blobs behind the app content. */
export function AnimatedBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="animate-blob absolute -left-16 -top-12 size-64 rounded-full bg-primary/15 blur-3xl" />
      <span className="animate-blob absolute -right-20 top-1/4 size-72 rounded-full bg-warning/15 blur-3xl" style={{ animationDelay: "-5s" }} />
      <span className="animate-blob absolute -left-14 bottom-24 size-56 rounded-full bg-success/10 blur-3xl" style={{ animationDelay: "-9s" }} />
    </div>
  );
}

/** Mascot ticker with continuously scrolling messages. */
export function TickerBanner({ items }: { items: string[] }) {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold">
          <Sparkles className="size-3.5 shrink-0" /> {t}
        </span>
      ))}
    </div>
  );
  return (
    <div className="mt-5 flex items-center gap-2.5 overflow-hidden rounded-full bg-primary-soft py-2 pl-2.5 pr-4 text-primary">
      <img src={mascotJoj.url} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max">
          <Row />
          <Row hidden />
        </div>
      </div>
    </div>
  );
}

/** Animated splash shown when entering the Max it Partage app. */

export function SplashPartage() {
  const [show, setShow] = useState(false);
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Vérifier si le splash a déjà été affiché dans cette session
    const hasSeenSplash = sessionStorage.getItem('maxitPartage_splashShown');
    
    // Ne montrer le splash que si c'est la toute première fois dans la session
    if (!hasSeenSplash) {
      setShow(true);
      sessionStorage.setItem('maxitPartage_splashShown', 'true');
      
      const exitTimer = window.setTimeout(() => setOut(true), 1800);
      const removeTimer = window.setTimeout(() => setGone(true), 2450);

      return () => {
        window.clearTimeout(exitTimer);
        window.clearTimeout(removeTimer);
      };
    } else {
      // Ne pas afficher le splash - déjà vu dans cette session
      setGone(true);
    }
  }, []);

  if (!show || gone) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#fffaf5] transition-[opacity,transform,filter] duration-700 ease-out",
        out && "pointer-events-none scale-110 opacity-0 blur-sm",
      )}
    >
      {/* Halos lumineux */}
      <div className="absolute -left-28 -top-24 size-96 rounded-full bg-orange-300/45 blur-3xl" />
      <div className="absolute -bottom-40 -right-28 size-[30rem] rounded-full bg-orange-200/60 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/70 blur-3xl" />

      {/* Grille très discrète */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,121,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,0,0.08)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      <div className="relative flex max-w-xs flex-col items-center px-8 text-center text-zinc-950">
      

        {/* Mascotte */}
        <div className="relative grid size-36 place-items-center rounded-full border border-orange-200 bg-white/80 shadow-[0_18px_55px_rgba(255,121,0,0.28)] backdrop-blur">
          <div className="absolute inset-2 rounded-full border border-orange-200/80" />
          <div className="absolute inset-0 animate-ping rounded-full border border-orange-400/40 [animation-duration:2.4s]" />

          <img
            src={mascotJoj.url}
            alt=""
            width={112}
            height={112}
            className="relative size-28 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.16)]"
          />
        </div>

        <p className="mt-7 text-4xl font-black tracking-[-0.06em] text-zinc-950">
          Max it
          <span className="ml-2 font-light text-orange-600">Partage</span>
        </p>

        <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
          Créez, collectez et partagez.
          <br />
          <span className="font-semibold text-orange-600">
            Ensemble, c&apos;est plus simple.
          </span>
        </p>

        {/* Chargement */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="size-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,121,0,0.55)] animate-[bounce_1s_infinite]"
                style={{ animationDelay: `${index * 150}ms` }}
              />
            ))}
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Chargement sécurisé
          </span>
        </div>
      </div>

      {/* Marque orange */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-1 w-10 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(255,121,0,0.7)]" />
      </div>
    </div>
  );
}


export function TopBar({ title, right, back = true }: { title: string; right?: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur">
      {back && (
        <button
          aria-label="Retour"
          onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/partage" }))}
          className="tap -ml-2 grid size-10 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const items = [
    { to: "/partage", label: "Accueil", icon: House },
    { to: "/partages", label: "Mes partages", icon: LayoutGrid },
    null,
    { to: "/notifications", label: "Notifications", icon: Bell, badge: unread },
    { to: "/profil", label: "Profil", icon: User },
  ] as const;
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t bg-card/95 pb-safe backdrop-blur">
      <ul className="grid grid-cols-5 items-end px-2 pt-2">
        {items.map((it, i) =>
          it === null ? (
            <li key={i} className="flex justify-center">
              <Link
                to="/creer"
                aria-label="Créer un partage"
                className="tap -mt-8 grid size-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow ring-4 ring-background"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </Link>
            </li>
          ) : (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-1 text-[11px] font-medium",
                  path === it.to ? "text-primary" : "text-muted-foreground",
                )}
              >
                <it.icon className="size-5" />
                {"badge" in it && it.badge ? (
                  <span className="absolute right-[calc(50%-18px)] top-0 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {it.badge}
                  </span>
                ) : null}
                {it.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

export function Btn({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "outline" }) {
  return (
    <button
      {...props}
      className={cn(
        "tap inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-gradient-primary text-primary-foreground shadow-glow",
        variant === "soft" && "bg-muted text-foreground",
        variant === "outline" && "border-2 border-primary/30 bg-card text-foreground",
        className,
      )}
    />
  );
}

const tones = ["bg-primary-soft text-accent-foreground", "bg-success-soft text-success", "bg-warning-soft text-warning", "bg-secondary text-foreground"];
export function Avatar({ p, size = 36 }: { p: Pick<Participant, "name" | "isMe">; size?: number }) {
  if (p.isMe) return <img src={avatarUrl} alt="Vous" style={{ width: size, height: size }} className="rounded-full object-cover ring-2 ring-card" />;
  const tone = tones[p.name.charCodeAt(0) % tones.length];
  return (
    <span style={{ width: size, height: size }} className={cn("grid shrink-0 place-items-center rounded-full text-xs font-bold ring-2 ring-card", tone)}>
      {p.name.slice(0, size < 30 ? 1 : 2).toUpperCase()}
    </span>
  );
}

export function MotifBadge({ motif, size = "md" }: { motif: Motif; size?: "md" | "lg" }) {
  const Icon = motifIcon(motif);
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-primary-soft text-primary", size === "lg" ? "size-14" : "size-11")}>
      <Icon className={size === "lg" ? "size-7" : "size-5"} />
    </span>
  );
}

export function StatusPill({ status }: { status: Participant["status"] | "encours" | "termine" }) {
  const map = {
    paye: ["Payé", "bg-success-soft text-success", CheckCircle2],
    termine: ["Terminée", "bg-success-soft text-success", CheckCircle2],
    attente: ["En attente", "bg-warning-soft text-warning", Clock],
    encours: ["En cours", "bg-success-soft text-success", Zap],
  } as const;
  const [label, cls, Icon] = map[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold", cls)}>
      <Icon className="size-3" /> {label}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <div className="h-full rounded-full bg-gradient-primary transition-[width] duration-700" style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

export function Ring({ value, label }: { value: number; label: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} className="fill-none stroke-success transition-all duration-700" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl font-bold">{label}</span>
    </div>
  );
}

export function CollecteCard({ c, showChevron = true }: { c: Collecte; showChevron?: boolean }) {
  const got = collected(c), done = isDone(c), left = daysLeft(c);
  return (
    <Link to="/collecte/$id" params={{ id: c.id }} className="tap flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
      <img src={collecteImages[c.motif].src} alt={collecteImages[c.motif].alt} width={64} height={64} loading="lazy" className="size-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{c.title}</p>
          {!showChevron && <StatusPill status={done ? "termine" : "encours"} />}
        </div>
        <p className="mt-0.5 text-sm font-medium">
          {formatNumber(got)} <span className="text-muted-foreground">/ {formatNumber(c.total)} FCFA</span>
        </p>
        {done ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="size-3.5" /> Collecte terminée</p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {paidCount(c)}/{c.participants.length} participants{left !== null && ` • ${left} jours restants`}
            </p>
            <Progress value={got / c.total} className={cn("mt-2", !showChevron && "w-3/4")} />
          </>
        )}
      </div>
      {showChevron && <ChevronRight className="size-5 text-muted-foreground" />}
    </Link>
  );
}

export function SectionTitle({ children, to }: { children: ReactNode; to?: "/partages" }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="font-bold">{children}</h2>
      {to && (
        <Link to={to} className="flex items-center text-xs font-medium text-muted-foreground hover:text-primary">
          Voir tout <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative size-7 rounded-[4px] bg-primary" aria-hidden>
        <span className="absolute bottom-1.5 left-1.5 h-[3px] w-3.5 bg-primary-foreground" />
      </span>
      <span className="text-xl font-extrabold tracking-tight">Max <span className="text-primary">it</span></span>
    </div>
  );
}

const CONFETTI = [
  { l: "8%", t: "12%", c: "bg-primary-foreground/80", d: "0ms" },
  { l: "20%", t: "4%", c: "bg-primary-foreground/40", d: "200ms" },
  { l: "34%", t: "18%", c: "bg-primary-foreground/60", d: "400ms" },
  { l: "66%", t: "6%", c: "bg-primary-foreground/70", d: "100ms" },
  { l: "80%", t: "16%", c: "bg-primary-foreground/80", d: "300ms" },
  { l: "92%", t: "8%", c: "bg-primary-foreground/50", d: "500ms" },
];

export function DoneBanner({ c }: { c: Collecte }) {
  const last = c.history[c.history.length - 1];
  return (
    <section aria-label="Collecte terminée" className="animate-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-success p-5 text-primary-foreground shadow-glow">
      {CONFETTI.map((k, i) => (
        <span key={i} aria-hidden className={cn("animate-confetti absolute h-2.5 w-1.5 rounded-sm", k.c)} style={{ left: k.l, top: k.t, animationDelay: k.d }} />
      ))}
      <div aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full bg-primary-foreground/10" />
      <div aria-hidden className="absolute -bottom-12 -left-8 size-32 rounded-full bg-primary-foreground/10" />

      <div className="relative flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary-foreground/20 ring-4 ring-primary-foreground/15 backdrop-blur">
          <Trophy className="size-8" />
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
            <CheckCircle2 className="size-3" /> Objectif atteint
          </span>
          <p className="mt-1 text-xl font-extrabold leading-tight">Collecte terminée !</p>
          <p className="text-xs opacity-90">Bravo, tout le monde a contribué 🎉</p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat v={formatNumber(collected(c))} k="FCFA collectés" />
        <Stat v={`${paidCount(c)}/${c.participants.length}`} k="ont payé" />
        <Stat v="100%" k="de l'objectif" />
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {c.participants.slice(0, 5).map((p) => (
            <span key={p.id} className="rounded-full ring-2 ring-primary-foreground/80"><Avatar p={p} size={28} /></span>
          ))}
          {c.participants.length > 5 && (
            <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/25 text-[10px] font-bold ring-2 ring-primary-foreground/80">+{c.participants.length - 5}</span>
          )}
        </div>
        {last && <span className="text-[11px] opacity-90">Terminée le {new Date(last.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
      </div>
    </section>
  );
}

function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/15 px-2 py-2.5 backdrop-blur">
      <p className="text-base font-extrabold leading-none">{v}</p>
      <p className="mt-1 text-[10px] opacity-90">{k}</p>
    </div>
  );
}

/** Clapping JOJ mascot with a speech bubble, shown after a successful payment. */
export function JojCheer({ message = "Bravo champion !" }: { message?: string }) {
  return (
    <div className="relative mx-auto mt-6 flex items-end justify-center gap-2">
      <div className="animate-pop relative">
        <Sparkles aria-hidden className="animate-sparkle absolute -left-4 top-2 size-5 text-warning" />
        <Sparkles aria-hidden className="animate-sparkle absolute -right-3 top-7 size-4 text-primary" style={{ animationDelay: "0.4s" }} />
        <img
          src={mascotJoj.url}
          alt="La mascotte des JOJ applaudit"
          width={112}
          height={112}
          className="animate-clap size-28 object-contain drop-shadow-lg"
        />
      </div>
      <div className="animate-pop mb-8 max-w-44 rounded-2xl rounded-bl-md bg-card p-3 text-left shadow-card" style={{ animationDelay: "150ms" }}>
        <p className="text-xs font-bold text-primary">{message}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">Chaque contribution rapproche le groupe de l'objectif 🦁</p>
      </div>
    </div>
  );
}

/** Dakar 2026 Youth Olympic Games mascot, floating at the bottom-left of the app. */
const JOJ_START = new Date(2026, 9, 31); // YOG Dakar opening

export function JojMascot() {
  const [open, setOpen] = useState(false);
  const [cheer, setCheer] = useState(false);
  const days = Math.max(0, Math.ceil((JOJ_START.getTime() - Date.now()) / 86_400_000));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-30">
      <div className="relative mx-auto max-w-md px-3">
        {open && (
          <div role="status" className="animate-pop absolute bottom-full left-3 mb-1 w-56 rounded-2xl rounded-bl-md bg-card p-3 shadow-card">
            <p className="flex items-center gap-1 text-xs font-bold text-primary"><Zap className="size-3.5" /> JOJ Dakar 2026</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Salut ! Les Jeux Olympiques de la Jeunesse démarrent à Dakar dans {days} jour{days > 1 ? "s" : ""} 🦁
            </p>
          </div>
        )}
        <button
          type="button"
          aria-label="Mascotte des JOJ Dakar 2026"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setCheer(true);
            setTimeout(() => setCheer(false), 700);
          }}
          className="pointer-events-auto tap block"
        >
          <img
            src={mascotJoj.url}
            alt=""
            width={64}
            height={64}
            className={cn("size-16 object-contain drop-shadow-md", cheer ? "animate-cheer" : "animate-bob")}
          />
        </button>
      </div>
    </div>
  );
}
