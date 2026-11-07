const p = require('puppeteer-core');

(async () => {
  const b = await p.connect({
    browserURL: process.env.CODI_TEST_CDP || 'http://127.0.0.1:19977'
  }),
        c = await b.createBrowserContext();

  try {
    const page = await c.newPage();
    await page.goto(new URL('static/',process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19974/').href);
    const result = await page.evaluate(async () => {
      const {
        createVerifiedOciMount
      } = await import('./oci-verified-mount.mjs'),
            {
        qualifyEnclosureManufacturingMesh: q
      } = await import('./enclosureManufacturingMesh.mjs');
      const m = createVerifiedOciMount({
        workerUrl: '/static/worker.js',
        jsPath: '/static/unused.js',
        wasmPath: '/static/oci.wasm'
      });
      await m.ready;

      try {
        const plan = {
          unit: 'millimeter',
          width: 100,
          length: 70,
          height: 30,
          wall: 3,
          clearance: .3,
          lidThickness: 3,
          lipDepth: 2
        },
              s = await m.createEnclosure({
          op: 'solid.enclosure.create',
          version: 1,
          plan
        }),
              mesh = await m.readEnclosureManufacturingMesh({
          op: 'solid.enclosure.manufacturing-mesh',
          version: 1,
          handle: s.body.handle,
          maxDeviationMm: .001
        });
        let tris = Array.from({
          length: mesh.triangles.length / 3
        }, (_, i) => Array.from({
          length: 3
        }, (_, j) => Array.from(mesh.vertices.slice(mesh.triangles[i * 3 + j] * 3, mesh.triangles[i * 3 + j] * 3 + 3))));

        const key = p => p.join(',');

        for (let iteration = 0; iteration < 50; iteration++) {
          const edges = new Map();

          for (let i = 0; i < tris.length; i++) {
            const t = tris[i];
            if (!t.every(p => p[0] === 0)) continue;

            for (let j = 0; j < 3; j++) {
              const a = t[j],
                    b = t[(j + 1) % 3],
                    k = [key(a), key(b)].sort().join('|');
              let e = edges.get(k);
              if (!e) edges.set(k, e = {
                a,
                b,
                owners: []
              });
              e.owners.push(i);
            }
          }

          const available = [...edges.values()].filter(e => e.owners.length === 2).sort((a, b) => Math.hypot(...b.a.map((x, i) => x - b.b[i])) - Math.hypot(...a.a.map((x, i) => x - a.b[i])));
          if (!available.length) throw Error('cannot refine');
          const e = available[0],
                middle = e.a.map((x, i) => (x + e.b[i]) / 2),
                next = [];

          for (let i = 0; i < tris.length; i++) {
            if (!e.owners.includes(i)) {
              next.push(tris[i]);
              continue;
            }

            const t = tris[i];
            let j = t.findIndex((a, k) => {
              const b = t[(k + 1) % 3];
              return key(a) === key(e.a) && key(b) === key(e.b) || key(a) === key(e.b) && key(b) === key(e.a);
            });
            if (j < 0) throw Error('edge');
            const a = t[j],
                  b = t[(j + 1) % 3],
                  c = t[(j + 2) % 3];
            next.push([a, middle, c], [middle, b, c]);
          }

          tris = next;
        }

        if (tris.length !== 128) throw Error('bad count');
        const data = Float64Array.from(tris.flat(2)),
              durations = [];

        for (let i = 0; i < 25; i++) {
          const t = performance.now();
          q(data.buffer, 128, plan, 'BODY', 'occ', .001);
          durations.push(performance.now() - t);
        }

        durations.sort((a, b) => a - b);
        return {
          triangles: tris.length,
          iterations: durations.length,
          medianMs: durations[12],
          p95Ms: durations[23],
          maxMs: durations[24],
          durations
        };
      } finally {
        m.close();
      }
    });
    console.log(JSON.stringify(result));
  } finally {
    await c.close();
    b.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
