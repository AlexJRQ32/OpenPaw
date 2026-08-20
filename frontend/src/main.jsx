import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './shared/styles/tokens.css'
import './shared/styles/global.css'
import App from './App.jsx'
import { ErrorBoundary } from './shared/components/ErrorBoundary/ErrorBoundary.jsx'
import { GOOGLE_CLIENT_ID } from './constants'

const app = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {app}
      </GoogleOAuthProvider>
    ) : app}
  </StrictMode>,
)
