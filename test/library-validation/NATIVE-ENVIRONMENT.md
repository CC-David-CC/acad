# First native validator environment

Qualification tooling only. No browser dependency, production/runtime change or
new acceptance claim. Follow the library integration plan and preserve raw input.

R730 directory: `/mnt/data10tb/codi-acad-library-validation-native-20261109-r1`.
Python 3.12 / Linux x86_64. Python distributions are pinned with wheel hashes in
requirements-native.txt. Acquire with pip download --require-hashes
--only-binary=:all:, then install --no-index --find-links from the retained wheel
directory into an isolated venv. No system Python packages are installed.

CGAL is assessed as the native Ubuntu package version 5.6-1build3. Extract, do
not install, exact packages into an isolated prefix:

- libcgal-dev=5.6-1build3
- libboost1.83-dev=1.83.0-2.1ubuntu3.2
- libgmp-dev=2:6.3.0+dfsg-2ubuntu6.1
- libmpfr-dev=4.2.1-1build1.1

Retain the authenticated apt-index metadata, downloaded package hashes and the
actual extraction/build commands in the environment acquisition report. Existing
GMP/MPFR runtime libraries are inspected separately. Exact header/compiler/linker
versions and the executable hash belong in every native run manifest.

Pinning this available native release is not a decision to ship it in browser
WASM. Source/API/license/precision and runtime fit must be reviewed independently
before any distribution. CGAL exact predicates do not establish full authored
surface agreement; retain a separate NOT_CERTIFIED deviation outcome until its
complete proof exists. This environment does not alter the first failing oracle.
