// Emit webpack references so the dynamic native-Worker module graph is closed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.join(root,'.build/mechanical-profile-assets');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'component.json'),'utf8'));
const modules=['modules/engine/mount/exactMeshVolume.mjs','modules/engine/mount/polygonProfilePlan.mjs','modules/engine/mount/selectedProfilePlan.mjs','modules/engine/mount/ownedTopologyContract.mjs','modules/engine/mount/prismSelectionIndex.mjs','modules/engine/mount/selectionAncestryIndex.mjs','modules/engine/extrusion/simplePolygon.mjs'];
const files=['modules/engine/mount/mechanical-profile-worker.js','mechanical-profile-occ-portable.js','mechanical-profile-occ.wasm',...modules];
for(const name of files){const bytes=fs.readFileSync(path.join(base,name)),v=manifest.files[name];if(!v||bytes.length!==v.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==v.sha256)throw Error('Component input changed: '+name);}
const imports=files.map((name,i)=>`import p${i} from ${JSON.stringify('./mechanical-profile-assets/'+name)};`).join('\n');
const table=Object.fromEntries(modules.map((name,i)=>[name,'p'+(i+3)]));
const source=imports+'\nexport default {worker:p0,js:p1,wasm:p2,modules:{'+Object.entries(table).map(([k,v])=>JSON.stringify(k)+':'+v).join(',')+'}};\n';
fs.writeFileSync(path.join(root,'.build/mechanical-profile-entry.mjs'),source);
