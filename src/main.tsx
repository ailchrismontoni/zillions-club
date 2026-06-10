import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { initSupabase } from './app/supabaseBootstrap'
import './index.css'

// Hydrate shared data + restore session when Supabase is configured (no-op otherwise).
void initSupabase()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
