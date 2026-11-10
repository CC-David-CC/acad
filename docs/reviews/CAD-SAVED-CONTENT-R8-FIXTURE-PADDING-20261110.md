# R8 acceptance source padding correction

R8 failed when a single padded RHS exceeded the real2048-character math limit.
The fixture was wrong; product limits and validators remain unchanged.
Retained original whole/context:
`/mnt/data10tb/codi-acad-saved-content-20261110-r8/whole`.
Base source for this acceptance-only branch is Root
6d8b96129cd4508b451762fd951b4a54d26e0cab.

Reviewed actual source limits: safeExpression.mjs evaluates each nonblank
assignment RHS with a2048-character limit; blank lines are explicitly skipped.
parseMathDefinitions permits2048 lines and262144 total characters; the public
legacy numeric command and legacyNumericExpressions constrain total source to
65536 characters AND UTF8 bytes, at most256 definitions and finite numeric
results. The new source has two lines, one definition, RHS ` 1` length2,
whitespace-only first line at most16383 spaces, and total ASCII source below
16400 bytes. It exercises the existing ignored-blank-line rule naturally.

The source-only construction helper accounts for the actual JSON encoding of
both the old expression string and the newline (escaped `\\n`, length2), then
calculates one padding value modulo16384. It records all arithmetic inputs.
Independent Python reading recomputes the same arithmetic without importing
the Node helper or product parser, verifies the persisted script and the actual
Unicode byte/value/boundary location. Public apply/rebind/Save/Open must still
succeed; no accepted model/file is synthesized. The actual Unicode native
SaveAs and fresh Open requirements are retained.

No test, parse, build, retry or runtime source edit was executed for this repair.
It is an acceptance source correction only, awaiting independent source review.

Custody review follow-up binds the actual Core legacy command, disposable
solve Worker dispatcher, response client, legacy transaction, expression
publication registry/service and Craft publication composition. Direct
transaction imports and the headless Worker build entry are also bound.
This is additive producer-role custody in the same existing freezeSources and
independent exact-roster/Git-blob reader; no fallback source roots or runtime
claims are introduced. The fixture source-only branch changes no product code.
