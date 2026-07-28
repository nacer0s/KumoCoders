import { forwardRef } from 'react';

const paddingMap = {
  none: '',
  sm: 'p-space-md',
  md: 'p-space-lg',
  lg: 'p-space-xl',
  xl: 'p-space-2xl',
};

const GlassCard = forwardRef(({
  children,
  className = '',
  as: Tag = 'div',
  hover = false,
  padding = 'lg',
  ...props
}, ref) => {
  return (
    <Tag
      ref={ref}
      className={`bg-glass-bg backdrop-blur-glass border border-border rounded-radius-lg shadow-glass w-full transition-all duration-base ${hover ? 'hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-lg' : ''} ${paddingMap[padding] || paddingMap.lg} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
