# Drawing SVG source integration review

Reviewed Core685ce66e1 and Desktop6b0e1458e. No tests, TSC, builds, browser actions or services were run. Findings are source control-flow defects, not observed Native/signed incidents.

The SVG client set settled before unguarded timer cleanup; a cleanup throw could prevent Promise settlement. Truthiness checks for cleanup/operation errors could conceal falsey thrown values. The repair attempts every cleanup, preserves exact cause/prior failure, settles once, handles messageerror, and fences later encoder allocation in this module after uncertain release. A window reopen may reuse the module. Native signal intrinsics and attached cross-realm buffer checks replace overridable methods/instanceof. This is not an OS memory reclamation claim.

The renderer formerly returned only the dimension-reference observation status: a genuine unavailable projection could still label the SVG available. It now retains complete read status and marks missing/unavailable views or dimension frames unresolved. Exact target/view identity is admitted before Worker-side curve decoding. Datum component labels are ΔX/ΔY; cap separation ΔZ; edge length L; diameter Ø. Approximate conic paths remain presentation only, never dimension witnesses.

The controlled3MF Worker retains its separate drawing refusal diagnostics unchanged. Desktop's derived export route retains exact frame/snapshot/revision guards, authorized file selection, pre-write currentness and committed/unknown outcome handling. PM/Craft/Desktop index are unchanged in this repair. Drawing command descriptor size is handled in a separate Desktop source checkpoint. Complete Native read/render/Save/Open/cancellation verification remains the composed end-to-end workflow.
