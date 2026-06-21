import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Add this line below to fix the subfolder asset routing paths on the server
    base: '/Fifa_worldcup_data/',
})
