/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' gör bygget oberoende av sökväg: fungerar både på GitHub Pages projekt-URL
// (lhuswe.github.io/relic-cal/) och senare på cal.relic.se. HashRouter gör att deep
// links och omladdningar fungerar utan 404-fallback.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    // Vitest kör de delade motormodulerna (Node/esbuild). Ingen DOM behövs.
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
