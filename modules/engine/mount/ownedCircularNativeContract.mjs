// Exact experimental Native820 cohort; known identity is not functional qualification.
export const CIRCULAR_JS_SHA='9789a61709dc680cce64dfa29030a3862ee636319594bdc839c0ed92e9d3571b';
export const CIRCULAR_WASM_SHA='ad06c43be5d895c6cb41a562b53dee3f819c8b003182c5c99b65258e0b000c0d';
export const matchesCircularRuntime=(js,wasm)=>js===CIRCULAR_JS_SHA&&wasm===CIRCULAR_WASM_SHA;
