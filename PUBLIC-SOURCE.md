# ACAD public source

This export includes ACAD source, build definitions, and the test inputs and runners outside archived
evidence directories. Generated evidence captures and internal operational handoffs are held with the
original local project. Tests that compare against particular archived runs require those receipts or
a newly generated run.

Run the project commands documented in [README.md](README.md) from a locked dependency install.
Preparing the older WebOS browser package also requires the exact source revisions and checked
artifacts listed by [webos/prepare.py](webos/prepare.py). Supply those Git sources with `--repo`
and `--worker-engine-repo` and provide the other pinned inputs accepted by the preparer. This
checkout provides the ACAD source and the build recipe. The historical external input pins have
independent provenance and availability requirements.
