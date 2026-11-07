# Complete-export throughput repair

Before evidence is the real signed 32-hole export workflow in Desktop
`92dc8e59a`, `test/agent-cad-corpus/manufacturing-shared/32hole-evidence-r1/`.
Actual authoring, manufacturing assignment, native Save and fresh Open completed;
initial export hit the existing 30-second encoder deadline and wrote no file.
The primary plate and two-part export workflows completed on the preceding code.

The validator previously awaited an async function for every candidate triangle
pair and BVH node, with a timer every 256 checkpoints. Repeated nested timers and
per-pair promise continuations add scheduling work unrelated to the exact
geometry decisions. The repair uses an iterative BVH build and paired-node DFS,
with synchronous pair evaluation between elapsed-time slices. After eight
milliseconds of work, a reused invocation-local MessageChannel yields to a task;
environments lacking MessageChannel use a timer at that same elapsed-time boundary.
Both ports close in finally, with cleanup failures preserved separately from the
primary operation error. The exact dyadic predicates, actual indexed adjacency
rules, pair/predicate caps, containment forest and orientation checks remain in
place. The public encoder's 30-second deadline and all byte/triangle caps remain
unchanged. This is a scheduling repair, not an established performance result.

The dedicated 3MF Worker also emits bounded private work diagnostics. A fresh
per-client-job key and increasing progress index route at most 512 records;
each own-data record is at most 2 KiB. Counters are monotone within an object;
object indices may advance only one at a time. Reports occur at most every
500 milliseconds plus phase completion/failure. They contain no geometry arrays
or source authority. Client errors retain the last validated record as own
`error.work`, including a timeout or cleanup failure. Final result/source binding
and the public success schema are unchanged. The linked SVG dispatch is unchanged.

Root's complete public workflow harness should copy only this bounded own-data
`work` property into its error receipt. Useful fields are phase, elapsedMs,
yieldWaitMs, yields, pairTests, exactPairTests, nodePairVisits, predicateTests,
rayTriangleTests, pairLimit, predicateLimit and deadlineMs. A missing work record
means no validated report arrived; it is not evidence of zero work. Reports are
observational counters, not an independent geometry or source certificate.

Per the user's workflow instruction, no isolated tests, benchmarks, compilation
checks or prototype reruns were run for this repair. Source was reviewed as one
coherent change. Qualification remains the next complete real 32-hole export
workflow, followed by necessary retained complete workflows. Keep its original
timeout receipt and report a further timeout or geometry refusal without relaxing
the geometry, file or work budgets.

## Complete rerun R2: broad-phase work exhaustion

The next real complete 32-hole workflow, raw
`/tmp/codi-manufacturing-export-32holes-20261107-r2/receipt.json`, reached the
unchanged pair limit rather than timing out. Its retained Worker diagnostic is
elapsed625.27ms, yieldWait26.27ms, pairTests2,000,001, exactPairTests106,637,
nodePairVisits138,204, predicates1,386,739 and BVHnodes4,095. No file was written.
This measures the scheduling improvement while exposing the coarse eight-triangle
leaf cross-products: most charged candidate pairs had disjoint individual boxes.

The follow-up partitions down to one triangle per leaf. A distinct overlapping
leaf-node pair therefore has overlapping triangle bounds before it reaches the
unchanged `pair()` function. Pair counting is not moved or waived: every actual
pair invocation still increments it before its own defensive bounds/exact check.
Every unordered triangle pair is either safely pruned by disjoint containing
node boxes or reaches the same exact predicate path. DFS split order and pair,
predicate, node-visit, deadline and mesh caps remain unchanged.

With nt triangles the balanced binary partition has nt leaves and exactly
2*nt−1 nodes (maximum499,999 at the existing250,000 triangle cap); an explicit
construction guard enforces this bound. No parent node retains its build IDs;
pending split arrays plus leaves hold O(nt) indices and the DFS traversal uses
bounded-depth pending tasks. The extra nodes trade memory for precise broad-phase
pruning; whole-workflow resource/performance results remain to be observed. No
isolated run, microbenchmark or predicate test was executed for this correction.
