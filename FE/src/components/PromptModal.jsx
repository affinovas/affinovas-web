import React, { useState, useEffect, useRef } from 'react'
import './PromptModal.css'

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon = '⚡',
  type = 'default', // 'default' | 'danger' | 'info'
  detailLabel,
  detailValue,
  inputLabel,
  initialValue = '',
  placeholder = '',
  submitText = 'Confirm',
  cancelText = 'Cancel',
  inputType = 'text'
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef(null)

  useEffect(() => {
    setValue(initialValue)
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, initialValue])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-header">
          <div className={`prompt-icon-badge ${type}`}>{icon}</div>
          <div className="prompt-header-text">
            <h3 className="prompt-title">{title}</h3>
            {subtitle && <p className="prompt-subtitle">{subtitle}</p>}
          </div>
          <button className="prompt-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="prompt-modal-body">
            {detailLabel && detailValue && (
              <div className="prompt-detail-strip">
                <span className="prompt-detail-label">{detailLabel}</span>
                <span className="prompt-detail-value">{detailValue}</span>
              </div>
            )}

            {inputLabel && (
              <div className="prompt-field-group">
                <label className="prompt-field-label">{inputLabel}</label>
                <input
                  ref={inputRef}
                  type={inputType}
                  className="prompt-field-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  required
                />
              </div>
            )}
          </div>

          <div className="prompt-modal-footer">
            <button
              type="button"
              className="prompt-btn prompt-btn-cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className={`prompt-btn prompt-btn-submit ${type === 'danger' ? 'danger' : ''}`}
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
