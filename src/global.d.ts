// 1. Create a global namespace "JSX"
// 2. Provide minimal definitions so TS doesn't expect React's types.
declare global {
  namespace JSX {
    // If you use <div> or other intrinsic elements, define them here:
    interface IntrinsicElements {
      sequence
      parallel
      oneOf
      routing
      bestOfAll
      optimize
      forEach
    }

    // If you use <MyComponent>, TS will look up MyComponent's props type
    // from the value of "typeof MyComponent". So you typically won't need
    // extra definitions for those unless you're doing advanced stuff.

    // (Optional) to handle <></> (fragments):
    interface IntrinsicAttributes {}
  }
}

// Without this export, TS may treat it as an isolated module.
export {}
