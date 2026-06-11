// [КОМПОНЕНТ] Индикатор загрузки
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  text,
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin`} style={{ color: 'var(--neon-purple)' }} />
      {text && <p className="opacity-70">{text}</p>}
    </div>
  );
}
