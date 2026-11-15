# Radius command registration splice

Source only; no build/test/browser claim. In the normal outer index, import
`registerRadiusCommands` from`./radius-commands.mjs`; add
`host.onDispose(registerRadiusCommands(host,()=>rectangle.target()))` adjacent to the
existing closed-sketch registrations. Root owns this two-line index splice.
Core must expose`craft.applyClosedSketchRadius` from the real closed-source
coordinator before registering the command. Existing dimension inspection,
edit/remove, travel and save commands are reused unchanged.

No successful fake transport/native fixtures or alternate provider are supplied.

Composed source-only on Desktop694668fa2: actual index import and lazy target
registration are now present on the radius integration branch. Installed-app
policy and all existing exports/commands remain unchanged. No execution claim.
