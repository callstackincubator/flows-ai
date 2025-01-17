import { builtInAgents } from '../index.js'
/**
 * Convert to camelCase
 * @param str
 * @returns
 */
function camelCase(str: string) {
  if (str) {
    const temp = str.replace(/-([a-z])/g, (m) => m[1].toUpperCase())
    return temp.charAt(0).toLowerCase() + temp.slice(1)
  } else {
    return str
  }
}
// If you want to handle fragments (<>...</>):
export const Fragment = Symbol('Fragment')

/** Called by TS if the element has exactly one child. */
export function jsx(type: any, config: any): any {
  return createNode(type, config)
}

/** Called by TS if the element has multiple children. */
export function jsxs(type: any, config: any): any {
  return createNode(type, config)
}

/**
 * Export our "createNode" logic so that the dev runtime
 * can reuse it in "jsx-dev-runtime.ts" (no duplication).
 */
export function createNode(type: any, props: any): any {
  let agent = camelCase(type)
  if (builtInAgents[`${agent}Agent`]) agent = `${agent}Agent` // flow.js shortcuts kind of mapping

  const { name, input, children } = props || {}

  const node: any = { agent }
  if (name) node.name = name
  // Add remaining props to node, excluding 'children', 'name', and 'input'
  for (const key in props) {
    if (key !== 'children' && key !== 'name' && key !== 'input') {
      node[key] = props[key]
    }
  }

  // Merge "input" prop and children
  const childArray = flattenChildren(children)
  const hasStringInput = typeof input === 'string'
  const hasChildren = childArray.length > 0

  if (hasStringInput && hasChildren) {
    node.input = [input, ...childArray]
  } else if (hasStringInput) {
    node.input = input
  } else if (hasChildren) {
    node.input = childArray.length === 1 ? childArray[0] : childArray
  }

  return node
}

/**
 * Exported so the dev runtime can reuse if needed
 */
export function flattenChildren(children: any): any[] {
  if (Array.isArray(children)) {
    return children.flatMap(flattenChildren)
  }
  if (children === null || children === undefined) {
    return []
  }
  return [children]
}
