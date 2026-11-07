# Readonly native asset repeat-build repair

This is our build-staging lifecycle bug, not an NVIDIA/kernel geometry defect.
It does not change native JS/WASM/Worker pins, engine preference, runtime behavior,
budgets, document schemas or any deployed artifact. The separately qualified
revolve factory/evidence checkpoint remains frozen at23756d02a.

The existing builder verified readonly native cache inputs and copied the WASM
directly over its generated target. Copying a0444 source creates a0444 destination.
A first fresh ordinary-user build succeeded; a second build failed EACCES when
copyFileSync tried to reopen that destination for writing. before.json and its
normative test failure preserve the actual first0/second1/malformed1 outcomes.
The global reviewed cache stayed unchanged. Tests run as uid1000, never root.

Product04840305d changes only build/prepare-raw-smlib-assets.cjs. Both input hashes
are still verified BEFORE any generated output is touched. After the unchanged
real webpack/Worker hash check, the builder copies only raw-provider.wasm into an
exclusive same-directory temporary, verifies its exact hash, and atomically renames
it over the generated target. The finally removes any remaining temporary. It
never changes cache contents or source modes. A64KiB scratch buffer is reused for
file hashing, avoiding another full WASM read buffer; this is not a whole-tool RSS
or webpack-memory measurement. There is no new build/publication framework.

The real fixed CLI passes first and second builds using readonly copies of the
exact reviewed source pair. Output Worker remains
bbfdfe916d879fcc1ee84f59453f6b3dd67eb08ea92c06614e505aa35b413a65;
native JS remains8e49622c97d839cf94d6c4d5e2de6cbd96d1166075741e08dcbda3b1a223d8fa;
WASM remainsf33f19cd0098b610756db70ae0d25ac1dcba315e9af9eb90e387d0668be90daa.
The malformed-WASM control then fails before output mutation, preserving every
prior output's hash, size, mode, inode and modification time. No temporary remains;
the original reviewed cache is rehashed unchanged. after-tests.log records2/2pass
(one combines the two genuine builds), with no skipped controls or fake native
outputs. No new geometry/browser qualification is inferred from this build repair.

Separate fresh source stages on R730 preserve before/after:

- /mnt/data10tb/codi-raw-smlib-repeat-build-20261107-before
- /mnt/data10tb/codi-raw-smlib-repeat-build-20261107-after

They share reviewed dependency code read-only via the earlier owned catalog
stage's node_modules. All generated outputs are private to each new source stage.
The test uses separate temporary readonly INPUT copies, and modifies only those
copies for the negative control; it never writes the reviewed native cache.
No filesystem race, permission bypass, live server or account test is performed.
Atomic rename is qualified here on the Linux R730 build host, not Windows, and
this does not add durable deployment/crash recovery guarantees to a rebuildable
asset directory.

Reproduce with qualified Node24, an ordinary uid, reviewed dependencies and a
fresh source stage whose .build/raw-smlib-worker does not yet exist:

```
node test/raw-smlib-repeat-build/run.cjs /path/to/reviewed/raw-native-cache /tmp/repeat-receipt.json
CODI_RAW_REPEAT_RECEIPT=/tmp/repeat-receipt.json node --test test/raw-smlib-repeat-build/observations.test.mjs
```

The real builder is invoked three times, preserving its existing configured
CODI_RAW_SMLIB_CACHE input contract. No workstation-specific path is added to
product source. pins.json binds source/driver/receipts and exact output identities.
