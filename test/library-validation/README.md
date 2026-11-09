# Read-only native export assessment

This evaluates library fit; it does not qualify Gate 1 or repair the first failing
oracle. No geometry generation, welding, reindexing or original-file rewriting.
The integration plan and `cgal/README.md` define the intended boundaries.

## Reproduce

1. Check out the recorded ACAD commit. Provision a new isolated environment:
   `bash test/library-validation/provision-native.sh /absolute/new/environment`.
   Pins target Ubuntu24.04/CPython3.12/Linuxx86_64. Keep acquisition logs/manifest.
2. Build `cgal/` with the isolated CGAL/Boost/GMP/MPFR headers and explicitly
   recorded runtime-library paths. Retain exact configure/build commands/logs,
   source commit, compiler versions and executable hash. No system package install.
3. Run the full actual settled six-mesh batch:

   ```sh
   /absolute/environment/venv/bin/python test/library-validation/compare_actual.py \
     /absolute/extent-r4/whole \
     test/selected-profile-extents-workflow/diagnostics-r4/INPUTS.json \
     /absolute/cgal-build/codi-cgal-readonly-mesh \
     /absolute/new-report-directory
   ```

4. Inspect every library result in report.json and mesh-specific CGAL reports.
   Preserve the first outcome even if it reveals an adapter/API problem.
   ASSESSMENT_COMPLETE_NOT_QUALIFIED means the batch finished, not that its
   individual checks passed. It is never an aggregate Gate 1 acceptance PASS.

## Scope

- Bounded ZIP/XML extraction retains scene structure and per-object raw arrays.
- lib3mf strict reading checks units, object/component/build structure, base
  materials, appearances, triangle material indices and metadata. Float32 vertex
  conversion is measured and explicitly nonauthoritative.
- Trimesh receives Float64 arrays with process=False, validate=False. Every
  measurement rechecks array bits/indices. Raw indexed edge uses and vertex-link
  cycles have an independent check; no automatic repair is permitted.
- CGAL gets original-order IEEE754 bit patterns and indices; its bounded report
  retains original face IDs and prerequisite-gates volume-boundary checks.
- Source intent and full finite-surface deviation remain NOT_CERTIFIED until
  their separate proof is complete. A watertightness or volume result cannot
  replace them. Existing source/Native/mesh/paper budgets are unchanged.
- Resource measurements describe this native batch; they do not qualify browser
  startup, WASM memory, large-project capacity or Worker retirement.

No CAD/browser writes, production imports, auth probes or relay tests occur.
Ordinary development dependency acquisition does not enable user traffic through
example.invalid. Working binaries/dependencies remain on R730, outside source Git.
