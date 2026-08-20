import { createContext, useContext, useState, useCallback } from 'react'
import { GlobalLoader } from '../components/GlobalLoader/GlobalLoader'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0)
  const isLoading = loadingCount > 0

  const showLoader = useCallback(() => setLoadingCount((c) => c + 1), [])
  const hideLoader = useCallback(() => setLoadingCount((c) => Math.max(0, c - 1)), [])

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {isLoading && <GlobalLoader />}
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) throw new Error('useLoading debe usarse dentro de LoadingProvider')
  return context
}
