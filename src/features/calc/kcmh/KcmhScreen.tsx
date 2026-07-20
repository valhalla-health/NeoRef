// KCMH guideline/lecture document browser — links out to static PDFs/images
// under public/kcmh/ instead of rendering inline reference cards like the
// other topic screens. The browser's native PDF/image viewer handles
// rendering; same-origin top-level navigation isn't affected by the app's
// CSP (frame-src/object-src 'none' only govern nested browsing contexts).

import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import { TopicHero, TopicScreenShell } from '../topic/TopicHelpers';

const KCMH_DOCS = [
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
    file: 'eos-flow-cu.jpg',
  },
  {
    id: 'practical-points',
    title: 'Practical points for newborn nurture',
    caption: 'Anongnart Sirisabya, M.D.',
    file: 'practical-points-newborn-nurture-2025.pdf',
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
              href={`./kcmh/${doc.file}`}
              target="_blank"
              rel="noopener"
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
