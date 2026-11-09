# Trusted offline planar coverage invoker — source handoff

SOURCE ONLY / UNRUN / NOT QUALIFIED. No import, parser, test, build, Native
executable, browser or actual invoker execution occurred in this lane.
New planar_coverage.py only; no Root current checker, C++ adapter, CMake,
cylindrical helper, evidence or runtime file is modified.

The target is the exact planar protocol/source ff35835e/ff045b45 (Root
54c38b9/420ea4e). Root owns executable build, all actual source/cap/rim loops,
complete six-file artifact integration and FIRST coherent execution.

## API

Keyword-only:

    invoke_planar_coverage(
        executable=ABSOLUTE_REVIEWED_EXECUTABLE,
        expected_executable_sha256=REVIEWED_SHA256,
        cpp_source=ABSOLUTE_ACTUAL_CPP_SOURCE,
        build_source={
            "commit": ACTUAL_REVIEWED_BUILD_SOURCE_COMMIT,
            "cppRelativePath": "test/library-validation/cgal/planar_coverage.cpp",
            "cppSha256": REVIEWED_CPP_SHA256,
            "cgalVersion": ACTUAL_PINNED_5_6_VERSION
        },
        vertices=ORIGINAL_WORLD_BINARY64_VERTEX_LIST,
        triangles=ORIGINAL_GLOBAL_TRIANGLE_INDEX_LIST,
        selected_triangle_ids=ACTUAL_ASSIGNED_ORIGINAL_IDS,
        frame=AUTHENTICATED_ORIGINAL_SOURCE_FRAME,
        projection_axes=ACTUAL_LOCAL_AXIS_PAIR,
        orientation=ORIGINAL_PROJECTED_SIGN,
        outer=EXPLICIT_AUTHENTICATED_LOOP,
        holes=EXPLICIT_AUTHENTICATED_HOLE_LOOPS,
        output_dir=NEW_ABSOLUTE_OWNED_DIRECTORY
    )

Paths are concrete strings. Build commit40hex and SHA256 anchors64lowerhex.
build_source is an exact four-field own record, not a success flag. Root's
reviewed build receipt must already bind compiler/flags/package/linker,
executable and actual commit:path; this invoker verifies actual expected
executable/CPP byte hashes and records the commit anchor. It does not infer
compilation provenance from the report or independently reconstruct a build.

frame is exact {origin,x,y,z}; origin original finite F64s and axes exact
right-handed signed permutations. projection_axes is two distinct local indices
in0..2; orientation±1. This adapter has no generic frame/scaling fallback.

Loops are exact records:

- {"kind":"indexed","vertexIds":ACTUAL_ORIGINAL_ID_SEQUENCE}
- OUTER ONLY optional {"kind":"source-rectangle","corners":FOUR_ORIGINAL_LOCAL_UV_PAIRS}

Indexed mode is PRIMARY. Optional source-rectangle points are independent
authenticated authored local quantities, not fitted/AABB/rounded mesh locals.
No automatic fallback after an ideal-source mismatch. Root retains the
separate Native/source incidence/displacement interpretation.

## Preflight and exact transport

Before detached snapshots/encoding, require concrete list/tuple/dict types and
original150000V/100000T/8MiB mesh budget, correct lengths, strict nonboolean
indices/signs, finite binary64 coordinates, selected-ID uniqueness and bounded
explicit loop count/aggregate vertices. Coordinate ints must be EXACTLY
representable finite binary64; strings, booleans, arbitrary rationals and
coercible objects are refused, not rounded. Original triangle order/indices,
selected order and explicit loop order are retained.

The writer encodes original world F64 bits with struct.pack('>d').hex(), source
origin bits, exact signed axes, projection/sign, all original triangles, selected
original IDs and explicit loops. It never computes mesh local coordinates,
normalizes orientation, triangulates, welds, repairs or fabricates geometry.
Actual native EPECK performs original-world frame subtraction/projection.

The immutable snapshot removes caller aliases before any process launch.
This is a trusted SERIAL offline API, not a live-user/callback/race interface.
Use a fresh single-threaded Linux process; active Python threads are refused.
Root must also exclude independently created native thread pools when using
Python's preexec resource hook. No new runtime is supplied.

## Resource and process ownership

Exactly ONE no-argument native process, shell=False, actual reviewed executable,
stdin from the newly owned immutable protocol file. No retry/probe/helper loop.

