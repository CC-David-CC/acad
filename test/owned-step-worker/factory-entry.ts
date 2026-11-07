// Test-only ordinary webpack entry, with the production catalog/factory.
import * as factory from 'engine/mount/catalogMount';
import * as catalog from 'engine/mount/engineCatalog.mjs';
(globalThis as any).__stepFactory={...factory,...catalog};
