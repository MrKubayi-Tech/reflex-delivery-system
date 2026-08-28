import type { HTMLAttributes } from 'react';

/**
 * components/Card.tsx
 * Used by: all dashboard pages. Flat white panel, 1px hairline border,
 * no box-shadow/gradient — matches the mockups' flat design language.
 */
export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white border border-ink/10 ${className}`} {...rest}>
      {children}
    </div>
  );
}
