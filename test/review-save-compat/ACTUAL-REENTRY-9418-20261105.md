# Actual editor Save reentry qualification — 9418 — 2026-11-05

PASS, actual Chromium at private20466/CDP19329 on source
`94187fc43c4a175c6d2fdbb666490cd14e67e14b`. Runtime exec handle37793 completed
with exit0; the test's owned context and all pages closed in finally. It used
the committed03260a176 actual-save-reentry-browser script. No production edit,
app build, service/route change, real account or host Save by this lane.

| Served artifact | SHA256 |
|---|---|
| App | 2baaedd49398def27ce93904cb910501eced490a3817fdfd2b5d79df7df28674 |
| webos helper | 77fda6d79abe2ae6b4917fb226d97529dd6719b1900f2c29f71cf20eb7ff59d6 |
| sketch-solver.01398dd7fc36b6f19bd9.js | e31143a7a5e95354454aef46a4a68c06ab7944d9a97045e66b7cc20c21351415 |

Every opened test page fetches and verifies these pins. The test runs against
the actual editor, versioned store, action service, real authoring tools/helper,
real production client and actual installed Worker. It fabricates no Viewer,
storage object or successful Worker result. Strict self-only script/Worker CSP
was observed. Tool calls use existing helper/service APIs; trusted gestures,
canvas appearance and signed host persistence remain separate evidence.

| Actual case | Observed result |
|---|---|
| Direct editor.save then new draft then Save-and-Exit | Both commits succeed; fresh native envelope restore preserves latest sketches/history |
| Hold an actual validated Worker response, mutate same Viewer, release | AbortError without committed marker, exact old stored bytes, same Viewer/open draft; one Worker starts/terminates |
| Duplicate Save while first response held | Refused as already in progress |
| Retry after held-response refusal | Succeeds; fresh native restore retains both circles and exact latest-circle geometry |
| No-op Save then PointTool in a microtask | AbortError; same Viewer/tool/draft retained, exact stored bytes, zero Worker starts |
| Release tool and retry no-op | Closes, retains exact bytes; fresh native restore passes |
| Ordinary storage listener | One notification delivered after editor exit |
| Actual observer with injected immediate100ms flush | Candidate bytes installed exactly, observer authors a new circle, committed:true AbortError keeps same Viewer/new draft open |
| Retry after committed observer reentry | Succeeds; native restore retains that observer-authored circle/geometry |
| Foreign stored-source write then same-byte ABA | Refused without further write/version change; same Viewer/new draft retained |

The observer-in-commit case explicitly injects notification timing: the actual
storage flush callback runs immediately while its native timer is retained.
It uses the actual storage.addListener publication and real tool authoring. It
does not claim ordinary listeners are synchronous; the separate ordinary case
proves their deferred delivery in this fixture.

Full JSON: `actual-reentry-9418-result.json`, SHA256
`179edc478f1a19d2ef93ca95afaea8da214a3a70d9515e6e7f5e593744b8588b`.
The full stdout is retained. Priorcbb failure receipts stay unchanged. This
run qualifies the rearm correction's actual app paths, including four fresh
native restore controls. It does not cover the later097/5a53639b5 notification
exception-handling change, untested history/catalogue cases, broad CAD kernel
or worker-first performance. The final combined build requires matching new
pins and its own qualification; no release/packaging completion is claimed.
