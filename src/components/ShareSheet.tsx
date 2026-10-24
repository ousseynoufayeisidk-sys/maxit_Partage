import { useState } from "react";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Btn } from "@/components/app/ui";

export function ShareSheet({ collecteId, collecteTitle, onClose }: { collecteId: string; collecteTitle: string; onClose: () => void }) {
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; invite_token: string }>>([]);
  const [loading, setLoading] = useState(true);
  // Use production URL for invite links, not preview URLs
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://maxit-partage.vercel.app';

  useState(() => {
    (async () => {
      try {
        const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
        const currentUserId = user?.id;

        if (!currentUserId) {
          console.error('No user ID available');
          return;
        }

        const { data, error } = await import("@/lib/supabase").then(m => 
          m.supabase
            .from('participants')
            .select('id, prenom, nom, invite_token')
            .eq('collecte_id', collecteId)
            .is('profile_id', null) // Only show unclaimed invitations (guests not yet joined)
        );

        if (error) throw error;

        if (data) {
          setParticipants(data.map(p => ({
            id: p.id,
            name: `${p.prenom} ${p.nom || ''}`.trim(),
            invite_token: p.invite_token!,
          })));
        }
      } catch (err) {
        console.error('Failed to load participants:', err);
        toast.error('Impossible de charger les participants');
      } finally {
        setLoading(false);
      }
    })();
  });

  const copyLink = (token: string, name: string) => {
    const link = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(`Lien copié pour ${name}`);
  };

  const shareWhatsApp = (token: string, name: string) => {
    const link = `${baseUrl}/invite/${token}`;
    const text = `Salut ${name} ! Tu es invité(e) à participer à "${collecteTitle}". Clique sur ce lien pour rejoindre : ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-safe shadow-xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Invitations prêtes</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : participants.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucun invité à partager</div>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <Avatar p={{ name: p.name }} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Lien d'invitation</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(p.invite_token, p.name)}
                    className="tap grid size-9 place-items-center rounded-lg bg-primary-soft text-primary"
                    aria-label={`Copier le lien pour ${p.name}`}
                  >
                    <Share2 className="size-4" />
                  </button>
                  <button
                    onClick={() => shareWhatsApp(p.invite_token, p.name)}
                    className="tap grid size-9 place-items-center rounded-lg bg-[#25D366] text-white"
                    aria-label={`Partager sur WhatsApp avec ${p.name}`}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Btn onClick={onClose} variant="soft" className="mt-4">
          Voir la collecte
        </Btn>
      </div>
    </div>
  );
}
