import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
export const root=process.env.CODI_REVIEW_SOURCE;
if(!root)throw Error('Explicit exact reviewed source path required');
export const source='89bc477e57ae89cfb33dca23fecc888ad8356825';
export const pins={
 'modules/engine/mount/selectedProfileBudget.mjs':'f5a69a4ee884a5848d5cc1fec86174d3fe9badc77710654d02bae69c97897013',
 'modules/engine/mount/worker-controller.mjs':'24604b9bb29262407b6d128cdb7b1a5268f52627ace1af007843747e964eea3c',
 'modules/engine/mount/oci-verified-worker.js':'139ed494d36e25cfeaa1765bf8178a6725517d9bc311f53899a4a832560746fb',
 'build/prepare-selected-profile-assets.cjs':'c52bdba3b3451547d4ca969876b162b29a7f9d081b54a77735e7c0f3298b1e96',
 'modules/engine/mount/occ-selected-profile-mount.mjs':'33f43cd9079b572d9057ddaec4272e18a3cf828bf7fdf4780543cf7a28bbf326',
};
export const read=name=>fs.readFileSync(path.join(root,name),'utf8');
for(const[name,sha]of Object.entries(pins))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),sha,'Reviewed source drift: '+name);
export const load=name=>import(pathToFileURL(path.join(root,name)));
