"""Independent exact rational expectations; no production implementation imports."""
from fractions import Fraction as F
import json
import math
from pathlib import Path
import random

rng = random.Random(8675309)
q = F.from_float
def determinant(a, b, c):
    # Absolute-coordinate six-product formula rather than translated cross.
    x, y, u, v, s, t = map(q, [*a, *b, *c])
    return x*v + u*t + s*y - y*u - v*s - t*x
def sign(x):
    return (x > 0) - (x < 0)

orientations = []
for _ in range(1200):
    points = [[math.ldexp(rng.randrange(-2**52, 2**52), rng.randrange(-1074, -32)) for _ in range(2)] for _ in range(3)]
    orientations.append({'points': points, 'expected': sign(determinant(*points))})

areas = []
def area_case(name, vertices):
    exact = abs(sum(q(a[0])*q(b[1])-q(a[1])*q(b[0]) for a,b in zip(vertices,vertices[1:]+vertices[:1])))/2
    areas.append({'name': name, 'vertices': vertices, 'area': float(exact), 'sign': sign(determinant(*vertices)), 'exact': str(exact)})

area_case('subnormal double-round4-to5', [[0.,0.],[(1+2**-52)*2.**-500,0.],[0.,(1.125-2**-52)*2.**-571]])
area_case('subnormal double-round0-to1', [[0.,0.],[(1+2**-52)*2.**-500,0.],[0.,(1-2**-53)*2.**-574]])
for i in range(180):
    x = math.ldexp(rng.randrange(2**51, 2**52), rng.randrange(-1000,-34))
    y = math.ldexp(rng.randrange(2**51, 2**52), rng.randrange(-1000,-34))
    area_case(f'power-scaled-product-{i}', [[0.,0.],[x,0.],[0.,y]])

out = {'oracle': 'Python fractions.Fraction.from_float with correctly rounded float(Fraction); six-product orientation and shoelace area', 'orientations': orientations, 'areas': areas}
Path(__file__).with_name('fixtures.json').write_text(json.dumps(out, indent=2)+'\n')
