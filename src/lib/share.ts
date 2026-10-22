import { toast } from "sonner";

export async function share(title: string) {
  const data = { title: "Max it Partage", text: `Participe à « ${title} » sur Max it Partage`, url: window.location.origin };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); toast.success("Lien copié"); }
  } catch {}
}
