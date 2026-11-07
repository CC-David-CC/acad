# Planar profile edge corpus — twelve scoped checks pass

Actual ordinary app/public Craft APIs on CAD
`a0b363bce15e8533be17c9332b46a7e51ddeea5d`, runtime
`/mnt/data10tb/codi-cad-selected-profile-public-20261106-r4`, private strict-CSP
fixture `http://127.0.0.1:20682/`. Normal app SHA256:
`8ae3ddc83e706829761c66ddc573fae42f9d746171ee09c1ee3b0f0744d98965`.
No product edits, native/source seeds, private wizard, fake successful reply,
invented region identity, UI development or deployment occurred.

`browser.cjs` authors ordinary primitives with returned IDs/current revisions.
Discovery/refusal snapshots compare exact source bytes, source versions,
namespace revisions, history, published models/metrics and stream revisions.
The native control uses genuine Workers and the explicit selected-profile OCC
build. `check-receipt.py` independently checks measured annulus/disk volumes,
bounds, validity, runtime identity, source preservation and three feature intents.

## Pass/fail matrix

Here PASS means truthful behavior within the current advertised scope and
preservation on refusal. It does **not** mean a refused profile is supported,
nor that the full CAD1 profile competency is finished.

| Case | Geometry/authoring | Topology/discovery | Feature attempt | Scoped check |
|---|---|---|---|---|
| Tiny real0.00001mm gap | All four valid segments accepted | `OPEN_OR_AMBIGUOUS_PROFILE`; no endpoint welding | No public region ID; not fabricated | PASS |
| Skew four-line loop | Valid closed parallelogram accepted | `UNSUPPORTED_PROFILE`, exact axis-aligned rectangle-only scope | No public region ID | PASS refusal; broader polygon support open |
| Duplicate Segment | All five individually valid segments accepted | `OPEN_OR_AMBIGUOUS_PROFILE` | Earlier genuine region ID refuses `STALE_REGION`, prior state exact | PASS |
| Duplicate Circle | Both valid circles accepted | `UNSUPPORTED_REGION_TOPOLOGY` | Earlier genuine ID refuses `STALE_REGION`, prior exact | PASS |
| Intersecting Circles | Both valid circles accepted | `UNSUPPORTED_REGION_TOPOLOGY` | Earlier genuine ID refuses `STALE_REGION`, prior exact | PASS refusal; arrangement support open |
| Tangent Circles | Both valid circles accepted | `UNSUPPORTED_REGION_TOPOLOGY` | Earlier genuine ID refuses `STALE_REGION`, prior exact | PASS |
| Rectangles touching at a point | All eight valid segments accepted | `OPEN_OR_AMBIGUOUS_PROFILE` | Earlier genuine ID refuses `STALE_REGION`, prior exact | PASS |
| Three nested circles | All three accepted | Exactly three supported regions | Three real valid OCC solids, independent volumes/bounds | PASS supported control |
| Bowtie/self-intersection | All four nonzero segments accepted | `UNSUPPORTED_PROFILE`, rectangle-only scope | No public region ID | PASS refusal; arrangement decomposition open |
| Zero-radius Circle | Invalid positive-radius domain; input refused | Empty source has no profile | No native attempt | PASS atomic refusal |
| Negative-radius Circle | Invalid radius; input refused | Empty source has no profile | No native attempt | PASS atomic refusal |
| Zero-length Segment | Degenerate input refused with `DOMAIN` | Empty source has no profile | No native attempt | PASS atomic refusal |

Additionally, depth0 and depth-5 requests against a genuine supported region
both refuse `UNSUPPORTED_REQUEST`, with exact prior source/history/models.
Every valid drawable entity above was authorable even when it did not yield a
supported region. All unsupported cases produced no native solid and dispatched
no native extrusion. There were no unexpected failures in this run.

## Five separate questions

1. **Representability:** positive circles and finite nonzero segments were
   accepted, including duplicates/crossings. Zero/negative Circle and zero
   Segment refusal is a geometry-domain result, not a solver contradiction.
2. **Constraint satisfiability:** no authored geometric constraints were added.
   Genuine source reconstruction ran, but this corpus makes no claim about
   rank, redundancy, contradictions, convergence or mathematical infeasibility.
3. **Regions:** a real gap remains open; duplicate/contact/crossing cases remain
   explicit unsupported/ambiguous topology. Two intersecting radius10 circles
   separated by10mm mathematically have three bounded arrangement cells; this
   implementation does not yet expose them. A skew parallelogram has area100mm²
   and is mathematically extrudable; rectangle-only refusal is a breadth limit.
4. **Solid kernel:** only the supported nested control reaches native extrusion.
   At depth5 its outer annulus, middle annulus and inner disk have respectively
   `2500*pi`, `1500*pi`, `500*pi` mm³, with outer radii30/20/10 and z0..5.
   The independent checker verifies corresponding bounds and valid single-solid
   results. A refusal before native dispatch is not evidence the kernel itself
   cannot represent that shape.
5. **Dependencies:** source/history/model preservation is tested on refusal;
   the supported control preserves source bytes and records three exact
   nine-field selected operations. Parametric edits, reference repair and
   downstream recomputation remain outside this corpus.

No invented ID was used to force an unsupported operation. Five cases first
obtained a valid region through public discovery, then changed the source via
public primitives and attempted creation using that earlier returned ID and a
current revision. Where no region was ever returned, creation is honestly
marked not attempted; a manufactured selection would bypass the public contract.

## Reproduction and evidence

Run the matching normal app in a private strict fixture. Node driver requires
loopback `JSKETCHER_TEST_URL=http://127.0.0.1:20682/`,
`CODI_TEST_CDP=http://127.0.0.1:19329/`, full `CODI_SOURCE_PIN` and four mandatory
`CODI_EXPECT_{APP,SKETCH,PROJECT,SEMANTIC}_SHA` values from `runtime-pins.json`.
Set `CODI_RECEIPT` to a new JSON path and `PUPPETEER_CORE_PATH` to locked
puppeteer-core test dependencies. Run:

```sh
node test/selected-profile-public-edge-cases/browser.cjs
python3 -B test/selected-profile-public-edge-cases/check-receipt.py RECEIPT.json
```

The driver creates/disposes its own BrowserContext per case and disconnects
from shared Chromium without terminating it. It hashes the actual normal app
and traced Worker assets. `runtime-pins.json` additionally records the supplied
source-matched build; project validation Worker availability is a build pin,
not a claim that native file reopen was exercised here. Actual project/file
reopen and account isolation have separate signed desktop receipts.

`receipt.json`, `evidence/browser.log`, `evidence/independent-check.log` and
`pins.json` bind this run. R730 portable notes/tests/evidence are retained at
`/mnt/data10tb/codi-selected-profile-public-edge-evidence-20261106` and both LAN
Git refs. The existing20682 runtime and all other fixtures remain unchanged.
General arrangement decomposition, non-rectangular profiles, explicit repair,
and the broader CAD1 matrix remain open; no support was added by this review.
