// Private compiled factory entry; never emitted by the ordinary app entry.
import {createCatalogMount} from 'engine/mount/catalogMount';
import * as catalog from 'engine/mount/engineCatalog.mjs';
import revolveAssets from 'codi-revolve-profile-assets';
(globalThis as any).__revolveFactory={createCatalogMount,revolveAssets,...catalog};
