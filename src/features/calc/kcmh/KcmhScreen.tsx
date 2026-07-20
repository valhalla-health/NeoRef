// KCMH guideline/lecture document browser. PDFs link out to the browser's
// native viewer — same-origin top-level navigation isn't affected by the
// app's CSP (frame-src/object-src 'none' only govern nested browsing
// contexts), and PDFs can't be embedded inline under that CSP anyway.
//
// Images open in an in-app viewer instead of a new tab/window. A `target="_blank"`
// image navigation leaves the SPA for a fresh, history-less browsing context —
// on Android/PWA that makes the hardware back button close the context (and
// exit the app) rather than return to this screen. Rendering the image with
// a plain <img> (allowed by img-src 'self') keeps it inside the SPA's own
// history stack, so the existing back button/hardware-back handling works.

import { DisclaimerBanner } from '../../../components/Disclaimer';
import { warm, font } from '../../../theme/tokens';
import { TopicHero, TopicScreenShell } from '../topic/TopicHelpers';

const KCMH_DOCS = [
  {
    id: 'hypoglycemia',
    title: 'Hypoglycemia',
    caption: 'Neonatal hypoglycemia flow (CU)',
    file: 'neonatal-hypoglycemia-flow-cu.pdf',
    kind: 'pdf',
  },
  {
    id: 'jaundice',
    title: 'Jaundice',
    caption: 'Neonatal jaundice flow — IPD',
    file: 'neonatal-jaundice-flow-ipd.pdf',
    kind: 'pdf',
  },
  {
    id: 'eos',
    title: 'EOS',
    caption: 'Early Onset Sepsis guideline (CU)',
    file: 'eos-flow-cu.jpg',
    kind: 'image',
  },
  {
    id: 'practical-points',
    title: 'Practical points for newborn nurture',
    caption: 'Anongnart Sirisabya, M.D.',
    file: 'practical-points-newborn-nurture-2025.pdf',
    kind: 'pdf',
  },
] as const satisfies { id: string; title: string; caption: string; file: string; kind: 'pdf' | 'image' }[];

export function KcmhScreen({
  openDocId = null,
  onOpenDoc,
  onBack,
}: {
  openDocId?: string | null;
  onOpenDoc?: (id: string | null) => void;
  onBack?: () => void;
}) {
  const openDoc = openDocId ? KCMH_DOCS.find((doc) => doc.id === openDocId) : undefined;

  if (openDoc && openDoc.kind === 'image') {
    return (
      <TopicScreenShell backLabel="KCMH" onBack={onBack ?? (() => onOpenDoc?.(null))}>
        <div style={{ flex: 1, overflow: 'auto', background: '#111' }}>
          <img
            src={`./kcmh/${openDoc.file}`}
            alt={openDoc.title}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      </TopicScreenShell>
    );
  }

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
          {KCMH_DOCS.map((doc) => {
            const cardStyle = {
              display: 'block',
              width: '100%',
              background: warm.card,
              border: `1.5px solid ${warm.line}`,
              borderRadius: 12,
              padding: '12px 14px',
              textDecoration: 'none',
              textAlign: 'left' as const,
              font: 'inherit',
              cursor: 'pointer',
            };
            const body = (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: warm.ink, fontFamily: font.ui }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2 }}>{doc.caption}</div>
              </>
            );
            return doc.kind === 'image' ? (
              <button key={doc.id} type="button" onClick={() => onOpenDoc?.(doc.id)} style={cardStyle}>
                {body}
              </button>
            ) : (
              <a key={doc.id} href={`./kcmh/${doc.file}`} target="_blank" rel="noopener" style={cardStyle}>
                {body}
              </a>
            );
          })}
        </div>
      </div>
    </TopicScreenShell>
  );
}
