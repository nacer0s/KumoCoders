import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: 'nf-fa-check_circle',
  error: 'nf-fa-times_circle',
  info: 'nf-fa-info_circle',
  warning: 'nf-fa-exclamation_triangle',
};

const COLORS = {
  success: '#4c6',
  error: '#f66',
  info: '#6af',
  warning: '#fa4',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), 3000);
    return id;
  }, [removeToast]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 'var(--space-md)',
        right: 'var(--space-md)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'var(--color-glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-glass)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-sm)',
              minWidth: 280,
              maxWidth: 400,
              pointerEvents: 'auto',
              animation: 'toastSlideIn 0.25s ease-out',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
          >
            <span
              className={`nf ${ICONS[toast.type] || ICONS.info}`}
              style={{ color: COLORS[toast.type] || COLORS.info, fontSize: 'var(--font-size-lg)' }}
            />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-lg)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1,
              }}
              aria-label="Close toast"
            >
              <span className="nf nf-fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
