Tested against JSketcher `5dd402b5d291ab035176293935ede8cafd6a5b4f`.

Run with the repository's pinned dependencies and Node:

```
webpack --config test/mechanical/webpack.storage-stage-write.config.cjs
node /tmp/codi-storage-stage-write-tests/tests.cjs
```

Six tests passed on the actual `storageBundle.ts`, compiled for Node with a
minimal `window` stub. They cover prior-value restoration, absent keys,
identical and different later writes, remove/recreate, once-only receipts,
distinct-key rollback, independent volatile stores and nonvolatile refusal.
This does not establish browser lifetime, physical durability, cross-process
coordination, or project-service replacement behavior.
