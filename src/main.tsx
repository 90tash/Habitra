import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'
import { initializeTheme } from '@/lib/useTheme'

// Initialize theme as soon as possible
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
