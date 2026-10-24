import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, MotifBadge, Screen, TopBar } from "@/components/app/ui";
import { formatFCFA } from "@/lib/collecte";
import { claimInvite, getInvitePreview } from "@/lib/invite";
import { displayPhone, nationalPhone } from "@/lib/payment-input";
import { signInAnon } from "@/lib/supabase";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Rejoindre une collecte — Max it Partage" },
      { name: "description", content: "Remplissez vos informations pour participer." },
      { property: "og:title", content: "Rejoindre une collecte — Max it Partage" },
      { property: "og:description", content: "Remplissez vos informations pour participer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Invite,
});

type State = "loading" | "invalid" | "form" | "joining" | "success";

interface PreviewData {
  collecte_id: string;
  collecte_title: string;
  motif: string;
  amount: number;
  created_by_name: string;
}

function Invite() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  
  const [state, setState] = useState<State>("loading");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [errorMsg, setErrorMsg] = useState("Ce lien d'invitation n'est plus valide.");
  
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  
  const [touchedPrenom, setTouchedPrenom] = useState(false);
  const [touchedNom, setTouchedNom] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);

  // Fetch invite preview on mount
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const result = await getInvitePreview(token);
        
        if (!result.success) {
          setErrorMsg(result.message || "Ce lien d'invitation n'est plus valide.");
          setState("invalid");
          return;
        }
        
        setPreview({
          collecte_id: result.collecte_id!,
          collecte_title: result.collecte_title!,
          motif: result.motif!,
          amount: result.amount!,
          created_by_name: result.created_by_name!,
        });
        setState("form");
      } catch (err) {
        console.error("Failed to fetch invite preview:", err);
        setErrorMsg("Impossible de charger cette invitation. Vérifiez votre connexion.");
        setState("invalid");
      }
    };

    void fetchPreview();
  }, [token]);

  const validPrenom = prenom.trim().length >= 2;
  const validNom = nom.trim().length >= 2;
  const validPhone = nationalPhone(phone).length === 9;
  const canSubmit = validPrenom && validNom && validPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all as touched
    setTouchedPrenom(true);
    setTouchedNom(true);
    setTouchedPhone(true);
    
    if (!canSubmit) return;
    
    setState("joining");
    
    try {
      // Ensure we have an auth session
      await signInAnon();
      
      // Claim the invitation
      const result = await claimInvite(token, prenom, nom, phone);
      
      if (!result.success) {
        toast.error(result.message || "Impossible de rejoindre cette collecte.");
        setState("form");
        return;
      }
      
      setState("success");
      toast.success(`Bienvenue, ${prenom} !`);
      
      // Navigate to collecte after a short delay
      setTimeout(() => {
        void nav({ to: "/collecte/$id", params: { id: result.collecte_id! } });
      }, 1500);
    } catch (err) {
      console.error("Failed to claim invitation:", err);
      toast.error("Une erreur est survenue. Réessayez.");
      setState("form");
    }
  };

  // Loading state
  if (state === "loading") {
    return (
      <Screen nav={false}>
        <div className="grid min-h-dvh place-items-center px-8 text-center" role="status" aria-live="polite">
          <div>
            <Loader2 className="mx-auto size-12 animate-spin text-primary motion-reduce:animate-none" />
            <p className="mt-4 font-semibold">Chargement de l'invitation…</p>
          </div>
        </div>
      </Screen>
    );
  }

  // Invalid/expired state
  if (state === "invalid") {
    return (
      <Screen nav={false}>
        <div className="grid min-h-dvh place-items-center px-8 text-center">
          <div>
            <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-destructive-soft text-destructive">
              <AlertCircle className="size-10" />
            </div>
            <h1 className="mt-6 text-xl font-bold">Invitation invalide</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <Btn onClick={() => nav({ to: "/" })} className="mx-auto mt-8 max-w-xs">
              Retour à l'accueil
            </Btn>
          </div>
        </div>
      </Screen>
    );
  }

  // Joining/success state
  if (state === "joining" || state === "success") {
    return (
      <Screen nav={false}>
        <div className="grid min-h-dvh place-items-center px-8 text-center" role="status" aria-live="polite">
          <div>
            <Loader2 className="mx-auto size-12 animate-spin text-primary motion-reduce:animate-none" />
            <p className="mt-4 text-lg font-semibold">
              {state === "joining" ? "Inscription en cours…" : "Bienvenue !"}
            </p>
            {state === "success" && preview && (
              <p className="mt-2 text-sm text-muted-foreground">
                Redirection vers « {preview.collecte_title} »…
              </p>
            )}
          </div>
        </div>
      </Screen>
    );
  }

  // Form state
  const fullPhone = `+221 ${displayPhone(phone)}`;

  return (
    <Screen nav={false}>
      <TopBar title="Invitation" back={true} />
      
      <div className="px-5 pb-8">
        {preview && (
          <div className="mb-6 rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <MotifBadge motif={preview.motif as any} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{preview.collecte_title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Invité par {preview.created_by_name}
                </p>
              </div>
            </div>
            <div className="mt-3 border-t pt-3">
              <p className="text-sm text-muted-foreground">Votre contribution</p>
              <p className="mt-1 text-2xl font-extrabold">{formatFCFA(preview.amount)}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prenom" className="mb-2 block text-sm font-semibold">
              Prénom
            </label>
            <input
              id="prenom"
              type="text"
              autoFocus
              autoComplete="given-name"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              onBlur={() => setTouchedPrenom(true)}
              placeholder="Fatou"
              aria-invalid={touchedPrenom && !validPrenom}
              aria-describedby="prenom-help"
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {touchedPrenom && !validPrenom && (
              <p id="prenom-help" className="mt-1 text-xs text-destructive">
                Saisissez au moins 2 caractères.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nom" className="mb-2 block text-sm font-semibold">
              Nom
            </label>
            <input
              id="nom"
              type="text"
              autoComplete="family-name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onBlur={() => setTouchedNom(true)}
              placeholder="Diop"
              aria-invalid={touchedNom && !validNom}
              aria-describedby="nom-help"
              className="h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {touchedNom && !validNom && (
              <p id="nom-help" className="mt-1 text-xs text-destructive">
                Saisissez au moins 2 caractères.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
              Téléphone
            </label>
            <div className="flex min-h-12 items-center rounded-xl border bg-card shadow-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <div className="flex shrink-0 items-center gap-2 border-r px-3">
                <span className="text-lg" aria-hidden>
                  🇸🇳
                </span>
                <span className="text-sm font-semibold">+221</span>
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={displayPhone(phone)}
                onChange={(e) => setPhone(nationalPhone(e.target.value))}
                onBlur={() => setTouchedPhone(true)}
                placeholder="77 123 45 67"
                aria-invalid={touchedPhone && !validPhone}
                aria-describedby="phone-help"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p
              id="phone-help"
              className={`mt-1 text-xs ${
                touchedPhone && !validPhone ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {touchedPhone && !validPhone
                ? "Saisissez les 9 chiffres de votre numéro."
                : "Indicatif +221 inclus, saisissez seulement votre numéro."}
            </p>
          </div>

          <Btn type="submit" disabled={!canSubmit} className="mt-6">
            Rejoindre — {preview?.collecte_title || "la collecte"} <ArrowRight className="size-4" />
          </Btn>

          <p className="text-center text-xs text-muted-foreground">
            En rejoignant, vous pourrez suivre et payer votre part.
          </p>
        </form>
      </div>
    </Screen>
  );
}
