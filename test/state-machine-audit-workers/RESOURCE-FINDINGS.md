# Resource-owner fault-contract findings and fixes

Audited source starts at CAD `794aab6ef`. Product fix is `3c969bf68`, changing
only `web/app/cad/craft/evaluationResources.mjs`. Public phases, handle ownership,
native budgets, allocation limits, and synchronous close semantics remain.

These are controlled injected cleanup/admission failures in the actual pool
implementation. No native kernel cleanup failure or public incident was observed.

1. `cleanupFailure = cleanupFailure || error` treated thrown `null`, `undefined`,
   `0`, `false`, and `''` as no sticky failure. For `null`, usage even reported
   `cleanupFailed:false`; for the other values usage reported true while
   `requireCleanup()` still admitted further native factories/owners. The fix
   captures the first thrown value in a stable truthy `{cause:error}` record,
   preserving the original value and preventing any later cleanup failure
   from replacing it.
2. Failed factory admission read `value.close` again outside the cleanup try.
   A throwing accessor escaped before reservation deletion. After owner.close,
   the pool could report `owners:0,mounts:1`, with no owner able to release the
   orphan reservation. The fix includes cleanup property access inside try and
   reservation release in finally. Normal mount-release bookkeeping also uses
   finally. Unknown cleanup failure becomes sticky instead of silently reusing
   potentially unclosed native capacity.

The new normative tests fail six cases on the original source (five falsey
throws and one accessor), with the ordinary Error control passing. All15 prior
pool tests pass before the fix. The unchanged new regressions and all retained
tests pass together after the actual fix:22/22. `resource-baseline.json` pins
the original source and exact new tests; before/after logs are preserved.

The early `resource-pool-proposal.patch` and candidate logs describe a test-only
temporary proposal before root authorized the production edit. The final fix
adds explicit finally clauses and its proof is `resource-after.log`, rather
than relabeling that earlier temporary-module run.

Reproduce with Node24:

```sh
node --test test/state-machine-audit-workers/resource-regressions.test.mjs \
  test/coreTests/evaluation-resources.test.mjs
```

Worker/controller concurrency and broader lifecycle audit findings are kept
separate. This file is lane evidence; root owns the one canonical maintained
state-machine document.
