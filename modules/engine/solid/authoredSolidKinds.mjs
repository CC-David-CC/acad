// One authored solid-history vocabulary for backend ownership and budgets.
// Membership is not proof of operation validity or backend capability.
// Keys are the genuine private ledger kinds; values retain the existing
// authored type order. This is a closed identity map, not an admission table.
export const AUTHORED_SOLID_TYPE_BY_LEDGER_KIND=Object.freeze({
 'profile-extents':'WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1',
 profile:'WORKER_SELECTED_PROFILE_EXTRUDE_V2',
 box:'WORKER_SOLID_BOX_V1',
 boolean:'WORKER_SOLID_BOOLEAN_V1',
 'edge-treatment':'WORKER_SOLID_EDGE_TREATMENT_V1',
 shell:'WORKER_SOLID_SHELL_V1',
 'blind-hole':'WORKER_CENTERED_BLIND_HOLE_V1',
 counterbore:'WORKER_CENTERED_COUNTERBORE_V1',
 countersink:'WORKER_CENTERED_COUNTERSINK_V1',
 'through-hole':'WORKER_THROUGH_HOLES_V1',
 'linear-hole-pattern':'WORKER_LINEAR_HOLE_PATTERN_V1',
 revolve:'WORKER_SELECTED_PROFILE_REVOLVE_V1',
 sweep:'WORKER_SELECTED_PROFILE_SWEEP_V1',
 loft:'WORKER_SELECTED_PROFILE_LOFT_V1'
});
export const AUTHORED_SOLID_KINDS=Object.freeze(Object.values(AUTHORED_SOLID_TYPE_BY_LEDGER_KIND));
