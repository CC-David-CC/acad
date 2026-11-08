# Exact angle-zero Polar frame: source repair

Source-only repair based on producing f990b1c. No tests, probes, TSC, builds,
Native execution or browser runs were performed. The unchanged complete
point-line workflow and its R1 failure are retained; root runs the coherent
application workflow after composition. This packet adds no qualification.

## Actual failure and original equations

The complete PL R1 stopped at its distinct signed-Y redundancy check. Actual
retained and public native inspection coordinates are datum D=(100,100),
line A=(0,0), B=(10,0), P=(20,2). Native line angle=0, signed t=10. Its
DistancePL has distance2/inverted false. Signed endpoint dimensions from D fix
A and B. P also has signed-X distance-80. Adding signed-Y D→P distance-98 is
mathematically dependent, yet both it and DistancePL were reported accepted.

After endpoint coordinate reduction the ORIGINAL Polar equations are
t*cos(angle)-10=0 and t*sin(angle)=0. Original DistancePL remains
-Px*sin(angle)+Py*cos(angle)-2=0. Later signed-Y can pivot Py=2, leaving the
nonlinear PL row -20*sin(angle)+2*cos(angle)-2=0. Numerical success satisfies all
rows but is not exact redundancy proof. Existing redundancy credit requires a
whole original constraint to reduce to certified literal zero. The missing
fixed-frame consequence explains the source-level classification path; no
geometry drift or duplicate row is asserted by this evidence.

## Sufficient proof and custody

NEW constr/exactAngleZeroPolarFrame.ts captures ORIGINAL active registered
polynomials before any optional reduction. Fixed-value witnesses are restricted
to actual same-stage LockPoint, PCoincident, SignedDistanceX/Y equations and
their genuine EndPoint/Param/SolverParam identities. No public IDs, permission
flags, raw arbitrary equations or optimizer status supply proof.

Ordinary elimination must FIRST have proposed all four endpoint values.
Private proof then propagates unique one-unknown ORIGINAL linear equations.
The unknown coefficient must be nonzero. Every supporting known value has its
own earlier proof. Substituting the proposed Number and all already proved
values must produce EXACT dyadic zero, using BigInt products/sums of represented
binary64 coefficients and values. This checks multiplication/addition exactly,
not equality after rounded multiplication and not the approximate-reduction bit
alone. No floating division is used by the certificate. A proposed value that
does not satisfy the exact original equation is not certified.

For an actually owned registered intrinsic Polar, exact pre-reduction angle
zero selects the regular zero-angle chart. Proof additionally requires fixed
A.y=B.y, exact representability of signed dx=B.x-A.x, and abs(dx)>1e-9 using the
existing nondegenerate direction envelope. In this chart sin(0)=0, cos(0)=1 and
the unique Polar solution is angle0, t=dx. Negative dx yields NEGATIVE t.
The angle+pi/-t gauge twin is a different branch and is never substituted in.
Zero current residual alone is insufficient: fixed-endpoint implication,
original registered Polar, actual branch and owned parameter custody are all
required. No near-angle/cardinal rounding, atan2 inference or forced t-positive
normalization is introduced.

The proof does not globally equate Polar gauges. It only reduces the chart
actually captured from the native model for this build. A source or branch
change requires fresh construction. Other angle charts, nonexact arithmetic,
unknown dependencies, external-stage endpoints and unqualified ownership stay
on the original numerical path. This sufficient domain is not a new feature
admission floor or a claim of arbitrary-direction exact redundancy. Direct angle
equations/composed-angle functions and any other original signed-t consumer
also keep the numerical path. Their authored gauge/turn/signed-length intent
must not be superseded by this optional zero-chart certificate; ordinary
sin/cos spatial consumers such as DistancePL do not select a raw angle turn.

## Ordered atomic reduction and original validation

Certificate lookup occurs at each restart of the EXISTING ordered reduction,
after endpoint pivots and BEFORE later scalar pivots. Delaying it until every
scalar has pivoted would assign redundancy credit to the earlier PL row instead.
The two certified substitutions are prepared on detached polynomial copies and
published only when EVERY affected optional rewrite succeeds. Existing
approximate provenance is retained on every affected polynomial/monomial;
uncertified angle/t ancestry is not promoted. General coefficient, offset,
solver stopping and residual policies are unchanged.

The actual Polar rows are USED by this proof and are not falsely declared
redundant. They remain as original-equation deferred validation obligations.
After back-substitution, private verification rechecks active original schema/
constraint/object/Param identities, raw constants, actual fixed-value witness
equations and values, endpoint graph, zero-angle chart, signed t and both
ORIGINAL Polar residuals. Existing registered domain and dimensional residual
validation still runs. Failed recheck refuses via retained-validation-failure;
bounded exact-proof exhaustion is resource-limit. No rejection is relabeled
physical infeasibility.

The private verify closure is held in the existing deferredConstantRows record.
Existing reset, transaction, admission and reclassification snapshots already
own that map; no persisted field or separate authoritative state is added.
Updates preserve the closure through validation. A rough solve containing this
particular obligation uses the existing fine solve so publication cannot skip
its original proof; other rough policies and numerical thresholds are unchanged.

The original-radii/constraints/source checks and two-Worker command proof are
not replaced. Signed reversal and the entire frozen PL workflow remain mandatory.
The certificate must not conceal a separate warm/cold Polar gauge mismatch.

## Bounds and remaining evidence

The per-build proof and each independent retained verification have a1,000,000
work-visit ceiling. BigInt intermediates are bounded to8192bits. Full finite
binary64 dyadics need up to2098common coordinate bits; a linear coefficient/value
product and finite bounded sum fit the chosen wider intermediate envelope.
No bits are truncated and no nonzero is epsilon-zeroed. These are proof-resource
limits, not a precision/feature-scale guarantee. Existing geometry/source limits
remain intact.

Only source review is complete. Root must rerun the unchanged whole PL workflow,
including distinct redundancy, real conflicts, zero, signed reversal, travel,
named edits/removal and normal .cad Save/server equality/fresh Open. Prior R1
remains a failure. Broader general arithmetic provenance and nonzero-angle frame
certification remain separate work; this packet does not claim them repaired.


## Source language compatibility correction

Independent source review noted that1b8dbe3 placed BigInt literals, BigInt
conversion and DataView.getBigUint64 in a TypeScript file despite the existing
declared ES2015/es2018 contract. Babel is used by normal builds; no actual build
failure was observed or newly claimed. The correction extracts the unchanged
binary64 decoding, normalization, exact add/multiply/equality/negation and
8192-bit/error policy into NEW constr/exactPolarFrameArithmetic.mjs. Model,
ownership, ordered reduction and retained-verification types remain in
exactAngleZeroPolarFrame.ts. Its zero test uses bigint truthiness, with the
same meaning. The shared failure constructor retains identical code/message
and admission-cause classification. No compiler target/lib change, ts-ignore,
float conversion, arithmetic weakening, driver edit or execution accompanies
this source-only extraction.
