import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './sistema/auth.jsx'
import { BodegaTrabajoProvider } from './sistema/bodegaTrabajo.jsx'

// AuthProvider: sesión del usuario (token y datos) disponible en toda la app.
// BodegaTrabajoProvider: bodega elegida por el operador/administrador.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BodegaTrabajoProvider>
          <App />
        </BodegaTrabajoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
