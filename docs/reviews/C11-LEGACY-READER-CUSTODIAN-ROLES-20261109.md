# Artifact checker and executing custodian are separate source roles

Before section/detail FIRST, source inspection found that the newly self-bound
custodian could only run when it existed inside the checker's frozen commit.
The actual82866bf artifact checker predates this custodian, so that requirement
would prevent an honest FIRST without changing the reader's provenance.

The CLI now takes one additional final argument: FULL_FROZEN_WRAPPER_COMMIT.
The actual executing wrapper derives its own worktree root from __file__ and
binds that exact path/HEAD/Git blob/bytes before and after child execution. The
reader root/commit remain separate, exact and unchanged; FIRST still requires
its original acceptanceSource. Every reader Python leaf and original source
snapshot remain Git-bound before/after. AFTER additionally retains original
failed FIRST before/after. All whole inputs remain immutable. There is no new
artifact criterion, normalization, source rewrite or anticipated result.

The previous four-bore AFTER61c8dfc custody remains historical and unchanged.
This change does not rerun, replace or relabel its artifacts. Both roles must
be frozen and explicitly recorded for future executions, including FIRST.
