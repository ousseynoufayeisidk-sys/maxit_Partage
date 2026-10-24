import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Coins, Pencil, Plus, Wallet, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, Btn, MotifBadge, motifLabel, Screen, TopBar } from "@/components/app/ui";
import { formatDate, formatFCFA, perPerson } from "@/lib/collecte";
import { actions, useStore } from "@/lib/store";
import { collecteImages } from "@/lib/collecte-images";
import { displayPhone, nationalPhone } from "@/lib/payment-input";
import { ShareSheet } from "@/components/ShareSheet";

export const Route = createFileRoute("/verifier")({
  head: () => ({
    meta: [
      { title: "Vérifier et inviter — Max it Partage" },
      { name: "description", content: "Confirmez les détails et invitez vos participants." },
      { property: "og:title", content: "Vérifier et inviter — Max it Partage" },
      { property: "og:description", content: "Confirmez votre collecte et partagez le lien." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verifier,
});

function Verifier() {
  const d = useStore((s) => s.draft);
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [createdCollecteId, setCreatedCollecteId] = useState<string | null>(null);
  const creating = useRef(false);
  if (!d.title && !creating.current) return <Navigate to="/creer" />;
  const others = d.count - 1;

  const add = () => {
    const trimmedName = name.trim();
    const normalized = nationalPhone(phone);
    
    // Validate name
    if (!trimmedName || d.names.length >= others) {
      setPhoneError("Nom requis.");
      return;
    }
    
    // Validate phone (9 digits)
    if (normalized.length !== 9) {
      setPhoneError("Le numéro doit contenir exactement 9 chiffres.");
      return;
    }
    
    // Check for duplicate phone
    const fullPhone = `+221${normalized}`;
    if (d.phones.includes(fullPhone)) {
      setPhoneError("Ce numéro est déjà dans la liste.");
      return;
    }
    
    actions.updateDraft({ 
      names: [...d.names, trimmedName],
      phones: [...d.phones, fullPhone]
    });
    setName("");
    setPhone("");
    setPhoneError("");
  };
  
  const create = async (thenShare: boolean) => {
    creating.current = true;
    try {
      const id = await actions.createFromDraft();
      toast.success("Collecte créée !");
      setCreatedCollecteId(id);
      if (thenShare) {
        setShowShareSheet(true);
      } else {
        await nav({ to: "/collecte/$id", params: { id } });
      }
    } catch (err) {
      console.error("Failed to create collecte:", err);
      toast.error("Erreur lors de la création de la collecte.");
      creating.current = false;
    }
  };

  return (
    <Screen nav={false}>
      <TopBar title="Vérifier et inviter" />
      <div className="space-y-4 px-5 pb-44">
        <img src={collecteImages[d.motif].src} alt={collecteImages[d.motif].alt} width={1088} height={608} className="aspect-[16/9] w-full rounded-xl object-cover" />

        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <MotifBadge motif={d.motif} />
          <div className="flex-1">
            <p className="font-bold">{d.title}</p>
            <p className="text-xs text-muted-foreground">{motifLabel(d.motif)} • {d.count} participants</p>
          </div>
          <Link to="/creer" aria-label="Modifier" className="grid size-9 place-items-center rounded-full hover:bg-muted"><Pencil className="size-4" /></Link>
        </div>

        <dl className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
          <Row icon={Wallet} label="Montant total" value={formatFCFA(d.total)} />
          <Row icon={Coins} label="Contribution par personne" value={formatFCFA(perPerson(d.total, d.count))} />
          <Row icon={CalendarDays} label="Date limite" value={d.deadline ? formatDate(d.deadline) : "Aucune"} />
        </dl>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold">Inviter les participants <span className="text-muted-foreground">({d.names.length}/{others})</span></h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-3 text-xs font-medium"><Avatar p={{ name: "Vous", isMe: true }} size={24} /> Vous</span>
            {d.names.map((n, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-2 text-xs font-medium">
                <Avatar p={{ name: n }} size={24} /> {n}
                <button aria-label={`Retirer ${n}`} onClick={() => actions.updateDraft({ names: d.names.filter((_, j) => j !== i) })}><X className="size-3.5" /></button>
              </span>
            ))}
          </div>
          {d.names.length < others && (
            <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Prénom et nom"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" 
              />
              <div className="flex gap-2">
                <div className="flex flex-1 items-center rounded-xl border bg-card shadow-card">
                  <div className="flex shrink-0 items-center gap-2 border-r px-3">
                    <span className="text-base" aria-hidden>🇸🇳</span>
                    <span className="text-xs font-semibold">+221</span>
                  </div>
                  <input 
                    type="tel"
                    inputMode="tel"
                    value={displayPhone(phone)}
                    onChange={(e) => {
                      setPhone(nationalPhone(e.target.value));
                      setPhoneError("");
                    }}
                    placeholder="77 123 45 67"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground" 
                  />
                </div>
                <button 
                  type="submit"
                  aria-label="Ajouter" 
                  className="tap grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Plus className="size-5" />
                </button>
              </div>
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </form>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md space-y-2 border-t bg-card/95 p-4 pb-safe backdrop-blur">
        <Btn onClick={() => create(true)}>Créer et partager les invitations</Btn>
        <Btn variant="soft" onClick={() => create(false)}>Inviter plus tard</Btn>
      </div>

      {showShareSheet && createdCollecteId && (
        <ShareSheet 
          collecteId={createdCollecteId} 
          collecteTitle={d.title}
          onClose={() => {
            setShowShareSheet(false);
            nav({ to: "/collecte/$id", params: { id: createdCollecteId } });
          }} 
        />
      )}
    </Screen>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"><Icon className="size-4" /></span>
      <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>
    </div>
  );
}

