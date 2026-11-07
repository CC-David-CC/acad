# Surfacing save invalidation

Base `6e7e615fccc864b84d8c4cde2ec4fc39179a2d73`; source under test `a9d41e9bc5533c1c290c58999b3e180411975230`. On the original app, the actual-model gizmo test failed because a capture remained current after a control point moved and before drag-end. The test dispatches the actual TransformControls change event after changing its target; it does not simulate a physical pointer gesture.

A private R730 checkout with a private copy of dependencies and existing pinned worker assets built successfully with `CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 node ./node_modules/webpack/bin/webpack.js --config webpack.config.js`. The resulting `dist/static/index.bundle.js` SHA-256 was `6ee9f6910b30f058012bcc19527c095ffe47ddbc61d68bd48d6008c44ef684a2`. `tsc --noEmit` passed. The browser regression passed against that bundle: original and synchronously reentrant captures became stale, moved geometry appeared in the actual scene, and a no-op event did not advance revision. The existing `node --test test/manufacturing/worker-save.test.mjs` passed 3/3.

Reproduce using a loopback server for the built `dist` and a separately owned Chromium debugging port:

```
JSKETCHER_TEST_URL=http://127.0.0.1:PORT/ CODI_TEST_CDP=http://127.0.0.1:CDP/ PUPPETEER_CORE_PATH=/path/to/puppeteer-core node test/manufacturing/surfacing-save-drag.test.cjs
```

The Push/Pull drag callback uses the same before/after notification fence; this receipt does not claim a separate physical Push/Pull or undo/cancel browser test. Notifications invalidate captures; existing drag-end commit, persistence and undo behavior are not replaced. No production package or deployment was changed.

## Push/Pull follow-up

A real Chromium pointer press/move/release on the actual Push/Pull handle moved the real plane while a save capture was outstanding. The pre-drag capture became stale during the held gesture; no `editor.commit()` ran before release, and exactly one ran at release. No craft-history entry was added. A capture made mid-drag became stale on release. This checks actual mouse dispatch, not a synthetic handle callback.

Before the UI correction, entering `999` and pressing Escape applied 999 instead of discarding it: Escape called `blur()` while React still exposed the old text to the blur callback. The regression now checks Escape retains the scene and current save capture with no new commit, and Enter applies a subsequent value with exactly one commit. It also checks closing the wizard and invoking empty craft undo retains the applied scene. Surfacing has no dedicated undo history in this implementation; the empty craft undo check does not establish surfacing undo or a way to cancel an already applied drag.

The follow-up app was built in the same isolated R730 tree; `dist/static/index.bundle.js` SHA-256 `e59e07879ff5e729b7d690ebd115fb88a0fad317ab2503c7cad0cf0e0d06828f`, Webpack passed and `tsc --noEmit` passed. Both `surfacing-push-pull-browser.test.cjs` and the previous `surfacing-save-drag.test.cjs` passed with the same loopback environment above. The first combined build/typecheck shell used a temporary PATH assignment only for Webpack, so its trailing TypeScript command failed to find Node; running TypeScript with the pinned Node directory on PATH passed.
