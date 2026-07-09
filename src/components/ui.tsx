// Shared UI primitives.
//
// Fixes AUDIT A-3: in the prototype these lived inside eos.jsx and were reused
// across calculators via the global `window`. Here they are a proper module.

import type { CSSProperties, ReactNode } from 'react';
import { warm, font, chipTone, type ChipTone } from '../theme/tokens';

export function Chip({
  children,
  tone = 'terra',
  size = 11,
}: {
  children: ReactNode;
  tone?: ChipTone;
  size?: number;
}) {
  const map = chipTone[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: map.bg,
        color: map.fg,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: 0.1,
        fontFamily: font.ui,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: warm.ink2 }}>{label}</span>
        {value && <span style={{ fontFamily: font.head, fontSize: 16, fontWeight: 700 }}>{value}</span>}
      </div>
      {children}
    </div>
  );
}

function pillStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    background: active ? warm.ink : warm.card,
    color: active ? warm.paper : warm.ink2,
    border: `1px solid ${active ? warm.ink : warm.line}`,
    fontFamily: font.mono,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

/** Accessible pill/segmented button. */
export function PillButton({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{ ...pillStyle(active), ...style }}
    >
      {children}
    </button>
  );
}
