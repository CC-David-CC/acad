// Independent existing writer topology control; not an app export feature.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { writeCore3mf } from '../../web/app/cad/export/core3mf.mjs';
import { qualifyEnclosureManufacturingMesh as qualify } from '../../modules/engine/mount/enclosureManufacturingMesh.mjs';
const fixture = JSON.parse(readFileSync(new URL('./actual-preview-fixture.json', import.meta.url), 'utf8'));

for (const engine of ['occ', 'manifold']) test(engine + ' checked pair passes existing 3MF core validation and ZIP roundtrip', async () => {
  const f = fixture[engine],
        objects = ['body', 'lid'].map(id => {
    const x = f[id],
          q = qualify(Float64Array.from(x.triangles).buffer, x.triangles.length / 9, f.plan, x.role, engine, .001);
    return {
      id,
      name: id,
      vertices: Array.from({
        length: q.vertices.length / 3
      }, (_, i) => Array.from(q.vertices.slice(i * 3, i * 3 + 3))),
      triangles: Array.from({
        length: q.triangles.length / 3
      }, (_, i) => Array.from(q.triangles.slice(i * 3, i * 3 + 3)))
    };
  });
  const bytes = await writeCore3mf({
    unit: 'millimeter',
    revision: 'fixture',
    materials: [],
    objects,
    builds: objects.map(o => ({
      id: 'build-' + o.id,
      name: o.name,
      objects: [o.id]
    }))
  });
  const zip = await JSZip.loadAsync(bytes),
        xml = await zip.file('3D/3dmodel.model').async('string');
  assert.equal((xml.match(/<triangle /g) || []).length, 56);
  assert.equal((xml.match(/<item /g) || []).length, 2);
  assert.match(xml, /unit="millimeter"/);
});
