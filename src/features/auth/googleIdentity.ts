// Thin wrapper around Google Identity Services, loaded via a <script> tag in
// index.html (see its CSP for the allowed script-src/frame-src origins).

export interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (resp: GoogleCredentialResponse) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

// GIS clamps renderButton's width to this range; anything outside it is
// ignored, so clamp on our side rather than letting the button silently
// fall back to a size that overflows a narrow phone.
const MIN_BUTTON_WIDTH = 200;
const MAX_BUTTON_WIDTH = 280;

// How long to wait for accounts.google.com to hand us window.google before
// declaring Sign-In unavailable. Generous enough for a slow hospital
// connection, short enough that the user isn't left staring at an empty box.
const SCRIPT_TIMEOUT_MS = 8000;

function buttonWidth(buttonEl: HTMLElement): number {
  // clientWidth is 0 before layout (and always 0 in jsdom) — fall back to the
  // max, which is what the button used unconditionally before.
  const available = buttonEl.clientWidth || MAX_BUTTON_WIDTH;
  return Math.max(MIN_BUTTON_WIDTH, Math.min(MAX_BUTTON_WIDTH, available));
}

// Renders the Google Sign-In button into `buttonEl` once the GIS script has
// loaded (it's tagged async/defer in index.html, so it may not be ready yet
// on first render). `onUnavailable` fires if the script errors outright or
// never arrives within SCRIPT_TIMEOUT_MS — offline, blocked, or a flaky
// mobile connection — so the caller can point the user at the email/password
// fallback instead of leaving an empty button slot with no explanation.
// Returns a cleanup function.
export function initGoogleSignIn(
  buttonEl: HTMLElement,
  onCredential: (jwt: string) => void,
  onUnavailable?: () => void,
): () => void {
  let cancelled = false;

  function giveUp() {
    if (cancelled) return;
    cancelled = true;
    onUnavailable?.();
  }

  function render(): boolean {
    if (cancelled) return false;
    const id = window.google?.accounts?.id;
    if (!id) return false;
    id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: (resp) => {
        // A cancelled/failed One Tap flow can call back without a credential;
        // forwarding undefined would just produce an opaque backend error.
        if (resp?.credential) onCredential(resp.credential);
      },
    });
    id.renderButton(buttonEl, {
      type: 'standard',
      shape: 'pill',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      width: buttonWidth(buttonEl),
    });
    return true;
  }

  if (render()) {
    return () => {
      cancelled = true;
    };
  }

  const script = document.querySelector('script[src*="gsi/client"]');
  if (!script) {
    giveUp();
    return () => {
      cancelled = true;
    };
  }

  // The script may already have fired `load` without populating window.google
  // (or may fire `error`), so the timeout — not the load event — is what
  // guarantees the caller always hears back one way or the other.
  const onLoad = () => {
    if (!render()) giveUp();
  };
  const onError = () => giveUp();
  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });
  const timer = setTimeout(() => {
    if (!render()) giveUp();
  }, SCRIPT_TIMEOUT_MS);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    script.removeEventListener('load', onLoad);
    script.removeEventListener('error', onError);
  };
}

export function disableGoogleAutoSelect(): void {
  window.google?.accounts?.id?.disableAutoSelect();
}
