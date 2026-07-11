import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { clearSession, getSession, setSession, type Session } from '../../lib/session';
import * as authApi from './authApi';
import { disableGoogleAutoSelect } from './googleIdentity';

type AuthStatus = 'signed-in' | 'signed-out';

interface AuthState {
  status: AuthStatus;
  user: Session | null;
}

interface AuthContextValue extends AuthState {
  /** Returns an error message on failure, or null on success. */
  loginWithGoogle: (jwt: string) => Promise<string | null>;
  /** Returns an error message on failure, or null on success. */
  loginWithPassword: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  /** Returns an error message on failure, or null on success. Persists the new
   *  name locally and — since the leaderboard's name column is server-authoritative
   *  — round-trips it through the GAS backend first, so both stay in sync. */
  updateName: (name: string) => Promise<string | null>;
  /** Called by any GAS API wrapper that gets back {error:"Unauthorized"}. */
  handleUnauthorized: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialState(): AuthState {
  const session = getSession();
  return session ? { status: 'signed-in', user: session } : { status: 'signed-out', user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const applyLoginResponse = useCallback((resp: authApi.LoginResponse): string | null => {
    if ('error' in resp) return resp.error;
    const session: Session = { email: resp.email, name: resp.name, role: resp.role, token: resp.token };
    setSession(session);
    setState({ status: 'signed-in', user: session });
    return null;
  }, []);

  const loginWithGoogle = useCallback(
    async (jwt: string) => {
      try {
        return applyLoginResponse(await authApi.loginWithGoogle(jwt));
      } catch {
        return 'ไม่สามารถเชื่อมต่อได้ — ตรวจสอบอินเทอร์เน็ต';
      }
    },
    [applyLoginResponse],
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      try {
        return applyLoginResponse(await authApi.loginWithPassword(email, password));
      } catch {
        return 'ไม่สามารถเชื่อมต่อได้ — ตรวจสอบอินเทอร์เน็ต';
      }
    },
    [applyLoginResponse],
  );

  const updateName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'กรุณาระบุชื่อ';
    const current = getSession();
    if (!current) return 'Unauthorized';
    try {
      const resp = await authApi.updateName(current.token, trimmed);
      if ('error' in resp) return resp.error;
      const session: Session = { ...current, name: resp.name };
      setSession(session);
      setState({ status: 'signed-in', user: session });
      return null;
    } catch {
      return 'ไม่สามารถเชื่อมต่อได้ — ตรวจสอบอินเทอร์เน็ต';
    }
  }, []);

  const logout = useCallback(() => {
    const token = getSession()?.token;
    clearSession();
    disableGoogleAutoSelect();
    setState({ status: 'signed-out', user: null });
    if (token) void authApi.logout(token); // fire-and-forget — local state already cleared
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setState({ status: 'signed-out', user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, loginWithGoogle, loginWithPassword, logout, updateName, handleUnauthorized }),
    [state, loginWithGoogle, loginWithPassword, logout, updateName, handleUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
