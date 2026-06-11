// [КОМПОНЕНТ] Переиспользуемая карточка с glassmorphism эффектом
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  variant = 'default',
  className = '',
  noPadding = false
}: GlassCardProps) {
  const variants = {
    default: {
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
    },
    primary: {
      background: 'linear-gradient(135deg, var(--glass-bg), rgba(167, 139, 250, 0.1))',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 32px rgba(107, 76, 230, 0.15)'
    },
    secondary: {
      background: 'var(--secondary)',
      border: '1px solid var(--border)',
      boxShadow: 'none'
    },
    accent: {
      background: 'var(--accent)/10',
      border: '1px solid var(--accent)/30',
      boxShadow: '0 4px 16px rgba(107, 76, 230, 0.1)'
    }
  };

  const style = variants[variant];
  const paddingClass = noPadding ? '' : 'p-8';

  return (
    <div
      className={`rounded-3xl ${paddingClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
