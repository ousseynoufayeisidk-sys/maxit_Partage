import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Loader2, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { useRef, useState } from "react";
import { Btn, MotifBadge, Progress, Screen, TopBar } from "@/components/app/ui";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { contributed, formatFCFA, remainingAmount } from "@/lib/collecte";
import { toast } from "sonner";
import { displayPhone, nationalPhone } from "@/lib/payment-input";
import { actions, ME, useStore } from "@/lib/store";

export const Route = createFileRoute("/paiement/$id")({
  head: () => ({ meta: [
    { title: "Payer avec Orange Money — Max it Partage" },
    { name: "description", content: "Essayez votre contribution Orange Money en simulation, sans débit réel." },
    { property: "og:title", content: "Payer avec Orange Money — Max it Partage" },
    { property: "og:description", content: "Une contribution Orange Money en démonstration, sans argent débité." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Paiement,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STEPS = ["Préparation du paiement simulé…", "Validation de la démonstration…", "Enregistrement de votre contribution…"];

function Paiement() {
  const { id } = Route.useParams();
  const c = useStore((s) => s.collectes.find((x) => x.id === id));
  const nav = useNavigate();
  const me = c?.participants.find((p) => p.isMe);
  const [step, setStep] = useState<"infos" | "code" | "processing">("infos");
  const [phone, setPhone] = useState(nationalPhone(ME.phone));
  const [pin, setPin] = useState("");
  const [touched, setTouched] = useState(false);
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [customAmount, setCustomAmount] = useState("");
  const [msg, setMsg] = useState(STEPS[0]);
  const paying = useRef(false);
  if (!c || !me) throw notFound();
  const validPhone = phone.length === 9;
  const fullPhone = `+221 ${displayPhone(phone)}`;
  const remaining = remainingAmount(me);
  const amount = mode === "full" ? remaining : Number(customAmount);
  const validAmount = Number.isSafeInteger(amount) && amount > 0 && amount <= remaining;

  const confirm = async () => {
    if (paying.current || pin.length !== 4 || !validPhone || !validAmount) return;
    paying.current = true;
    setStep("processing");
    for (const m of STEPS) { setMsg(m); await sleep(900); }
    const ref = actions.pay(c.id, me.id, amount);
    if (!ref) {
      paying.current = false;
      setStep("infos");
      toast.error("Ce versement n’a pas été enregistré. Vérifiez le montant restant.");
      return;
    }
    await nav({ to: "/confirmation/$id", params: { id: c.id }, search: { ref } });
  };

  if (step === "processing") return (
    <Screen nav={false}>
      <div className="grid min-h-dvh place-items-center px-8 text-center" role="status" aria-live="polite">
        <div>
          <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-ink text-primary-foreground"><span className="text-2xl font-extrabold">O<span className="text-primary">M</span></span></div>
          <Loader2 className="mx-auto mt-8 size-8 animate-spin text-primary motion-reduce:animate-none" />
          <p className="mt-4 font-semibold">{msg}</p>
          <p className="mt-2 text-sm text-muted-foreground">{formatFCFA(amount)} · {fullPhone}</p>
          <p className="mt-6 text-xs text-muted-foreground">Simulation uniquement · Aucun débit réel</p>
        </div>
      </div>
    </Screen>
  );

  if (remaining === 0) return (
    <Screen nav={false}>
      <TopBar title="Paiement Orange Money" />
      <div className="px-5 py-12 text-center">
        <Check className="mx-auto size-12 text-success" />
        <h1 className="mt-4 text-xl font-bold">Votre part est réglée</h1>
        <p className="mt-2 text-muted-foreground">{formatFCFA(me.amount)} versés pour {c.title}</p>
        <Link to="/collecte/$id" params={{ id }} className="mt-6 block"><Btn>Voir la collecte</Btn></Link>
      </div>
    </Screen>
  );

  return (
    <Screen nav={false}>
      {step === "infos" ? <TopBar title="Paiement Orange Money" /> : (
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
          <Btn variant="soft" onClick={() => setStep("infos")} aria-label="Retour au numéro" className="h-10 w-10 shrink-0 p-0"><ArrowLeft className="size-5" /></Btn>
          <h1 className="text-lg font-bold">Confirmer ma contribution</h1>
        </header>
      )}
      <div className="px-5 pb-8">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold">
          <span className={step === "infos" ? "text-primary" : "text-success"}>{step === "code" && <Check className="mr-1 inline size-3.5" />}1. Contribution</span>
          <ChevronRight className="size-3 text-muted-foreground" />
          <span className={step === "code" ? "text-primary" : "text-muted-foreground"}>2. Confirmation</span>
          <span className="ml-auto rounded-full bg-warning-soft px-2.5 py-1 text-warning">Simulation</span>
        </div>

        <div className="border-b pb-6 text-center">
          <p className="text-sm text-muted-foreground">{step === "infos" ? "Votre reste à payer" : "Votre versement"}</p>
          <p className="mt-2 text-4xl font-extrabold leading-tight">{formatFCFA(step === "infos" ? remaining : amount)}</p>
          <div className="mt-4 flex items-center justify-center gap-2"><MotifBadge motif={c.motif} /><p className="min-w-0 text-left text-sm font-semibold">{c.title}</p></div>
        </div>

        {step === "infos" ? (
          <form onSubmit={(e) => { e.preventDefault(); setTouched(true); if (validPhone && validAmount) setStep("code"); }} className="pt-6">
            <div className="mb-6">
              <div className="mb-2 flex justify-between gap-2 text-xs text-muted-foreground"><span>Déjà versé : {formatFCFA(contributed(me))}</span><span>Part : {formatFCFA(me.amount)}</span></div>
              <Progress value={contributed(me) / me.amount} />
              <div role="group" aria-label="Montant du versement" className="mt-5 grid grid-cols-2 gap-2">
                <Btn type="button" variant={mode === "full" ? "primary" : "soft"} aria-pressed={mode === "full"} onClick={() => setMode("full")} className="h-10 rounded-lg px-2">Tout régler</Btn>
                <Btn type="button" variant={mode === "partial" ? "primary" : "soft"} aria-pressed={mode === "partial"} onClick={() => setMode("partial")} className="h-10 rounded-lg px-2">Payer une partie</Btn>
              </div>
              {mode === "partial" && <div className="mt-4">
                <label htmlFor="payment-amount" className="mb-2 block text-sm font-semibold">Montant à verser aujourd’hui</label>
                <div className="flex items-center rounded-lg border bg-card focus-within:border-primary"><input id="payment-amount" type="number" inputMode="numeric" min={1} max={remaining} step={1} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} aria-describedby="amount-help" aria-invalid={customAmount !== "" && !validAmount} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-lg font-bold outline-none" /><span className="pr-3 text-sm text-muted-foreground">FCFA</span></div>
                <p id="amount-help" className={`mt-2 text-xs ${customAmount !== "" && !validAmount ? "text-destructive" : "text-muted-foreground"}`}>{customAmount !== "" && !validAmount ? `Saisissez un montant entier de 1 à ${remaining} FCFA.` : `Reste après ce versement : ${formatFCFA(validAmount ? remaining - amount : remaining)}`}</p>
              </div>}
            </div>
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold">Mode de paiement</p>
              <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-soft via-card to-card p-4 shadow-card">
                <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-primary/10" aria-hidden />
                <span className="pointer-events-none absolute -bottom-12 right-16 size-24 rounded-full bg-primary/5" aria-hidden />
                <span className="flex size-12 shrink-0 items-center justify-center gap-0.5 rounded-xl bg-ink text-lg font-extrabold text-primary-foreground shadow-card ring-2 ring-primary/30">O<span className="sr-only">range </span><span className="text-primary">M</span></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold">Orange Money <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Sélectionné</span></p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Compte mobile · Sénégal · Instantané</p>
                </div>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-primary-foreground shadow-card"><Check className="size-4" strokeWidth={3} /></span>
              </div>
            </div>
            <label htmlFor="om-phone" className="mb-2 block text-sm font-semibold">Numéro Orange Money</label>
            <div className="flex min-h-16 items-center rounded-xl border bg-card shadow-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <div className="flex shrink-0 items-center gap-2 border-r px-3"><span className="text-lg" aria-hidden>🇸🇳</span><span className="text-sm font-semibold">+221</span></div>
              <input id="om-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={displayPhone(phone)} onChange={(e) => setPhone(nationalPhone(e.target.value))} onBlur={() => setTouched(true)} placeholder="77 123 45 67" aria-invalid={touched && !validPhone} aria-describedby="phone-help" className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground" />
            </div>
            <p id="phone-help" className={`mt-2 text-xs ${touched && !validPhone ? "text-destructive" : "text-muted-foreground"}`}>{touched && !validPhone ? "Saisissez les 9 chiffres de votre numéro." : "Indicatif +221 inclus, saisissez seulement votre numéro."}</p>
            <dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Frais</dt><dd className="font-semibold text-success">0 FCFA</dd></div><div className="flex justify-between border-t pt-3"><dt className="font-semibold">Total simulé</dt><dd className="font-bold">{formatFCFA(validAmount ? amount : 0)}</dd></div></dl>
            <Btn type="submit" disabled={!validPhone || !validAmount} className="mt-6">Continuer <ArrowRight className="size-4" /></Btn>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-success" />Aucun argent ne sera débité.</p>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void confirm(); }} className="pt-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><LockKeyhole className="size-6" /></div>
            <h2 className="mt-3 text-xl font-bold">Code de démonstration</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Utilisez <strong className="text-foreground">1234</strong> ou quatre chiffres fictifs.<br />Ne saisissez jamais votre vrai code Orange Money.</p>
            <InputOTP autoFocus maxLength={4} pattern="^[0-9]*$" value={pin} onChange={setPin} inputMode="numeric" autoComplete="off" aria-label="Code de démonstration à quatre chiffres" containerClassName="mt-6 justify-center">
              <InputOTPGroup className="gap-3">{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} className="size-14 rounded-xl border border-input bg-card text-2xl font-bold shadow-card first:rounded-xl last:rounded-xl" />)}</InputOTPGroup>
            </InputOTP>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Smartphone className="size-4" /><span>{fullPhone}</span></div>
            <Btn type="submit" disabled={pin.length !== 4} className="mt-6">Simuler le paiement <ArrowRight className="size-4" /></Btn>
            <p className="mt-4 text-xs text-muted-foreground">Démonstration uniquement · Aucun débit réel</p>
          </form>
        )}
      </div>
    </Screen>
  );
}
