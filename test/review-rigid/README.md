# Independent rigid-group review

Reviewed exact candidate `8645e7777`. The existing three planner tests and seven real-solver/native preflight controls pass locally. The new control `rigid-save-bounds.test.mjs` has one expected failure against that candidate: a 100 mm-wide group accepts absolute pose `(999950,0,0)`, then strict sketch serialization throws `Invalid or shared endpoint`. The transform is within the operation's ±1e6 limit but its transformed endpoint is outside the native record's limit. The second control verifies that creation with an overlarge local span refuses without changing the sketch. This is a confirmed atomic publication/persistence defect in the candidate, not a finding about whole-entity fixing or a general solver claim.

Reproduce with Node 24 and the repository's webpack dependencies:

```
node node_modules/webpack/bin/webpack.js --config test/review-rigid/webpack.config.cjs
node /tmp/codi-rigid-independent-review/test.cjs
```

The accepted-pose assertion must pass after a candidate fix, either by refusing the pose with exact prior state retained or by accepting only a sketch that passes native strict serialization and project preflight. Further browser, rotated-boundary, history and lifecycle controls remain part of the fix qualification.
