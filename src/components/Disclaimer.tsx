// Educational-use disclaimer.
//
// Central to the product decision: NeoRef is repositioned as an educational /
// reference tool. This banner makes that unambiguous wherever a screen could be
// mistaken for a clinical decision aid.

import { warm, font } from '../theme/tokens';

export function DisclaimerBanner({ compact = false, subtle = false }: { compact?: boolean; subtle?: boolean }) {
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: subtle ? 'transparent' : '#F0CFC5',
        border: subtle ? 'none' : `1px solid ${warm.warn}`,
        borderRadius: 10,
        padding: subtle ? '4px 2px' : compact ? '7px 10px' : '10px 12px',
        margin: subtle ? '10px 0 0' : compact ? '0 0 10px' : '10px 0',
      }}
    >
      {!subtle && (
        <span style={{ fontSize: compact ? 13 : 15, lineHeight: 1 }} aria-hidden>
          ⚠️
        </span>
      )}
      <span
        style={{
          fontSize: subtle ? 10 : compact ? 10.5 : 11.5,
          lineHeight: 1.4,
          color: subtle ? warm.muted : warm.warn,
          fontFamily: font.ui,
          fontWeight: subtle ? 400 : 600,
        }}
      >
        Educational reference only — not a clinical decision aid. Verify every value against your
        institution&apos;s protocols and the official published tools before any patient care.
      </span>
    </div>
  );
}
