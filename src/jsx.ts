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

/** @jsx createElement */
// ^ Tell TypeScript to use `createElement` as the factory for JSX in this file.
/**
 * Our custom JSX factory. Whenever TS sees <Tag prop="..."> in this file,
 * it will compile to `createElement(Tag, { prop: "..." }, ...)`.
 * We simply return a JSON-like object, building up your “agent flow” structure.
 */
export function createElement(type: any, props: any, ...children: any[]): any {
  const { name, input, forEach, when } = props || {}

  // Derive agent from the function name
  const agent = type?.name ? camelCase(type?.name) : undefined

  // Build the base JSON object
  const result: any = { agent }

  if (typeof name === 'string') {
    result.name = name
  }
  if (typeof forEach === 'string') {
    result.forEach = forEach
  }
  if (typeof when === 'string') {
    result.when = when
  }

  // Now handle `input`:
  // If we have an `input` prop and child elements, merge them.
  // If we have only an `input` prop (string), store that.
  // If we have only child elements, store them in `input`.
  if (input && children?.length) {
    result.input = [input, ...children]
  } else if (input) {
    result.input = input
  } else if (children?.length === 1) {
    // Single child
    result.input = children[0]
  } else if (children?.length) {
    // Multiple children
    result.input = children
  }

  return result
}
