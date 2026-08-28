import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-forest text-cream hover:bg-forest-deep disabled:bg-forest/40',
  secondary: 'bg-transparent text-forest border border-forest/30 hover:border-forest disabled:opacity-40',
  ghost: 'bg-transparent text-ink/70 hover:text-ink disabled:opacity-40',
  danger: 'bg-rust text-cream hover:bg-rust/90 disabled:bg-rust/40',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
