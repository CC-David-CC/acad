# Viewport keyboard focus — production candidate

`before.json` records a real signed Chromium desktop at port20920 with CAD
source98fe85145. The foreground top document has focus and the click location
hits the CAD iframe. Trusted clicks at both actual canvases leave the outer
active element BODY and inner document unfocused. No keyboard events were sent
in that control. The parent creation-history run retained its failed focus
precondition before Ctrl+Z, separately from successful public creation Undo/Redo.

The trackball controls call `mousedown.preventDefault()` without focusing their
element, and the renderer canvas had no tab stop. The candidate makes the
SceneSetup-owned renderer canvas focusable and focuses the controls' element
without scrolling on enabled mouse/touch start, before normal control handling.
It does not add global listeners, new operations or an alternative shortcut
dispatcher. Renderer disposal already removes the owned canvas and controls.
It does not focus a text field or request an on-screen keyboard.

The complete TypeScript check passes. Natural canvas-click focus, actual
Ctrl+Z/Ctrl+Shift+Z, touch behavior and close/disposal still require the next
source-pinned runtime. The earlier source98 shortcut test can use a genuine
File-menu click/Escape to establish focus; that is distinct from qualifying
this canvas-focus correction. No broad UI or full Gate1 pass is claimed.

Subsequent actual proof: the combined source69a476bfa passes natural canvas
click from asserted outer-only focus, real Ctrl+Z/Ctrl+Shift+Z and a separate
trusted-touch canvas focus control. See `test/combined-core-qualification/`
and the desktop repository's creation-history natural evidence. This resolves
the bounded mouse/touch focus requirement above, without a full phone/UI claim.
