# Retained tiny-box coordinate review

Run `python3 test/native-coordinate-quantization-review/check.py`.

This independently reads the genuine retained native Float64 mesh in
`test/exact-mesh-volume/cases.json`. Fraction arithmetic over its six endpoint
coordinates gives volume `6.000137061924313e-18`, exactly matching the recorded
native volume and the exact mesh integral. Each endpoint also equals the
ordinary binary64 result of adding its authored side length to `1e6`.

The ideal decimal side-length product is `6e-18`. The relative difference
`2.2843654052137795e-5` is fully explained here by global endpoint rounding.
This evidence does not demonstrate additional kernel construction error. It
does not remove the precision requirement: local geometry plus placement, or
an explicit accuracy/domain policy, still needs qualification before promising
arbitrary tiny features at large global coordinates.

The older global-origin mesh-volume error and separated-shell cancellation
are separate, demonstrated arithmetic defects. Exact integration repairs
their represented-coordinate integral; it cannot recover unrepresented
coordinates. No geometry, tolerance, source domain or acceptance threshold
was changed by this review. This is a retained-data analysis, not a new native
kernel execution or full numerical-robustness qualification.
