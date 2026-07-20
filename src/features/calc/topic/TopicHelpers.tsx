// Shared layout primitives for static reference-card topics.
//
// Ported from the prototype's topic-helpers.jsx. Fixes AUDIT C-4: the
// prototype's `TopicNav` was fake chrome (non-functional back arrow, static
// star/share icons) rendered alongside a fake iOS status bar / home
// indicator (`WStatusInk`, drawn per-screen in warm.jsx). Both are dropped
// here — `TopicNav` now takes a real `onBack` handler, and there is no
// fake status bar/home-indicator (the real app shell already provides
// navigation chrome via BottomNav).

import type { CSSProperties, ReactNode } from 'react';
import { warm, font } from '../../../theme/tokens';

export type ChipTone = 'terra' | 'ochre' | 'ink' | 'sage' | 'warn';

const chipToneMap: Record<ChipTone, { bg: string; fg: string }> = {
  terra: { bg: '#F4DDD0', fg: warm.terraDeep },
  ochre: { bg: '#EFE0BC', fg: warm.ochre },
  ink: { bg: '#E4D5BC', fg: warm.ink2 },
  sage: { bg: '#DEE4D5', fg: warm.sage },
  warn: { bg: '#F0CFC5', fg: warm.warn },
};

function TopicHeroChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  const map = chipToneMap[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: map.bg,
        color: map.fg,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 11,
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

export function TopicHero({
  chips = [],
  title,
  accent,
  subtitle,
}: {
  chips?: { tone: ChipTone; label: string }[];
  title: ReactNode;
  accent?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div style={{ padding: '6px 22px 14px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {chips.map((c, i) => (
          <TopicHeroChip key={i} tone={c.tone}>
            {c.label}
          </TopicHeroChip>
        ))}
      </div>
      <div
        style={{
          fontFamily: font.head,
          fontSize: 26,
          lineHeight: 1.05,
          fontWeight: 800,
          letterSpacing: -0.5,
          color: warm.ink,
        }}
      >
        {title}
        {accent && (
          <>
            <br />
            <span style={{ color: warm.terra }}>{accent}</span>
          </>
        )}
      </div>
      {subtitle && <div style={{ fontSize: 12, color: warm.muted, marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

export function TopicNav({ label = 'เครื่องมือ', onBack }: { label?: string; onBack?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 18px 8px',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          border: 'none',
          background: 'none',
          color: warm.terra,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ‹ {label}
      </button>
    </div>
  );
}

export function TabStrip<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { k: K; l: string }[];
  active: K;
  onChange: (k: K) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        padding: '0 18px',
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        borderBottom: `1px solid ${warm.line}`,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.k}
          type="button"
          role="tab"
          aria-selected={active === t.k}
          onClick={() => onChange(t.k)}
          style={{
            padding: '10px 0',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: 'none',
            border: 'none',
            borderBottom: active === t.k ? `2px solid ${warm.terra}` : '2px solid transparent',
            color: active === t.k ? warm.ink : warm.muted,
            fontFamily: font.ui,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {t.l}
        </button>
      ))}
    </div>
  );
}

export function SectionLabel({ children, mb = 8 }: { children: ReactNode; mb?: number }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: warm.muted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: mb,
      }}
    >
      {children}
    </div>
  );
}

