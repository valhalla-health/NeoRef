import { warm, font, systemTheme } from '../../theme/tokens';
import { Chip } from '../../components/ui';
import { CALCS } from '../../data/calcs';

// Fallback for fixtures/tests that don't set `system` — keeps the card from
// throwing rather than asserting every caller supplies it.
const FALLBACK_SYSTEM = { color: warm.line, label: '' };

export function CalcHub({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div style={{ width: '100%', height: '100%', background: warm.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${warm.line}` }}>
        <div style={{ fontFamily: font.head, fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Clinical <span style={{ color: warm.terra }}>Tools</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>
          Educational reference — not for clinical decisions
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {CALCS.map((c) => {
            const disabled = !c.ported;
            const sys = systemTheme[c.system] ?? FALLBACK_SYSTEM;
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(c.id)}
                aria-label={`${c.label} — ${sys.label} — ${c.kind === 'education' ? 'interactive education' : 'static reference'}`}
                style={{
                  position: 'relative',
                  background: warm.card,
                  border: `1.5px solid ${warm.line}`,
                  borderLeft: `3px solid ${sys.color}`,
                  borderRadius: 12,
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.55 : 1,
                  fontFamily: font.ui,
                }}
              >
                <div
                  aria-hidden
                  title={c.kind === 'education' ? 'interactive education' : 'static reference'}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: `1.5px solid ${sys.color}`,
                    background: c.kind === 'education' ? sys.color : 'transparent',
                  }}
                />
                <div style={{ fontSize: 22, marginBottom: 5 }} aria-hidden>
                  {c.emoji}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: warm.ink, lineHeight: 1.2 }}>
                  {c.label}
                </div>
                {disabled && (
                  <div style={{ fontSize: 8.5, color: warm.muted, marginTop: 3, fontFamily: font.mono }}>
                    porting
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Object.entries(systemTheme) as [string, { color: string; label: string }][]).map(([key, s]) => (
            <span
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10.5,
                fontWeight: 600,
                color: warm.ink2,
                fontFamily: font.ui,
              }}
            >
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.label}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Chip tone="sage">● filled dot = interactive</Chip>
          <Chip tone="ink">○ hollow dot = static reference</Chip>
        </div>
      </div>
    </div>
  );
}
