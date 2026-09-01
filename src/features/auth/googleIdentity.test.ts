import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initGoogleSignIn } from './googleIdentity';

function stubGis() {
  const initialize = vi.fn();
  const renderButton = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton, disableAutoSelect: vi.fn() } } };
  return { initialize, renderButton };
}

function addGisScript(): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  document.body.appendChild(script);
  return script;
}

beforeEach(() => {
  document.body.innerHTML = '';
  delete window.google;
});
afterEach(() => vi.useRealTimers());

describe('initGoogleSignIn', () => {
  it('renders the button immediately when GIS is already loaded', () => {
    const { initialize, renderButton } = stubGis();
    const el = document.createElement('div');
    const onUnavailable = vi.fn();

    initGoogleSignIn(el, vi.fn(), onUnavailable);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(renderButton).toHaveBeenCalledWith(el, expect.objectContaining({ type: 'standard' }));
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('clamps the button width to the container so it cannot overflow a narrow phone', () => {
    const { renderButton } = stubGis();
    const el = document.createElement('div');
    // 320px viewport minus LoginScreen's 28px side padding.
    vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(264);

    initGoogleSignIn(el, vi.fn());

    expect(renderButton).toHaveBeenCalledWith(el, expect.objectContaining({ width: 264 }));
  });

  it('never goes below the width GIS accepts, however narrow the container', () => {
    const { renderButton } = stubGis();
    const el = document.createElement('div');
    vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(120);

    initGoogleSignIn(el, vi.fn());

    expect(renderButton).toHaveBeenCalledWith(el, expect.objectContaining({ width: 200 }));
  });

  it('ignores a callback that carries no credential instead of forwarding undefined', () => {
    const { initialize } = stubGis();
    const onCredential = vi.fn();

    initGoogleSignIn(document.createElement('div'), onCredential);
    const { callback } = initialize.mock.calls[0][0];

    callback({});
    expect(onCredential).not.toHaveBeenCalled();

    callback({ credential: 'jwt-1' });
    expect(onCredential).toHaveBeenCalledWith('jwt-1');
  });

  it('renders once the pending GIS script finishes loading', () => {
    const script = addGisScript();
    const el = document.createElement('div');
    const onUnavailable = vi.fn();

    initGoogleSignIn(el, vi.fn(), onUnavailable);
    const { renderButton } = stubGis();
    script.dispatchEvent(new Event('load'));

    expect(renderButton).toHaveBeenCalled();
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('reports unavailable when the GIS script fails to load (offline / blocked)', () => {
    const script = addGisScript();
    const onUnavailable = vi.fn();

    initGoogleSignIn(document.createElement('div'), vi.fn(), onUnavailable);
    script.dispatchEvent(new Event('error'));

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when the script loads but never populates window.google', () => {
    const script = addGisScript();
    const onUnavailable = vi.fn();

    initGoogleSignIn(document.createElement('div'), vi.fn(), onUnavailable);
    script.dispatchEvent(new Event('load'));

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when the script never arrives at all (slow connection)', () => {
    vi.useFakeTimers();
    addGisScript();
    const onUnavailable = vi.fn();

    initGoogleSignIn(document.createElement('div'), vi.fn(), onUnavailable);
    expect(onUnavailable).not.toHaveBeenCalled();

    vi.advanceTimersByTime(8000);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when the script tag is missing entirely', () => {
    const onUnavailable = vi.fn();
    initGoogleSignIn(document.createElement('div'), vi.fn(), onUnavailable);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it('stays quiet after cleanup — no late unavailable callback on an unmounted screen', () => {
    vi.useFakeTimers();
    addGisScript();
    const onUnavailable = vi.fn();

    const cleanup = initGoogleSignIn(document.createElement('div'), vi.fn(), onUnavailable);
    cleanup();
    vi.advanceTimersByTime(8000);

    expect(onUnavailable).not.toHaveBeenCalled();
  });
});
