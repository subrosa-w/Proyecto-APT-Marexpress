import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Todo lo que empiece con /api se reenvía al backend (Express en el puerto 3000).
    // Así el navegador cree que front y back son el mismo sitio y no hay problemas de CORS
    // (el backend solo acepta los puertos 5500 del front de prueba).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
