# Private cylindrical cut witness — E22 component

Worker-only pure helper: connect a single-circle tool's real prism sweptFace to
current Cut face through native B-side ancestry. Reuse existing Boolean/copy,
topology and prism validators. No Native/dispatcher/journal/public/UI change.

Exact input: {operation:'subtract',sourceTopologies:[A,B],result,topology,
toolConstruction,toolRequest}. The operation must come from the actual private
Native invocation, not a caller-supplied claim; native receipts lack that field.
Tool must be a single circular extrusion without holes. Native ancestry rows
ALREADY refer to original source slots: ownedBooleanHistoryV1 rows() uses the
checked copy mapping internally. Never apply sourceCopyB a second time.

Select cylinder by actual prism sweptFace, then unique same/modified descendant
by Cut B ancestry. Missing/split/ambiguous history refuses. Geometry comparison
verifies the selected support; never selects by proximity. Report actual result
radius/axis/origin/diameter, never nominal diameter. Circle ID labels an input
slot; it does not authenticate project membership. Later Worker caller must bind
real creation/request/handle/owner/source feature/region/build/lifetime.

Return small deeply frozen response-local slots/label/cylinder/diameter. No
saved native ID, authored measurement value, mesh inference or new feature.
This is a cut boundary witness, not universal through-hole/contact semantics.

Replay unchanged genuine real-circle-through-cut in existing
owned-boolean-contract/native-main-receipt.json in a real Node Worker. Source
plate100×50×20, actual native radius5; measured volume100000−500π. Expect D10
and axis through(50,25), selecting result face only via ancestry. Record native
source/runtime pins. Mutated negatives are synthetic, never new geometry.

Controls: unchanged inputs; missing/ambiguous history; wrong descendant/support;
copy certificate corruption; noncircle tool; hostile top-level accessor; nominal
radius cannot replace actual output. Later fresh native/production Worker,
shared reference discovery/currentness/measurement and full E22 remain open.
