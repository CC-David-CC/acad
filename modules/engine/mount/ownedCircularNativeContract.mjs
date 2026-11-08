// Exact experimental Native820 cohort; known identity is not functional qualification.
export const CIRCULAR_JS_SHA='f262510bd8f65fc518e6e5ea146004ad357d6d35f80bf0fd5c8eec2de984c504';
export const CIRCULAR_WASM_SHA='186b13d47f5afee372dddc4aa843275d3d3bd593a764cd85d070014fac87e382';
export const matchesCircularRuntime=(js,wasm)=>js===CIRCULAR_JS_SHA&&wasm===CIRCULAR_WASM_SHA;
