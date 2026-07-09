import { warm, font } from '../theme/tokens';

export type Tab = 'home' | 'calc' | 'learn' | 'progress';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'calc', label: 'Tools', emoji: '🧮' },
  { id: 'learn', label: 'Learn', emoji: '📚' },
  { id: 'progress', label: 'Progress', emoji: '🏆' },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60,
        display: 'flex',
        borderTop: `1px solid ${warm.line}`,
        background: warm.card,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: on ? warm.terra : warm.muted,
              fontFamily: font.ui,
            }}
          >
            <span style={{ fontSize: 20, opacity: on ? 1 : 0.7 }} aria-hidden>
              {t.emoji}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 600 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
