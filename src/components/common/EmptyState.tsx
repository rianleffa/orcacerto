import React from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Seu primeiro orçamento começa aqui 🚀',
  description = 'Crie um orçamento profissional em poucos minutos e envie para seu cliente.',
  actionText = 'Criar meu primeiro orçamento',
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100 dark:border-brand-900/50 shadow-subtle">
        {icon || <FilePlus2 className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white max-w-sm">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {actionText && onAction && (
          <Button onClick={onAction} variant="primary">
            {actionText}
          </Button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline">
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};
