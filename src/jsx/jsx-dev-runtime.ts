import { createNode, Fragment } from './jsx-runtime.js'

// Re-export the same Fragment
export { Fragment }

/**
 * The function TypeScript expects in dev mode.
 * We'll reuse the same createNode logic from "jsx-runtime.ts".
 */
export function jsxDEV(type: any, config: any): any {
  return createNode(type, config)
}
