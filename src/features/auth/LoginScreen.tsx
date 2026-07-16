import { useEffect, useRef, useState, type FormEvent } from 'react';
import { warm, font } from '../../theme/tokens';
import { DisclaimerBanner } from '../../components/Disclaimer';
import { useAuth } from './AuthContext';
import { initGoogleSignIn } from './googleIdentity';

const inputStyle = {
  border: `1.5px solid ${warm.line}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: font.ui,
  background: warm.card,
  color: warm.ink,
} as const;

export function LoginScreen() {
  const { loginWithGoogle, loginWithPassword } = useAuth();
  const [mode, setMode] = useState<'google' | 'password'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'google' || !buttonRef.current) return;
    return initGoogleSignIn(buttonRef.current, async (jwt) => {
      setBusy(true);
      setError(null);
      const err = await loginWithGoogle(jwt);
      if (err) setError(err);
      setBusy(false);
    });
  }, [mode, loginWithGoogle]);

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await loginWithPassword(email, password);
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: warm.paper,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 28px',
        fontFamily: font.ui,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: font.head, fontSize: 26, fontWeight: 800, letterSpacing: -0.4, color: warm.ink }}>
          Newborn <span style={{ color: warm.terra }}>In-Hand</span>
        </div>
        <div style={{ fontSize: 12.5, color: warm.muted, marginTop: 4 }}>Sign in to track your progress</div>
      </div>

      <DisclaimerBanner compact />

      {error && (
        <div
          role="alert"
          style={{
            background: '#F0CFC5',
            border: `1px solid ${warm.warn}`,
            color: warm.warn,
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {busy && !error && (
        <div
          role="status"
          style={{
            background: '#DEE4D5',
            border: `1px solid ${warm.sage}`,
            color: warm.sage,
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          กำลังเข้าสู่ระบบ อาจใช้เวลาสักครู่ กรุณาอย่าปิดหรือรีเฟรชหน้านี้…
        </div>
      )}

      {mode === 'google' ? (
        <>
          <div
            ref={buttonRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: 44,
              opacity: busy ? 0.6 : 1,
              pointerEvents: busy ? 'none' : 'auto',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError(null);
            }}
            style={{
              border: 'none',
              background: 'none',
              color: warm.terra,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 16,
            }}
          >
            Use email &amp; password instead →
          </button>
        </>
      ) : (
        <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            style={{ ...inputStyle, opacity: busy ? 0.7 : 1 }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            style={{ ...inputStyle, opacity: busy ? 0.7 : 1 }}
          />
          <button
            type="submit"
            disabled={busy}
            style={{
              border: 'none',
              background: warm.terra,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 10,
              padding: '11px 14px',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('google');
              setError(null);
            }}
            disabled={busy}
            style={{
              border: 'none',
              background: 'none',
              color: warm.muted,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            ← Back to Google Sign-In
          </button>
        </form>
      )}
    </div>
  );
}
