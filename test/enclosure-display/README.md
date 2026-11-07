# Enclosure display projection

MWorkerEnclosureBody gives checked enclosure outputs distinct authored
feature/role IDs and a bounded private display buffer, without native handles
or invented BRep faces/edges. The adapter that creates this model must separately
validate its candidate owner and kernel result. Constructing this class alone
is not evidence of native validity. Existing legacy operations reject the
worker geometry tag and ID prefix.

WorkerEnclosureView renders this buffer and releases its Three geometry,
material and stream subscriptions. viewSyncBundle recognizes it ahead of generic
MShell. No authored enclosure operation is registered by this checkpoint.

Run:
```
node node_modules/webpack/bin/webpack.js --config test/enclosure-display/webpack.config.cjs
node /tmp/codi-enclosure-display/test.cjs
```
Three controls pass: role identity across display changes and detached copies;
invalid dimensions/count/nonfinite/Float32-collapse rejection; view resource
and subscription cleanup including repeated disposal. Actual Three objects and
streams are used with no browser or canvas; no GPU/rendered-screen claim. The
tetrahedron is a display-boundary fixture, not a claimed enclosure model.
TypeScript passes. Real worker-to-model/history/browser tests remain necessary.
# Engine identity

The display constructor accepts an explicit `occ` or `manifold` engine (OCC
default). Its frozen metadata records the corresponding representation while
authored feature/role IDs remain independent of engine choice. This is display
metadata, not engine authorization: the candidate adapter must validate the
actual owning mount and mesh response. Neither representation invents editable
B-rep topology. Four focused model/view tests pass, including distinct engine
metadata and repeated disposal; no full browser or manufacturing claim follows.

