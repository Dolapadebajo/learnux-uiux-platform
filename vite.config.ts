import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' lets the built app run from any static folder (HashRouter is used for the same reason).
export default defineConfig({ plugins: [react()], base: './' });
