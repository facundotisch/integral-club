import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Integral App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: 'none',
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 18px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-main, #0f172a)',
              marginBottom: '8px'
            }}>
              Inconveniente al cargar esta vista
            </h2>

            <p style={{
              fontSize: '13.5px',
              color: 'var(--text-muted, #64748b)',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              Los datos de la planilla están sincronizándose o hubo una interrupción temporal en la red.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  background: '#2a3b60',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                Reintentar
              </button>

              <button
                onClick={() => {
                  try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('modulo');
                    window.history.pushState({}, '', url);
                    window.location.reload();
                  } catch {
                    window.location.href = '/';
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'var(--text-main, #0f172a)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Home size={15} />
                Ir al Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
