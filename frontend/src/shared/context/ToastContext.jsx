import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { ToastContainer } from '../components/Toast/Toast'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const showToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = ++toastId
    setToasts((prev) => [...prev.slice(-4), { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const success = useCallback((message, duration) => showToast({ message, type: 'success', duration }), [showToast])
  const error = useCallback((message, duration) => showToast({ message, type: 'error', duration }), [showToast])
  const info = useCallback((message, duration) => showToast({ message, type: 'info', duration }), [showToast])
  const warning = useCallback((message, duration) => showToast({ message, type: 'warning', duration }), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
