import * as React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if ((this as any).state.hasError) {
      let errorMessage = 'Ha ocurrido un error inesperado.';
      let isFirestoreError = false;

      try {
        if ((this as any).state.error?.message) {
          const parsed = JSON.parse((this as any).state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Error de base de datos: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = (this as any).state.error?.message || errorMessage;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <div className="mb-6 rounded-full bg-red-100 p-4 text-red-600">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">¡Ups! Algo salió mal</h1>
          <p className="mb-8 max-w-md text-gray-600">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
            <Button variant="secondary" onClick={this.handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>
          {isFirestoreError && (
            <p className="mt-8 text-xs text-gray-400">
              Si el problema persiste, contacta a soporte técnico.
            </p>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}
