import { useState, useEffect, useRef } from 'react'

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message = 'Are you sure?',
  mode = 'confirm', // 'confirm' | 'prompt'
  initialValue = '',
  placeholder = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
      // Focus input after render
      setTimeout(() => {
        if (mode === 'prompt' && inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen, initialValue, mode])

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  function handleConfirm() {
    if (mode === 'prompt') {
      onConfirm(value)
    } else {
      onConfirm()
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="glass w-[90%] max-w-[440px] bg-surface border border-border rounded-radius-lg p-space-xl shadow-lg"
      >
        <h3 className="m-0 mb-space-sm text-font-size-lg font-font-weight-semibold">
          {title}
        </h3>

        <p className="m-0 mb-space-lg text-text-muted text-font-size-sm leading-relaxed">
          {message}
        </p>

        {mode === 'prompt' && (
          <div className="mb-space-lg">
            <input
              ref={inputRef}
              type="text"
              className="admin-input w-full"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
                if (e.key === 'Escape') onCancel()
              }}
            />
          </div>
        )}

        <div className="flex gap-space-sm justify-end">
          <button
            className="admin-btn admin-btn--ghost"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`admin-btn ${destructive ? 'bg-red-500/10 text-error border border-red-500/20' : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
