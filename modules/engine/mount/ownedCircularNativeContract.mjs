// Exact experimental Native820 cohort; known identity is not functional qualification.
export const CIRCULAR_JS_SHA='9789a61709dc680cce64dfa29030a3862ee636319594bdc839c0ed92e9d3571b';
export const CIRCULAR_WASM_SHA='707facb3d09aa4f84d7e0d2690141ceaf90315d2f69d110f9f763f52dc192649';
export const matchesCircularRuntime=(js,wasm)=>js===CIRCULAR_JS_SHA&&wasm===CIRCULAR_WASM_SHA;
