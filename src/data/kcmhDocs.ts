// KCMH guideline/lecture documents. The KCMH tab (KcmhScreen.tsx) lists
// them all, grouped by `section`; the home screen's quick tools
// (HomeScreen.tsx) link a couple of them directly.
//
// Local docs are static PDFs under public/kcmh/. The browser's native PDF
// viewer handles rendering; same-origin top-level navigation isn't affected
// by the app's CSP (frame-src/object-src 'none' only govern nested browsing
// contexts).
//
// All docs are PDFs (the EOS guideline was originally a JPG, converted to
// PDF here) — a raw image opened via target="_blank" leaves the SPA for a
// fresh, history-less browsing context, and on Android/PWA that makes the
// hardware back button close the context (and exit the app) instead of
// returning to it. The browser's native PDF viewer doesn't have that problem.
//
// The one exception is the resident handbook: a live Craft page its author
// keeps editing, so it's linked rather than copied into public/kcmh/ (it
// embeds third-party guideline PDFs — see AUDIT.md S-1) and needs a connection.

export type KcmhSection = 'guideline' | 'lecture';

type KcmhDocEntry = { id: string; section: KcmhSection; title: string; caption: string } & (
  | { file: string } // PDF under public/kcmh/
  | { url: string } // external page
);

export const KCMH_DOCS = [
  {
    id: 'resident-handbook',
    section: 'guideline',
    title: 'Resident handbook',
    caption: 'Newborn KCMH · Thanin Rianpairoj, M.D. — online, needs internet',
    url: 'https://thaneo.craft.me/resident',
  },
  {
    id: 'hypoglycemia',
    section: 'guideline',
    title: 'Hypoglycemia',
    caption: 'Neonatal hypoglycemia flow (CU)',
    file: 'neonatal-hypoglycemia-flow-cu.pdf',
  },
  {
    id: 'jaundice',
    section: 'guideline',
    title: 'Jaundice',
    caption: 'Neonatal jaundice flow — IPD',
    file: 'neonatal-jaundice-flow-ipd.pdf',
  },
  {
    id: 'eos',
    section: 'guideline',
    title: 'EOS',
    caption: 'Early Onset Sepsis guideline (CU)',
    file: 'eos-flow-cu.pdf',
  },
  {
    id: 'eos-antibiotic-overuse',
    section: 'lecture',
    title: 'Antibiotic overuse in neonatal EOS',
    caption: 'Peeraporn Pongsupamongkol, M.D. — CUPA 2026',
    file: 'eos-antibiotic-overuse-cupa-2026.pdf',
  },
  {
    id: 'practical-points',
    section: 'lecture',
    title: 'Practical points for newborn nurture',
    caption: 'Anongnart Sirisabya, M.D.',
    file: 'practical-points-newborn-nurture-2025.pdf',
  },
  {
    id: 'preterm-feeding',
    section: 'lecture',
    title: 'Preterm feeding',
    caption: 'Peeraporn Pongsupamongkol, M.D.',
    file: 'preterm-feeding-2025.pdf',
  },
] as const satisfies readonly KcmhDocEntry[];

export type KcmhDoc = (typeof KCMH_DOCS)[number];

/** Anchor attributes for a doc. Every doc opens in a new tab rather than
 *  navigating the SPA, and the external handbook gets no referrer. */
export function kcmhDocLinkProps(doc: KcmhDoc) {
  return 'url' in doc
    ? { href: doc.url, target: '_blank', rel: 'noreferrer noopener' }
    : { href: `./kcmh/${doc.file}`, target: '_blank', rel: 'noopener' };
}
