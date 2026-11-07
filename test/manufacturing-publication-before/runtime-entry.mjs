// Enter through the normal application API. Direct state/emitter entry skips
// lstream's circular dependency initialization order in this isolated bundle.
export {state,stream} from '../../modules/lstream/index.js';
