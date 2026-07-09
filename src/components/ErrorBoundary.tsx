// App-level error boundary.
//
// Fixes the prototype's absence of any error boundary: a render error anywhere
// blanked the whole screen. Here a failure is contained and shown with a way to
// recover, and no raw stack trace leaks to the user.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { warm, font } from '../theme/tokens';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real deployment this is where a privacy-safe telemetry hook would go.
    // Deliberately no PHI is ever in scope here.
    console.error('NeoRef render error:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: warm.paper,
            color: warm.ink,
            fontFamily: font.ui,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40 }}>🩺</div>
          <div style={{ fontFamily: font.head, fontSize: 20, fontWeight: 800 }}>
            เกิดข้อผิดพลาดบางอย่าง
          </div>
          <div style={{ fontSize: 13, color: warm.muted, lineHeight: 1.5, maxWidth: 300 }}>
            Something went wrong while rendering this screen. Your saved progress is safe.
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: warm.terra,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
