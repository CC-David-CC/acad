# Driving-dimension R3: bounded passive replay evidence

Source-only corrective diagnostic on the actual R3 source family. No tests,
probes, TSC, builds, Native or browser execution were performed. The original
driver, criteria, solve count, error code and reply keys remain unchanged.

## Actual observed failure

The complete unchanged point-line R3 ran on Core40f5c92/Desktopcb929 and failed
at its signed endpoint reversal: edit actual SignedDistanceX from the rectangle
datum to line endpoint B, replacing distance-90 with-110. Its canonical receipt
is test/point-line-distance-public-workflow/evidence-r3/receipt.json, frozen in
5d61bf01090167607a369e099902b4e109db9cbb. R3 reached22 rows,261 calls,12
observations,4 local diagnostic reports and3 refusals, with no native saves.
The formerly failing distinct signed-Y redundancy assertion now passed. These
are observations of that whole run, not qualification of the remaining flow.

The actual final refusal is CURRENT_GEOMETRY_MISMATCH, “Dimension verification
changed solved geometry.” It occurs after warm transaction serialization and a
successful independent solveSketch, at the existing exact sameRestoredSketch
comparison. R3 does NOT record the failed candidate or cold field difference.
Therefore it establishes neither the changed field nor its magnitude, nor
whether geometry, admission or other exact serialized intent differed.

## Source-confirmed representation seam, not an observed divergence

Segment.write stores only a/b endpoint coordinates. Segment.read constructs a
new Segment, whose syncGeometry initializes nonnegative t and its angle from
the endpoint direction. The general dimension transition updates the actual
constraint constant and solves its native transaction; unlike the explicit
coordinate transition, it does not first call the changed parent Segment's
syncGeometry. The approved exact angle-zero certificate may retain that warm
chart with negative signed t when fixed endpoints reverse.

For the specific requested A=(0,0), B=(-10,0), angle0/t=-10 and angleπ/t=+10
satisfy the same Polar endpoint equations. DistancePL uses sin/cos(angle)
without DIRECTION_SIGN(t), so the two charts impose opposite polar-normal
sides. This is a concrete source seam worth measuring; it is not a claim that
R3 observed either frame or a4mm point-side change. No equation, gauge or
normalization repair is included in this packet.

## What the next complete run can observe

Immediately before the EXISTING cold solve, the Worker captures at most two
relevant actual warm DistancePL rows associated by actual native object
identity with the edited constraint. It reads the real Segment angle/t Params,
resolved inverted/distance and the original registered polynomial residual.
It neither resolves new constants nor mutates parameters or invokes a solve.
The diagnostic scans at most4096 native constraint rows and retains at most200
characters of complete compact records. These are diagnostic bounds, not
new model or admission limits. Failure to observe a row yields unavailable.

If and only if the existing exact comparison refuses, the same error message
includes the actual first candidate/cold serialized difference, with bounded
path/scalar/delta text, plus the captured warm records. Warm columns are:

`[stageIndex,nativeConstraintIndex,angleRadians,signedTmm,inverted,resolvedDistanceMm,originalResidualMm]`.

The entire message is at most512 characters, as before. It contains no full
source, request, arbitrary public ID, stack or model handle, and it is not
emitted to general logs. A diagnostic formatting failure cannot replace the
original CURRENT_GEOMETRY_MISMATCH refusal. No diagnostic grants admission,
classification, source membership, geometric accuracy or publication authority.

Actual cold native angle/t are explicitly unavailable. Existing solveSketch
callbacks expose authored evidence, selected factory-created auxiliaries and
numerical stopping, but not the cold Segment frame. This packet neither adds a
solver API nor executes a separate reconstruction/probe to manufacture those
observations. Cold endpoint coordinates remain actual serialized observations;
any frame inferred from Segment.read's source contract must be labeled derived,
not an actual captured cold native frame.

The full unchanged workflow must run after root normal composition. Its first
actual difference/warm records should distinguish a possible chart/side flip
from small numerical or admission movement before any mathematical repair is
chosen. No tolerance, original equation, human recovery policy, source format,
positive/negative driving domain, branch or expected outcome is changed here.
