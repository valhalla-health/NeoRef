// KCMH document browser — guidelines on top, lectures below. Each card links
// out to the original document (see src/data/kcmhDocs.ts for why they're all
// PDFs, bar the online resident handbook) instead of rendering inline
// reference cards like the other topic screens.

import { DisclaimerBanner } from '../../../components/Disclaimer';
import { KCMH_DOCS, kcmhDocLinkProps, type KcmhSection } from '../../../data/kcmhDocs';
import { warm, font } from '../../../theme/tokens';
import { SectionLabel, TopicHero, TopicScreenShell } from '../topic/TopicHelpers';

const SECTIONS: { id: KcmhSection; label: string }[] = [
  { id: 'guideline', label: 'Guidelines' },
  { id: 'lecture', label: 'Lectures' },
];

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
        {SECTIONS.map((section) => (
          <section key={section.id} aria-label={section.label} style={{ marginTop: 14 }}>
            <SectionLabel>{section.label}</SectionLabel>
            <div style={{ display: 'grid', gap: 8 }}>
              {KCMH_DOCS.filter((doc) => doc.section === section.id).map((doc) => (
                <a
                  key={doc.id}
                  {...kcmhDocLinkProps(doc)}
                  style={{
                    display: 'block',
                    background: warm.card,
                    border: `1.5px solid ${warm.line}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: warm.ink, fontFamily: font.ui }}
                  >
                    {doc.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: warm.muted, marginTop: 2 }}>
                    {doc.caption}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TopicScreenShell>
  );
}
