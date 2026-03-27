import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	base: '/mcts-web/',
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: './src/test/setup.ts',
		css: true,
		exclude: ['e2e/**', 'test-results/**', '**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**'],
	},
})
