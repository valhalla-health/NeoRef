// Educational-use disclaimer.
//
// Central to the product decision: NeoRef is repositioned as an educational /
// reference tool. This banner makes that unambiguous wherever a screen could be
// mistaken for a clinical decision aid.

import { warm, font } from '../theme/tokens';

export function DisclaimerBanner({
  compact = false,
  muted = false,
}: {
  compact?: boolean;
  /** Low-emphasis styling for placements (e.g. a home screen footer) where the
   *  warning should still be readable but shouldn't compete with page content. */
  muted?: boolean;
}) {
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: muted ? warm.paperDeep : '#F0CFC5',
        border: `1px solid ${muted ? warm.line : warm.warn}`,
        borderRadius: 10,
        padding: compact ? '7px 10px' : '10px 12px',
        margin: compact ? '0 0 10px' : '10px 0',
      }}
    >
      <span style={{ fontSize: compact ? 13 : 15, lineHeight: 1, opacity: muted ? 0.6 : 1 }} aria-hidden>
        ⚠️
      </span>
      <span
        style={{
          fontSize: compact ? 10.5 : 11.5,
          lineHeight: 1.4,
          color: muted ? warm.muted : warm.warn,
          fontFamily: font.ui,
          fontWeight: muted ? 500 : 600,
        }}
      >
        Educational reference only — not a clinical decision aid. Verify every value against your
        institution&apos;s protocols and the official published tools before any patient care.
      </span>
    </div>
  );
}
