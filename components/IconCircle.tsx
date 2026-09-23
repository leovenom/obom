import type { LucideIcon } from 'lucide-react';

type IconVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'muted';

interface IconCircleProps {
  icon: LucideIcon;
  variant?: IconVariant;
  size?: 'md' | 'lg';
}

const variantClass: Record<IconVariant, string> = {
  primary: 'icon-circle--primary',
  secondary: 'icon-circle--secondary',
  accent: 'icon-circle--accent',
  success: 'icon-circle--success',
  danger: 'icon-circle--danger',
  muted: 'icon-circle--muted',
};

export default function IconCircle({ icon: Icon, variant = 'primary', size = 'md' }: IconCircleProps) {
  return (
    <span className={`icon-circle ${variantClass[variant]} icon-circle--${size}`}>
      <Icon strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}
