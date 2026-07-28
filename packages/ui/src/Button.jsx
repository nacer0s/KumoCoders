const variantStyles = {
  primary: 'bg-text text-text-inverse border-transparent hover:opacity-85',
  ghost: 'bg-transparent text-text border-border hover:bg-surface-hover',
  danger: 'bg-transparent text-error border-error hover:bg-red-500/10',
  glass: 'bg-surface backdrop-blur-glass text-text border-border hover:bg-surface-hover',
  outline: 'bg-transparent text-text border-text hover:bg-surface',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-font-size-sm',
  md: 'px-6 py-3 text-font-size-base',
  lg: 'px-8 py-4 text-font-size-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-text font-font-weight-medium rounded-radius-md cursor-pointer transition-all duration-fast whitespace-nowrap select-none hover:-translate-y-px active:translate-y-0 active:opacity-75 disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.ghost} ${sizeStyles[size] || sizeStyles.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
