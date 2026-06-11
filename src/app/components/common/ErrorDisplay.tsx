// [КОМПОНЕНТ] Унифицированное отображение ошибок
import { AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | Error;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  type = 'error',
  onRetry,
  className = ''
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const config = {
    error: {
      icon: AlertCircle,
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      iconColor: 'text-destructive',
      textColor: 'text-destructive'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900 dark:text-blue-300'
    }
  };

  const { icon: Icon, bg, border, iconColor, textColor } = config[type];

  return (
    <div className={`p-4 rounded-xl ${bg} border ${border} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1">
          <p className={`leading-relaxed ${textColor}`}>{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 hover:bg-background transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