Native child soft=hard RLIMIT_AS1073741824bytes and RLIMIT_CPU120seconds.
Observed native wall deadline120seconds, with a separate bounded2second
kill/reap/pipe-settlement grace. These are derived-tool limits, NOT production
CAD/model/account quotas. RLIMIT_AS limits VIRTUAL address space; per-child
Linux wait4 ru_maxrss*1024 records actual peak RSS separately. Neither is a
measurement of host capacity, a lifetime memory bound or a performance proof.

stdout+stderr share a strict64KiB capture budget; raw files retain every byte
within that bound. Overflow terminates only the owned unreaped child/group and
records truncation plus observed-at-least counts. Report is separately≤64KiB.
Missing, killed, timeout, incomplete/overflow/error, changed custody, nonzero
success stderr, report/exit mismatch or nonPASS NEVER certifies geometry.

The invoker owns only its started process/session/pipes/files. It uses wait4 on
THAT PID, never wait-any. No signal after reaping or loss of wait ownership;
therefore a reused/foreign PID/group is not cleanup authority. Unexpected IO or
interruption attempts one exact owned termination and bounded reap. Any process/
pipe settlement still unknown is recorded PROCESS_UNSETTLED with actual PID/
group for Root reconciliation, never absence inferred from kill/close. No
browser/account/context or unrelated process is touched.

## Strict native report capture

The parser requires one complete bounded UTF8 JSON object, exact closed keys,
no duplicate keys/nonfinite values, exact adapter/scope/version/CGAL identity,
closed status/reason vocabulary and exact compiled limits. It validates strict
types/bounds/original-ID membership and state/completeness consistency.

Counts/loop modes/frame/projection are compared with independently prepared
input, not selected from report fields. PASS additionally requires:

- Full exact input census and no error IDs/line.
- Actual source-frame/projection/sign match.
- Completed correct loop domain and EVERY selected triangle scan.
- Zero complete degenerate/wrong-original-orientation censuses.
- Completed union with one finite expected connected component and complete
  boundary enumeration, exact triangle-area sum=union, empty symmetric
  difference, zero missing/outside components.
- Exact expected not-run post-failure diagnostic state for this CPP success
  path; no partial/unknown proof can become PASS.
- sourceBinding,planeIncidence,globalMeshValidity,analyticCircleDisplacement
  remain literal NOT_RUN.

Exit0 is required for a native PASS;1 for FAIL/RESOURCE_LIMIT/ERROR;2 for
INPUT_INVALID. A valid native record is retained even if the process/custody
outcome prevents its use. Caller must require OUTER metadata.status=="PASS",
not cherry-pick an inner report.status.

Diagnostic COMPLETE scan and complete ID list are separate. Native partial/
truncated output is captured with actual original-ID counts; never upgraded.
Report aliases are frozen before return. No caller-submitted valid flag,
unknown error reinterpretation or geometry authority is accepted.

## Files and returned custody

output_dir must not exist; its parent must already be owned/created. It is
created exclusively and is never cleaned, retried or overwritten. Fixed files:

- stdin.txt: exact protocol/bytes/SHA/line count.
- stdout.bin / stderr.bin: actual bounded raw native streams.
- invocation.json: bounded≤64KiB complete invocation metadata.
- captured-report.json only when a strict whole native report was captured;
  its exact bytes/SHA are recorded.

Executable, actual CPP, this Python source are hashed before AND after, with
file identity/stat metadata. stdin is hashed after as well. Root binds the
invoker's recorded actual source hash to its separate reviewed acceptance Git
source; build commit and invoker commit need not be equal. Missing/changed
anchors cannot coexist with an outer PASS.

Return value is deeply immutable MappingProxyType/tuple:
{"metadata":WHOLE_INVOCATION_METADATA,"report":WHOLE_STRICT_NATIVE_REPORT_OR_NONE}.
No geometry arrays or live process authority are returned. For a JSON aggregate,
Root can read the recorded immutable invocation/captured-report files and bind
their SHA/custody, rather than mutate or directly serialize MappingProxyType.

Preflight failures are recorded without launching a child when a new owned
directory can be created. Existing output directory is refused before writing.
An unrecoverable evidence-file IO failure may raise; missing/partial manifest
is not PASS, and Root must preserve that directory/owned process outcome.

## Remaining obligations

Root's original all-triangle assignment, source/Native/cap/rim/material/global
3D validity, planar incidence and analytic circle/wall displacement proofs stay
mandatory and separate. This invoker proves no source membership, manufactured
conformance, physical model or universal CAD validity. Root alone prepares the
complete caller/batch, normally builds and executes the FIRST actual-artifact
workflow. No source-only packet here changes existing evidence or qualification.
