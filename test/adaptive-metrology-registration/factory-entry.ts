// Test entry only; ordinary app entry is unchanged.
import * as factory from 'engine/mount/catalogMount';
import * as catalog from 'engine/mount/engineCatalog.mjs';
import adaptiveAssets from 'codi-adaptive-metrology-assets';
import loftAssets from 'codi-loft-profile-assets';
(globalThis as any).__adaptiveFactory={...factory,...catalog,adaptiveAssets,loftAssets};
