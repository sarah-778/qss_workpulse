import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/qss_workpulse/',
  plugins: [react()],
});