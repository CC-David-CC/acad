#!/usr/bin/env bash
# Isolated Ubuntu 24.04 / CPython 3.12 / Linux x86_64 assessment environment.
# Downloads and extracts packages; never installs system packages or changes CAD.
set -euo pipefail
if [ "$#" -ne 1 ]; then
  echo 'usage: provision-native.sh NEW_ABSOLUTE_ENVIRONMENT_DIRECTORY' >&2
  exit 2
fi
environment=$1
case "$environment" in /*) ;; *) echo 'absolute directory required' >&2; exit 2;; esac
source_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
mkdir -- "$environment"
mkdir -- "$environment/wheels" "$environment/debs" "$environment/prefix"
cp -- "$source_dir/requirements-native.txt" "$environment/requirements-native.txt"
cp -- "$source_dir/freeze_environment.py" "$environment/freeze_environment.py"
python3 -m venv "$environment/venv"
"$environment/venv/bin/python" -m pip download --require-hashes --only-binary=:all: \
  -r "$environment/requirements-native.txt" -d "$environment/wheels" \
  > "$environment/python-download.log" 2>&1
"$environment/venv/bin/python" -m pip install --no-index \
  --find-links "$environment/wheels" --require-hashes \
  -r "$environment/requirements-native.txt" > "$environment/python-install.log" 2>&1
packages=(
  'libcgal-dev=5.6-1build3'
  'libboost1.83-dev=1.83.0-2.1ubuntu3.2'
  'libgmp-dev=2:6.3.0+dfsg-2ubuntu6.1'
  'libmpfr-dev=4.2.1-1build1.1'
)
apt-cache show "${packages[@]}" > "$environment/apt-package-metadata.txt"
(
  cd -- "$environment/debs"
  apt-get download "${packages[@]}" > "$environment/apt-download.log" 2>&1
  for package in *.deb; do
    dpkg-deb -x "$package" "$environment/prefix"
  done
)
python3 "$environment/freeze_environment.py" "$environment"
