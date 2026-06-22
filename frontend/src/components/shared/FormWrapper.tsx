import React from 'react';
import { Button } from '@/components/ui';

interface FormWrapperProps {
  title?: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export default function FormWrapper({
  title,
  subtitle,
  onSubmit,
  children,
  submitLabel = 'Save',
  isSubmitting = false,
  onCancel,
}: FormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {title && (
        <div>
          <h3 className="font-heading-section text-base text-on-surface">{title}</h3>
          {subtitle && <p className="text-sm text-outline mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-5">{children}</div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button variant="secondary" size="md" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
