# Original-source extraction Worker routes

SOURCE ONLY / UNEXECUTED. Two new private tasks route extractFiniteCurveSource
and verifyFiniteCurveSource through the existing single-request solveWorker.
transitionClient captures the complete bounded original request before dispatch;
client structurally captures the exact receipt, including revision/failure cause.
Each call gets a new actual Worker via runSketchSolve, with existing Web Lock,
outstanding/deadline/cancellation/currentness and cleanup-failure fencing. The
independent verification must be a second call, never reused workspace/global IDs.

The existing source extraction does cold solve/admission/actual model IO/owned
Params/original-bit binding/hash work in the Worker. No new heavy Main operation,
model mutation, geometry handle, event ID or accepted-document proof is introduced.
The caller still owns full current-job/history/Native/certificate/publication
orchestration and MUST recheck it after each await. These private DTOs are not
public input commands and their successful structural capture is not authority.

No module/parser/build/test/Native/browser execution yet. Arc source packet and
both existing transitionClient Arc capture splices remain prerequisites before a
new coherent build. Mathematical-certificate Worker route and current-source
owner/public operation composition remain OPEN.
