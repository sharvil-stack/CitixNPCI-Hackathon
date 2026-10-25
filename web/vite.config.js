import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Port 5173 is the origin the FastAPI backend allows in its CORS settings (backend/main.py).
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } })
