# Source-built OpenCascade rectangle engine

This worker accepts ACAD's existing authored rectangle request in millimeters. It joins the actual saved segment endpoints into a native wire, face and prism, meshes the B-rep, and derives lateral-face ancestry from the builder's history. The app's existing topology validator, semantic worker, and mount-bound handle ledger still authorize publication. The worker keeps and releases each native solid.

The build uses taucad/opencascade.js revision `341fa789f49ce73db76a0209d89ae518cc64a52d`, OCCT `b8f597c677811d1f9f4d8a97f5ae2825c0353a42`, and Emscripten 6.0.5. The upstream single-thread build configuration with the adjacent one-line patch has SHA-256 `18bcff132d7bc746442dac8c5789d7ce4c1d30007805d45cf1de61fb1e8440f7`. This disables dynamic JavaScript execution in the generated bindings. The pins in `pins.mjs` identify the verified JS and WASM bytes.

Build the editor with `CODI_SOURCE_OCCT=1` in its normal Webpack build environment. Run `node build/stage-source-occt.mjs <libcascade-dist> <new-directory>` to stage the source modules and hash-verified runtime into the editor's `dist/lib-assets/source-occt` directory. The output directory must be new. The compiled editor selects the source worker before opening saved models. A rectangle can be regenerated from the editable sketch without persisting a native pointer. A distribution must carry the applicable engine licenses, exception and corresponding source. The existing broader legacy OCI cohorts have separate provenance and qualification requirements.


## Build the WebOS package

The source workbench supports dimensioned rectangles and native rectangle extrusions. Use a fresh checkout of the public ACAD revision and the pinned engine build described above. The engine source directory must contain the complete submodules, generated SDK, and matching `dist` files. The WebOS Runtime app builder consumes the resulting `jsketcher` directory.

```sh
npm ci
npm run build:webos-source
editor_rev=$(git rev-parse HEAD)
mkdir -p "$output/source"
git archive --format=zip --prefix=acad/ --output="$output/acad-source.zip" "$editor_rev" -- .babelrc LICENSE build externals.d.ts modules package-lock.json package.json tsconfig.json web webos webpack.config.js
python3 build/prepare-source-notices.py "$engine" "$output/engine-sources"
python3 webos/prepare-source-package.py --engine "$engine" --engine-sources "$output/engine-sources" --editor-source "$output/acad-source.zip" --editor-commit "$editor_rev" --output "$output/source/jsketcher"
```

Set `output` to a fresh absolute directory and `engine` to the configured libcascade source tree before running these commands. Run the Runtime app builder with `source` set to `$output/source`, `output` set to the staging desktop asset directory, and `apps` set to `["jsketcher"]`. The builder emits the registry entry, editor files, and source downloads. File → Sources and licenses opens the corresponding source index in the app.
