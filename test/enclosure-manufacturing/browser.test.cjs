const assert = require('node:assert/strict'),
      puppeteer = require('puppeteer-core');

(async () => {
  const b = await puppeteer.connect({
    browserURL: process.env.CODI_TEST_CDP || 'http://127.0.0.1:19977'
  }),
        c = await b.createBrowserContext();

  try {
    const page = await c.newPage(),
          res = await page.goto(new URL('static/',process.env.JSKETCHER_TEST_URL || 'http://127.0.0.1:19974/').href);
    const policy = res.headers()['content-security-policy'];
    assert.match(policy, /script-src 'self' 'wasm-unsafe-eval'/);
    assert.doesNotMatch(policy, /script-src[^;]*blob:|'unsafe-eval'/);
    const results = await page.evaluate(async () => {
      const out = {};

      for (const engine of ['occ', 'manifold']) {
        const mod = await import(engine === 'occ' ? './oci-verified-mount.mjs' : './manifold-verified-mount.mjs'),
              opts = engine === 'occ' ? {
          workerUrl: '/static/worker.js',
          jsPath: '/static/unused.js',
          wasmPath: '/static/oci.wasm'
        } : {
          workerUrl: '/static/manifold-worker.js',
          jsPath: '/static/unused.js',
          wasmPath: '/static/manifold.wasm'
        },
              make = o => engine === 'occ' ? mod.createVerifiedOciMount(o) : mod.createVerifiedManifoldMount(o),
              m = make(opts),
              bad = make({ ...opts,
          workerUrl: '/static/' + engine + '-bad-manufacturing.js'
        }),
              slow = make({ ...opts,
          workerUrl: '/static/' + engine + '-slow-manufacturing.js'
        }),
              other = make(opts),
              edited = make(opts);

        await Promise.all([m.ready, bad.ready, slow.ready, other.ready, edited.ready]);

        try {
          const req = {
            unit: 'millimeter',
            width: 100,
            length: 70,
            height: 30,
            wall: 3,
            clearance: .3,
            lidThickness: 3,
            lipDepth: 2
          },
                r = await m.createEnclosure({
            op: 'solid.enclosure.create',
            version: 1,
            plan: req
          }),
                read = (h, t) => m.readEnclosureManufacturingMesh({
            op: 'solid.enclosure.manufacturing-mesh',
            version: 1,
            handle: h,
            maxDeviationMm: t
          }),
                body = await read(r.body.handle, .001),
                lid = await read(r.lid.handle, .001);

          const editedShape = await edited.createEnclosure({
            op: 'solid.enclosure.create',
            version: 1,
            plan: { ...req,
              width: 150,
              wall: 4
            }
          }),
                editedBody = await edited.readEnclosureManufacturingMesh({
            op: 'solid.enclosure.manufacturing-mesh',
            version: 1,
            handle: editedShape.body.handle,
            maxDeviationMm: .001
          }),
                editedLid = await edited.readEnclosureManufacturingMesh({
            op: 'solid.enclosure.manufacturing-mesh',
            version: 1,
            handle: editedShape.lid.handle,
            maxDeviationMm: .001
          });
          const badShape = await bad.createEnclosure({
            op: 'solid.enclosure.create',
            version: 1,
            plan: req
          }),
                slowShape = await slow.createEnclosure({
            op: 'solid.enclosure.create',
            version: 1,
            plan: req
          });
          let badResponse, aborted, foreign, badClosed, slowClosed;

          try {
            await bad.readEnclosureManufacturingMesh({
              op: 'solid.enclosure.manufacturing-mesh',
              version: 1,
              handle: badShape.body.handle,
              maxDeviationMm: .001
            });
          } catch (e) {
            badResponse = e.code;
          }

          try {
            await other.readEnclosureManufacturingMesh({
              op: 'solid.enclosure.manufacturing-mesh',
              version: 1,
              handle: r.body.handle,
              maxDeviationMm: .001
            });
          } catch (e) {
            foreign = e.code;
          }

          try {
            await bad.readEnclosureManufacturingMesh({
              op: 'solid.enclosure.manufacturing-mesh',
              version: 1,
              handle: badShape.lid.handle,
              maxDeviationMm: .001
            });
          } catch (e) {
            badClosed = e.code;
          }

          const ac = new AbortController(),
                pending = slow.readEnclosureManufacturingMesh({
            op: 'solid.enclosure.manufacturing-mesh',
            version: 1,
            handle: slowShape.body.handle,
            maxDeviationMm: .001
          }, {
            signal: ac.signal
          }).catch(e => e.code);
          setTimeout(() => ac.abort(), 20);
          aborted = await pending;

          try {
            await slow.readEnclosureManufacturingMesh({
              op: 'solid.enclosure.manufacturing-mesh',
              version: 1,
              handle: slowShape.lid.handle,
              maxDeviationMm: .001
            });
          } catch (e) {
            slowClosed = e.code;
          }

          const v = body.vertices[0];
          body.vertices[0] = NaN;
          const again = await read(r.body.handle, .001),
                stable = again.vertices[0] === v;
          let tooPrecise, changedTolerance;
          try { await read(r.body.handle, .0001); } catch (e) { changedTolerance = e.code; }

          try {
            await read(r.body.handle, 1e-12);
          } catch (e) {
            tooPrecise = e.code;
          }

          await m.dispose({
            op: 'solid.dispose',
            version: 1,
            handle: r.body.handle
          });
          let stale;

          try {
            await read(r.body.handle, .001);
          } catch (e) {
            stale = e.code;
          }

          out[engine] = {
            body: {
              role: body.role,
              quality: body.quality,
              vertexCount: body.vertices.length / 3,
              triangleCount: body.triangles.length / 3,
              evidence: body.evidence
            },
            lid: {
              role: lid.role,
              quality: lid.quality,
              vertexCount: lid.vertices.length / 3,
              triangleCount: lid.triangles.length / 3,
              evidence: lid.evidence
            },
            stable,
            tooPrecise,
            changedTolerance,
            stale,
            badResponse,
            aborted,
            foreign,
            badClosed,
            slowClosed,
            editedBody: editedBody.evidence,
            editedLid: editedLid.evidence
          };
        } finally {
          m.close();
          bad.close();
          slow.close();
          other.close();
          edited.close();
        }
      }

      return out;
    });

    for (const [engine, r] of Object.entries(results)) {
      assert.equal(r.body.role, 'BODY');
      assert.equal(r.lid.role, 'LID');

      for (const x of [r.body, r.lid]) {
        assert.equal(x.quality, 'planar-boundary-checked-v1');
        assert.equal(x.triangleCount, 28);
        assert.equal(x.evidence.surfaceCount, 11);
        assert.ok(x.evidence.observedPlaneDeviationMm <= .001);
      }

      assert.equal(r.badResponse, 'ENGINE_FAILURE');
      assert.equal(r.aborted, 'CANCELLED');
      assert.equal(r.foreign, 'INVALID_HANDLE');
      assert.equal(r.badClosed, 'MOUNT_CLOSED');
      assert.equal(r.slowClosed, 'MOUNT_CLOSED');
      assert.ok(Math.abs(r.editedBody.volume - 86096) < .01);
      assert.ok(Math.abs(r.editedLid.volume - 48863.92) < .01);
      assert.equal(r.stable, true);
      assert.equal(r.tooPrecise, 'UNSUPPORTED_PRECISION');
      assert.equal(r.changedTolerance, 'UNSUPPORTED_PRECISION');
      assert.equal(r.stale, 'INVALID_HANDLE');
    }

    console.log(JSON.stringify(results));
  } finally {
    await c.close();
    b.disconnect();
  }
})().catch(e => {
  console.error(e.stack);
  process.exitCode = 1;
});
