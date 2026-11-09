# Conical publication repair review — early failure remains open

Read-only review of Native04ad4cd070a3b42137a9c67cd53280a91ec0c7df versus
c29d45e0fd54cb5541a68f7b6f7b2992a7228402, following independent62b301.
No compiler, parser check, test, probe, Native/browser execution or callback
mutation was performed. Neither current public runtime uses these new ports;
no public incident is established. Source repair is not demonstrated behavior.

## What04ad actually closes

The two new ports now use their own `publishCaught` EM_ASM_INT wrapper. Its JS
try/catch contains exchange receiver exceptions and returns acknowledgment to
C++ instead of letting that callback throw across live implementation locals.
The shared selected-profile publisher and all old port bodies are untouched.

On an admitted constructor request, the success callback is followed by exact
name/frame memory, name census+1, exact inserted shape identity and complete
bounded BRep/catalog/tolerance snapshot checks. The read likewise checks its
captured input before AND after success delivery. A mutation after the old
pre-publication check can no longer return through that success path unnoticed.
The same checks run after error delivery for fully captured inputs.

Constructor rollback releases only its exact original allocation still at the
captured name with IsEqual identity. Missing/replaced identity is uncertainty;
a matching census alone does not authorize deletion. Other names/replacements
are not removed. After error callback, it checks census and unexpected continued
presence of its inserted name. Read performs no input repair/deletion.

The private helpers return only static terminal-code pointers. C++ strings,
TopoDS handles, snapshots and exception_ptr locals destruct on return. Only then
the two thin void C wrappers call terminalFailure, whose JS Error carries the
same bounded closed code. Thus a failed error receiver cannot normally return
and leave an earlier positive payload authoritative. Future Worker must still
discard ALL payloads on thrown invocation/missing/duplicate/malformed exchange;
a payload received inside a callback is provisional until Native return.

No changes were found to old publisher, Shell/circular source or same-Maps V1
serializer in04ad. Geometry/frame/support math remains the previously reviewed
c29 slice. No actual compile/link/ABI retention or callback behavior is claimed.

## Confirmed issue: CONICAL-EARLY-FAILURE-PUBLICATION-01

### Read: failed admission incorrectly means preserved

`ownedConeTopologyV1.hpp:90–110` defines preserved() as true when !captured
(line93). The flag is set only AFTER successful captureName, census, owned(name)
and snapshot(input) (line97). The error callback at105 then uses that same
predicate as its final fence at108.

Concrete source path: a bounded valid UNKNOWN owned name captures its name and
census, then owned(name) throws INVALID_REQUEST before captured=true. An error
receiver can change that captured name or the owned census and return normally;
line108 still sees true, and110 returns normally. A FOUND input whose bounded
snapshot throws likewise has no full preservation certificate, yet the same
shortcut certifies it. This contradicts the source handoff's statement that
snapshot inability is never a preservation certificate.

The required narrow repair separates independently known stages: bounded raw
name; census; lookup absence or exact found shape identity; completed full input
snapshot. Name/census/lookup must be fenced even before full snapshot admission.
A found but unsnapshotted input cannot be acknowledged as proven preserved.
Malformed raw input has an explicit no-input classification, not authority to
dereference unknown memory or synthesize a valid captured shape.

### Constructor: failed domain admission disables name/frame fence

`ownedConicalFrustumV1.hpp:55–58` makes inputUnchanged() true when !captured.
The flag becomes true only after captureRequest returns (line62 in04ad). That
function first copies the bounded frame, then checks its numeric/basis/radii/
height domains; it can throw before assignment/admission finishes.

Concrete source path: valid bounded name/frame with invalid radius or height.
An acknowledged error receiver changes original name/frame bytes, leaving the
name count unchanged. The final inputUnchanged test still returns true because
captured is false. Constructor census is already independently fenced; name/
frame capture knowledge must also be separate from successful domain admission.
No malformed/domain request may allocate a result as part of this correction.

Both findings are the same staged-knowledge error-delivery issue. The remedy
requires no new public schema, skip flag, global owner, second registry or old
port rewrite. Root approved a NEW issue/fix branch from frozen04ad; this review
remains the unchanged before-fix source packet. Original04ad/c29/62b301 remain.

## Qualification obligations remain explicit

Source review must confirm post-error staged fences and ordinary success/error
outcomes after the fix. Root then owns exact new pair compilation and one
complete genuine Native component/public workflow as appropriate. In that whole,
ordinary frustum/coupled read plus invalid-domain/unknown-name/snapshot-refusal
and receiver-error outcomes must preserve known input/census/lookup custody;
uncertain cleanup must refuse after RAII, without deleting a replacement.
Retained primary/Shell/circular ports and actual support/rim/role geometry on the
new pair remain unexecuted obligations. No callback probe, fabricated positive
Native result or current Gate signoff accompanies this review.
