"""Inspect retained native vertices; this does not execute a kernel."""
from fractions import Fraction
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[2]
cases = json.loads((root / 'test/exact-mesh-volume/cases.json').read_text())
case = next(row for row in cases if row['id'] == 'recorded-native:tiny-large-origin')
axes = [sorted(set(case['positions'][axis::3])) for axis in range(3)]
assert all(len(axis) == 2 for axis in axes)
lengths = [Fraction(axis[1]) - Fraction(axis[0]) for axis in axes]
volume = math.prod(lengths)
nominal = Fraction(6, 10**18)
endpoint_matches = [axis[1] == 1e6 + length
                    for axis, length in zip(axes, [1e-6, 2e-6, 3e-6])]
assert float(volume) == case['nativeVolume']
assert all(endpoint_matches)
print(json.dumps({
    'status': 'PASS',
    'scope': 'Independent analysis of retained coordinates, not fresh kernel execution or an accuracy-policy qualification',
    'originUlp': math.ulp(1e6),
    'representedSideLengths': [float(length) for length in lengths],
    'representedVolume': float(volume),
    'recordedNativeVolume': case['nativeVolume'],
    'exactNativeMatch': True,
    'relativeErrorVersusDecimalNominal': float((volume - nominal) / nominal),
    'geometryEndpointConstructionMatches': endpoint_matches,
    'interpretation': 'Recorded box is exactly consistent with the rounded binary64 global endpoints; ideal dimension-product difference alone is not evidence of an additional kernel defect.'
}, indent=2))