export function InfoCard({
  title,
  body,
  accent,
  tone = 'card',
}: {
  title: ReactNode;
  body: ReactNode;
  accent?: ReactNode;
  tone?: 'card' | 'highlight' | 'sage';
}) {
  const bg = tone === 'card' ? warm.card : tone === 'highlight' ? '#FBEFE3' : '#EEEDD8';
  const border =
    tone === 'card' ? warm.line : tone === 'highlight' ? `${warm.ochre}55` : `${warm.sage}55`;
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: warm.ink, lineHeight: 1.25 }}>
          {title}
        </span>
        {accent && (
          <span
            style={{
              fontFamily: font.head,
              fontSize: 17,
              fontWeight: 800,
              color: warm.terra,
              letterSpacing: -0.3,
            }}
          >
            {accent}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: warm.ink2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export function AlgoStep({
  n,
  title,
  body,
  highlight,
}: {
  n: ReactNode;
  title: ReactNode;
  body: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: highlight ? '#FBEFE3' : 'transparent',
        border: highlight ? `1px solid ${warm.ochre}` : 'none',
        borderRadius: highlight ? 12 : 0,
        padding: highlight ? '10px 12px' : '6px 0',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          flexShrink: 0,
          background: highlight ? warm.terra : warm.paperDeep,
          color: highlight ? '#FFF8EA' : warm.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font.head,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: warm.ink }}>{title}</div>
        <div style={{ fontSize: 12, color: warm.ink2, lineHeight: 1.45, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}

export function Pearl({
  children,
  tone = 'sage',
}: {
  children: ReactNode;
  tone?: 'sage' | 'warn' | 'terra';
}) {
  const c = tone === 'sage' ? warm.sage : tone === 'warn' ? warm.warn : warm.terra;
  const bg = tone === 'sage' ? '#EEEDD8' : tone === 'warn' ? '#F0CFC5' : '#FBEFE3';
  return (
    <div
      style={{
        background: bg,
        borderLeft: `3px solid ${c}`,
        padding: '10px 12px',
        borderRadius: '0 10px 10px 0',
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {tone === 'warn' ? '⚠ caution' : '◆ pearl'}
      </div>
      <div style={{ fontSize: 12, color: warm.ink2, lineHeight: 1.45 }}>{children}</div>
    </div>
  );
}

export interface CriteriaRow {
  l: ReactNode;
  v: ReactNode;
  t?: ReactNode;
}

export function Criteria({ rows }: { rows: CriteriaRow[] }) {
  return (
    <div
      style={{
        background: '#FBEFE3',
        border: `1px solid ${warm.ochre}55`,
        borderRadius: 10,
        padding: '10px 12px',
        display: 'grid',
        gap: 8,
      }}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'baseline',
            paddingBottom: i < rows.length - 1 ? 8 : 0,
            borderBottom: i < rows.length - 1 ? `1px dashed ${warm.ochre}66` : 'none',
          }}
        >
          <span style={{ fontSize: 12, color: warm.ink2, flex: 1, fontWeight: 500 }}>{r.l}</span>
          <span
            style={{
              fontFamily: font.head,
              fontSize: 15,
              fontWeight: 800,
              color: warm.terraDeep,
              letterSpacing: -0.2,
              whiteSpace: 'nowrap',
            }}
          >
            {r.v}
          </span>
          {r.t && (
            <span
              style={{
                fontSize: 10,
                color: warm.muted,
                fontFamily: font.mono,
                minWidth: 70,
                textAlign: 'right',
              }}
            >
              {r.t}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function DrugCard({
  name,
  dose,
  route,
  mech,
  caution,
}: {
  name: ReactNode;
  dose: ReactNode;
  route?: ReactNode;
  mech?: ReactNode;
  caution?: ReactNode;
}) {
  return (
    <div
      style={{
        background: warm.card,
        border: `1px solid ${warm.line}`,
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: font.head,
            fontSize: 15,
            fontWeight: 800,
            color: warm.ink,
            letterSpacing: -0.3,
          }}
        >
          {name}
        </span>
        {route && (
          <span
            style={{
              fontSize: 10,
              fontFamily: font.mono,
              color: warm.muted,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {route}
          </span>
        )}
      </div>
      <div
        style={{
          background: warm.paperDeep,
          padding: '6px 8px',
          borderRadius: 6,
          fontFamily: font.mono,
          fontSize: 11.5,
          color: warm.ink,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {dose}
      </div>
      {mech && (
        <div style={{ fontSize: 11, color: warm.ink2, lineHeight: 1.4, marginBottom: caution ? 4 : 0 }}>
          {mech}
        </div>
      )}
      {caution && (
        <div style={{ fontSize: 11, color: warm.terraDeep, lineHeight: 1.4 }}>⚠ {caution}</div>
      )}
    </div>
  );
}

/** Shared full-screen shell for a static topic: nav + hero + tabs + scrollable body. */
export function TopicScreenShell({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    background: warm.paper,
    color: warm.ink,
    fontFamily: font.ui,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
  return (
    <div style={style}>
      {onBack && <TopicNav onBack={onBack} />}
      {children}
    </div>
  );
}
