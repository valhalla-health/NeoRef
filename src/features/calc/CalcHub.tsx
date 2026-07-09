import { warm, font } from '../../theme/tokens';
import { Chip } from '../../components/ui';
import { CALCS } from '../../data/calcs';

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
            return (
              <button
                key={c.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(c.id)}
                style={{
                  position: 'relative',
                  background: warm.card,
                  border: `1.5px solid ${warm.line}`,
                  borderRadius: 12,
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.55 : 1,
                  fontFamily: font.ui,
                }}
              >
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
          <Chip tone="sage">education = interactive</Chip>
          <Chip tone="ink">reference = static card</Chip>
        </div>
      </div>
    </div>
  );
}
