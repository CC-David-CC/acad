# Post-commit notification failure control

After both workspace and journal installation, each guarded notification is attempted even if rearming or the other notification throws. The earliest error is rethrown unchanged, including an existing `committed` marker; the failed rearm still cannot adopt foreign state. Guards can suppress delivery for a closed or superseded document.

`node test/review-save-compat/run-save-capability.cjs` passes the existing capability controls and two new failure controls. The post-rearm-failure test uses the actual volatile storage service, its delayed `storage.update` stream, the actual StateStream batch, and installed bytes/journal; it verifies one journal and one storage event plus exact original committed error. A separate injected publication-notify exception verifies the storage notification is still attempted. The tests use a synthetic host/lifetime and do not claim actual browser or native persistence qualification. `tsc --noEmit` passes.
