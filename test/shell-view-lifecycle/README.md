# Shell view location subscription regression

The actual ShellView attached to model.location$ without registering its detach
callback. A retained historical model therefore kept the disposed view alive
and could request renders after disposal. Registering the detach callback with
View.addDisposer releases it with the existing attribute subscription.

Build and run:

```
node node_modules/webpack/bin/webpack.js --config test/shell-view-lifecycle/webpack.config.cjs
node /tmp/codi-shell-view-lifecycle/test.cjs
```

Uses actual ShellView/View, lstream and Three scene objects with empty child
lists. DPR is fixed at1 and the Three global loader is Node-compatible; no
window/document/canvas/renderer is faked. A render callback counter observes
active versus disposed behavior over20 replacement cycles. Baseline reproduced
stale callbacks; fixed source passes. This is subscription-lifetime evidence,
not proof of GPU disposal, child face/edge rendering or complete window cleanup.
