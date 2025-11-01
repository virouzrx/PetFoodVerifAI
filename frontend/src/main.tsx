import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './state/auth/AuthContext.tsx'
import { UiProvider } from './state/ui/UiContext.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Use environment variable or a placeholder that won't work but allows the hook to initialize
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <UiProvider>
          <App />
        </UiProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
