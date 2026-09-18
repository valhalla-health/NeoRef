// KCMH guideline/lecture document browser — links out to static PDFs
// under public/kcmh/ instead of rendering inline reference cards like the
// other topic screens. The browser's native PDF viewer handles rendering;
// same-origin top-level navigation isn't affected by the app's CSP
// (frame-src/object-src 'none' only govern nested browsing contexts).
//
// All docs are PDFs (the EOS guideline was originally a JPG, converted to
// PDF here) — a raw image opened via target="_blank" leaves the SPA for a
// fresh, history-less browsing context, and on Android/PWA that makes the
// hardware back button close the context (and exit the app) instead of
// returning here. The browser's native PDF viewer doesn't have that problem.
//
// The one exception is the resident handbook: a live Craft page its author
// keeps editing, so it's linked rather than copied into public/kcmh/ (it
// embeds third-party guideline PDFs — see AUDIT.md S-1) and needs a connection.

import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import { TopicHero, TopicScreenShell } from '../topic/TopicHelpers';

const KCMH_DOCS = [
  {
    id: 'resident-handbook',
    title: 'Resident handbook',
    caption: 'Newborn KCMH · Thanin Rianpairoj, M.D. — online, needs internet',
    url: 'https://thaneo.craft.me/resident',
  },
  {
    id: 'hypoglycemia',
    title: 'Hypoglycemia',
    caption: 'Neonatal hypoglycemia flow (CU)',
    file: 'neonatal-hypoglycemia-flow-cu.pdf',
  },
  {
    id: 'jaundice',
    title: 'Jaundice',
    caption: 'Neonatal jaundice flow — IPD',
    file: 'neonatal-jaundice-flow-ipd.pdf',
  },
  {
    id: 'eos',
    title: 'EOS',
    caption: 'Early Onset Sepsis guideline (CU)',
    file: 'eos-flow-cu.pdf',
  },
  {
    id: 'eos-antibiotic-overuse',
    title: 'Antibiotic overuse in neonatal EOS',
    caption: 'Peeraporn Pongsupamongkol, M.D. — CUPA 2026',
    file: 'eos-antibiotic-overuse-cupa-2026.pdf',
  },
  {
    id: 'practical-points',
    title: 'Practical points for newborn nurture',
    caption: 'Anongnart Sirisabya, M.D.',
    file: 'practical-points-newborn-nurture-2025.pdf',
  },
  {
    id: 'preterm-feeding',
    title: 'Preterm feeding',
    caption: 'Peeraporn Pongsupamongkol, M.D.',
    file: 'preterm-feeding-2025.pdf',
  },
] as const;

export function KcmhScreen() {
  return (
    <TopicScreenShell>
      <TopicHero
        chips={[{ tone: 'terra', label: 'KCMH' }]}
        title="KCMH"
        accent="Guidelines & Lectures."
        subtitle="tap to open the original document"
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 16px' }}>
        <DisclaimerBanner compact />
        <div style={{ display: 'grid', gap: 8 }}>
          {KCMH_DOCS.map((doc) => (
            <a
              key={doc.id}
              href={'url' in doc ? doc.url : `./kcmh/${doc.file}`}
              target="_blank"
              rel={'url' in doc ? 'noreferrer noopener' : 'noopener'}
              style={{
                display: 'block',
                background: warm.card,
                border: `1.5px solid ${warm.line}`,
                borderRadius: 12,
                padding: '12px 14px',
                textDecoration: 'none',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: warm.ink, fontFamily: font.ui }}>
                {doc.title}
              </div>
              <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2 }}>{doc.caption}</div>
            </a>
          ))}
        </div>
      </div>
    </TopicScreenShell>
  );
}
