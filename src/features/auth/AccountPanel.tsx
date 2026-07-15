import { useEffect, useState } from 'react';
import { warm, font } from '../../theme/tokens';
import { useAuth } from './AuthContext';

// First letter of the first two words (or the first two chars of a
// single-word name) — the same shorthand shown on the avatar chip.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Bottom-sheet account panel: rename (round-trips through AuthContext.updateName,
 *  same as before) plus sign-out, gated behind an inline confirm step. */
export function AccountPanel({ onClose }: { onClose: () => void }) {
  const { user, logout, updateName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!user) return null;
  const displayName = user.name || user.email;

  function startEditing() {
    setDraft(displayName);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function saveName() {
    if (draft.trim() === displayName.trim()) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updateName(draft);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
  }

  function confirmLogout() {
    logout();
    onClose();
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,24,18,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: warm.paper,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '16px 20px 28px',
          fontFamily: font.ui,
          boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account panel"
            style={{ border: 'none', background: 'none', color: warm.muted, fontSize: 18, cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: warm.terra,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: font.head,
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            {initialsOf(displayName)}
          </div>

          {!editing ? (
            <button
              type="button"
              onClick={startEditing}
              aria-label="Edit your name"
              style={{
                border: 'none',
                background: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: font.head,
                fontSize: 18,
                fontWeight: 800,
                color: warm.ink,
              }}
            >
              {displayName} <span style={{ fontSize: 13 }} aria-hidden>✎</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={draft}
                  autoFocus
                  disabled={busy}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveName();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  aria-label="Your name"
                  style={{
                    width: 160,
                    fontFamily: font.head,
                    fontSize: 14,
                    fontWeight: 700,
                    color: warm.ink,
                    background: warm.card,
                    border: `1.5px solid ${warm.terra}`,
                    borderRadius: 8,
                    padding: '6px 10px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => void saveName()}
                  disabled={busy}
                  aria-label="Save name"
                  style={{
                    border: 'none',
                    background: warm.sage,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 999,
                    width: 32,
                    height: 32,
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={busy}
                  aria-label="Cancel"
                  style={{
                    border: 'none',
                    background: 'none',
                    color: warm.muted,
                    fontSize: 13,
                    fontWeight: 700,
                    width: 32,
                    height: 32,
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              {error && <div style={{ fontSize: 11, color: warm.warn, textAlign: 'center' }}>{error}</div>}
            </div>
          )}

          <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>{user.email}</div>
        </div>

        <div style={{ height: 1, background: warm.line, margin: '4px 0 16px' }} />

        {!confirmingLogout ? (
          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            style={{
              display: 'block',
              width: '100%',
              border: `1.5px solid ${warm.warn}`,
              background: 'none',
              color: warm.warn,
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 10,
              padding: '11px 14px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12.5, color: warm.ink2, textAlign: 'center' }}>Sign out of Newborn In-Hand?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmingLogout(false)}
                style={{
                  flex: 1,
                  border: `1.5px solid ${warm.line}`,
                  background: warm.card,
                  color: warm.ink2,
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  padding: '10px 0',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  border: 'none',
                  background: warm.warn,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  padding: '10px 0',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
