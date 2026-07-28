import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-font-size-sm font-font-weight-medium text-text">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`font-text text-font-size-base px-4 py-3 rounded-radius-md border bg-glass-bg backdrop-blur-sm text-text transition-all duration-fast outline-none w-full placeholder:text-text-muted focus:border-gray focus:shadow-[0_0_0_3px_rgba(128,128,128,0.15)] ${error ? 'border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'border-border'}`}
        {...props}
      />
      {error && <span className="text-font-size-xs text-error">{error}</span>}
      {helperText && !error && (
        <span className="text-font-size-xs text-text-muted">{helperText}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
