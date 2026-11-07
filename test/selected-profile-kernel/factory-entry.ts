// Private test entry; not included by the ordinary application build.
import {createCatalogMount} from 'engine/mount/catalogMount';
import {validateEngineMount,CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD} from 'engine/mount/engineCatalog.mjs';
(globalThis as any).__profileFactoryControl={createCatalogMount,validateEngineMount,CAD_ENGINES,OCC_SELECTED_PROFILE_BUILD};
