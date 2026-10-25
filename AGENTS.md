> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App state (collectes, draft, notifications) lives in `src/lib/store.ts`, a tiny external store persisted to localStorage and hydrated after mount — keeps SSR markup stable until a backend is added.
- Shared mobile UI primitives live in `src/components/app/ui.tsx`; pages are one route file per screen — keeps the 8 mockup screens consistent.
- Payments are simulated client-side (`actions.pay`) — no real money moves until a provider is integrated.
- Incremental contributions use shared contributed/remainingAmount helpers and validated store actions; receipts resolve immutable payment records by reference — keeps totals and historical receipts consistent while preserving older demo data.
- PWA is manifest-only (installable, no service worker) — avoids stale caches in preview.
- Collection cover images are resolved by motif through `src/lib/collecte-images.ts` across creation, review and collection views — keeps imagery consistent without changing stored collection data.
- Payment phone normalization lives in `src/lib/payment-input.ts` — keeps the displayed country prefix separate from the editable number and makes formatting testable.
