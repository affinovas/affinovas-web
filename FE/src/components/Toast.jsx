import React, { useState, useEffect } from 'react'
import './Toast.css'

// Global toast trigger helper for non-react or deeply nested triggers
let addToastFn = null

export const toast = {
  success: (message, title = 'Success') => {
    if (addToastFn) addToastFn({ title, message, type: 'success', duration: 4000 })
  },
  error: (message, title = 'Error') => {
    if (addToastFn) addToastFn({ title, message, type: 'error', duration: 5000 })
  },
  info: (message, title = 'Notice') => {
    if (addToastFn) addToastFn({ title, message, type: 'info', duration: 4000 })
  },
  warning: (message, title = 'Warning') => {
    if (addToastFn) addToastFn({ title, message, type: 'warning', duration: 4500 })
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    addToastFn = (newToast) => {
      const id = Date.now() + Math.random()
      const toastItem = { ...newToast, id, leaving: false }
      setToasts((prev) => [...prev, toastItem])

      // Auto dismiss
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration || 4000)
    }

    return () => {
      addToastFn = null
    }
  }, [])

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type} ${t.leaving ? 'toast-leaving' : ''}`}
        >
          <div className="toast-icon-box">{getIcon(t.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-message">{t.message}</div>
          </div>
          <button
            className="toast-close-btn"
            onClick={() => dismissToast(t.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
          <div className="toast-progress">
            <div
              className="toast-progress-bar"
              style={{ animationDuration: `${(t.duration || 4000) / 1000}s` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
