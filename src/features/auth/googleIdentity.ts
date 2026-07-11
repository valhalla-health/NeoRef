// Thin wrapper around Google Identity Services, loaded via a <script> tag in
// index.html (see its CSP for the allowed script-src/frame-src origins).

export interface GoogleCredentialResponse {
  credential: string;
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

// Renders the Google Sign-In button into `buttonEl` once the GIS script has
// loaded (it's tagged async/defer in index.html, so it may not be ready yet
// on first render). Returns a cleanup function.
export function initGoogleSignIn(buttonEl: HTMLElement, onCredential: (jwt: string) => void): () => void {
  let cancelled = false;

  function render() {
    if (cancelled) return;
    const id = window.google?.accounts?.id;
    if (!id) return;
    id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
      callback: (resp) => onCredential(resp.credential),
    });
    id.renderButton(buttonEl, {
      type: 'standard',
      shape: 'pill',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      width: 280,
    });
  }

  if (window.google?.accounts?.id) {
    render();
    return () => {
      cancelled = true;
    };
  }

  const script = document.querySelector('script[src*="gsi/client"]');
  const listener = () => render();
  script?.addEventListener('load', listener, { once: true });
  return () => {
    cancelled = true;
    script?.removeEventListener('load', listener);
  };
}

export function disableGoogleAutoSelect(): void {
  window.google?.accounts?.id?.disableAutoSelect();
}
