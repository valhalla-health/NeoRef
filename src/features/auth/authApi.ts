// POST wrapper for the auth GAS actions. Always Content-Type: text/plain —
// GAS has no doOptions, so a preflight-triggering header (application/json)
// would fail; text/plain keeps requests as CORS "simple requests" (same
// trick as NeoFeed V2's GAS backend).

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

export interface LoginOkResponse {
  status: 'ok';
  token: string;
  email: string;
  role: string;
  name: string;
  hasPassword: boolean;
}
export interface ErrorResponse {
  error: string;
}
export type LoginResponse = LoginOkResponse | ErrorResponse;

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export function loginWithGoogle(googleToken: string): Promise<LoginResponse> {
  return post<LoginResponse>({ action: 'login', googleToken });
}

export function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>({ action: 'login', email, password });
}

export function logout(token: string): Promise<{ ok: true } | ErrorResponse> {
  return post({ action: 'logout', token });
}

export function changePassword(
  token: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: true } | ErrorResponse> {
  return post({ action: 'changePassword', token, oldPassword, newPassword });
}

export interface UpdateNameOkResponse {
  ok: true;
  name: string;
}

export function updateName(token: string, name: string): Promise<UpdateNameOkResponse | ErrorResponse> {
  return post({ action: 'updateName', token, name });
}
