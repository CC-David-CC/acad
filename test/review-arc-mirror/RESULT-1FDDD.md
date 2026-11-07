# Arc Mirror actual Save — 1fddd

The editor's Arc tool and registered Mirror action create an Arc-to-Arc generator in the actual app on fixture `20473`, CAD `1fddd2d1ce89a216d011e304fafcbf284b066278`. Normal editor Save is rejected by its installed Worker with `UNSUPPORTED: Invalid or unsupported stage/generator graph`; the prior stored sketch remains byte-identical. `stageGeneratorPolicy.mjs` admits only Segment and Circle Mirror sources, although Arc is accepted as standalone geometry and the editor exposes Mirror for an Arc. Test `refusal-browser.test.cjs`, log `/tmp/codi-arc-mirror-1fddd-r1.log`.

This is an observed editor-to-Save compatibility gap. It does not establish native Arc Mirror persistence, stale replay behavior, or CW/CCW or sweep correctness; these positive controls require an implementation admitting and validating the geometry. No runtime changes were made.
