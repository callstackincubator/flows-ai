import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/**/!(*test).ts'],
  format: ['cjs', 'esm'],
  target: 'node20',
  splitting: false,
  clean: true,
  dts: true,
})
