// [КОМПОНЕНТ] Error Boundary для отлова ошибок рендеринга
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div
            className="max-w-md rounded-3xl p-8"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--destructive)/30',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)'
            }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className="p-3 rounded-2xl"
                style={{
                  background: 'var(--destructive)/20',
                  color: 'var(--destructive)'
                }}
              >
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="mb-2">Произошла ошибка</h2>
                <p className="opacity-80 leading-relaxed">
                  {this.state.error?.message || 'Неизвестная ошибка при рендеринге компонента'}
                </p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <div
                className="p-4 rounded-xl mb-4 overflow-auto max-h-48"
                style={{ background: 'var(--secondary)', fontSize: '12px' }}
              >
                <pre className="opacity-70">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
