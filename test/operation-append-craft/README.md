# Creation travel in the shared Craft transaction — candidate

This first integration supports full-tip WORKER_SOLID_EDGE_TREATMENT_V1 appends.
Creation, numeric edits and travel share the existing bounded authored journal
and public inspect-authored-edits / travel-authored-edit endpoints. UI shortcuts
use that same dispatcher. Other creation classes are not qualified by this work.

The candidate records one canonical immutable appended operation and bounded tip
metadata. A single live journalHeadDefinition reference binds the accepted owned
history; journal entries contain no history prefix, model, mesh or native handle.
Creation travel shares immutable owned records in a new frozen prefix/append
array; it does not use the narrow full-history edit serializer. Existing native
restore/pipeline bounds are unchanged. Redo appends the same authored operation
and ID directly through pipeline evaluation, without a new allocator claim.

Supported creation appends preserve preceding edit entries and truncate a redo
branch only on accepted publication. Failed/cancelled candidates retain accepted
state/journal. Travel uses the existing source/material/stream/document guards,
fresh candidate ownership and atomic publication. Undo produces a full-tip
shorter document, without a hidden timeline tail; normal Save should persist it.
The session journal intentionally resets on Open. Allocation high-water never
rolls back; rejected new creation can consume a skipped ID under existing policy.

Initial focused controls:32 journal/history/source groups pass; TypeScript
passes. The old source-only assertion needed the expanded expression-table
tracking list; no product guard was relaxed. Those controls are not a live
Craft/browser/native/UI/save qualification. Actual signed creation travel,
chronology, branch/counter behavior, prefix Save/Open, shortcuts and resource
release remain required before marking this substep passed.

Gate1 scope is21 exercises; E17/C10 assembly is deferred to Gate2. Files remains
accepted, filesystem-race testing cancelled and visitor relaying disabled.
