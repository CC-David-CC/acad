# CAD Modeler on WebOS

The CAD Modeler launcher runs the ACAD source build with its OpenCascade
rectangle workbench. The app ID in the WebOS registry is `jsketcher`. Read the
[engine and package build instructions](../../modules/engine/source-occt/README.md)
for the editor, engine and corresponding-source package.

| Tested artifact | Revision |
| --- | --- |
| ACAD editor | `71ee2f30d6e13496b90e9e2affda413ca381b0fb` |
| Viewer | `ec3deccd50677eda9ff2ab8e2b7181061c3ad6d68b42634e91ea87daf1ace736` |
| Previous viewer | `118de96a1ce34be8046cec094e74570868e95f8ddd0e33ef828c2e24e2377627` |
| OpenCascade.js source | `341fa789f49ce73db76a0209d89ae518cc64a52d` |

## Phone workflow

Use the 3D Printing launcher menu, then open CAD Modeler. In the editor, choose
the dimensioned rectangle tool. Enter 90 mm for width and 45 mm for height.
Create the sketch. Use File › Save As To My Files and enter a name. The app adds
`.cad` when you enter a bare name for a new project. Close the editor, select
the saved file in My Files and use Open. Reopen the dimension editor, change
the width to 95 mm and use File › Save To My Files.

This workflow covers the app's core sketch and file cycle. The test also
cancelled both the open picker and the first Save As prompt, opened the Views,
Mode and Debug menus, and checked the phone launcher returned on close. The
phone test measured 44 CSS pixel touch targets in the bottom menu and reached
the filename field and Save action with the software keyboard active.

Guest files are available in My Files for that browser tab. Signed-in testing
waited for the server to receive the file, then reopened it from a fresh login.
Desktop Chromium also saved and reopened the historical `.jsketcher.json`
format by entering its full extension. It selected the sketch plane in the
extrusion wizard, chose Region 1 and made a 20 mm deep OpenCascade prism with
six faces. The prism and editable operation history rebuilt from its saved
native archive. The tablet check used touch emulation
at 820 × 1050 CSS pixels.

| Device | Browser | Workflow |
| --- | --- | --- |
| Samsung Galaxy S10+ portrait, 411 CSS pixels wide | Chrome 158.0.8127.92 | Sketch, native save and reopen in guest and signed-in sessions |
| Moto G 5G landscape | Chrome 158.0.8127.42 | Guest sketch and native file cycle |
| Desktop Linux, 1360 × 850 | Chromium | Signed-in native and JSON file cycles |
| Emulated touch tablet | Chromium | Guest sketch and native file cycle |

## Physical Galaxy S10+ screenshots

- [File menu and compact controls](screenshots/s10-file-menu.png)
- [Naming the native project](screenshots/s10-save-entry.png)
- [Reopened project after saving the revised width](screenshots/s10-editable-project.png)

## Workflow coverage

| Workbench workflow | Galaxy S10+ portrait | Desktop Chromium |
| --- | --- | --- |
| Create a dimensioned rectangle | Pass | Pass |
| Revise a saved rectangle and save in place | Pass | Pass |
| Save and reopen the editable native archive | Pass | Pass |
| Save and reopen the historical JSON project | Desktop check | Pass |
| Extrude a rectangle, fit the solid and reopen the feature history | Desktop check | Pass |
| Use camera presets and change displayed length units | Desktop check | Pass |
| Step the operation history back and forward | Desktop check | Pass |
| Edit sketches directly on the canvas with geometric constraints | Pending | Pending |

The phone covered three of eight workflows. Desktop covered seven of eight.
The hosted tests replayed the guest phone file cycle and desktop prism
workflow. Desktop also opened the corresponding source and license list.
The Mode menu displayed and applied both unit choices. Chromium logged
invalid SVG size attributes for some of its icons.
