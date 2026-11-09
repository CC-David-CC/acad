# C11 R4 actual anchor-domain diagnostic

Read-only actual-observation/source diagnostic; no renderer import, route search,
tests, oracle, build, Native or browser execution. Failed whole remains FAIL.
Input R730 `/mnt/data10tb/codi-acad-drawing-requirements-20261109-r4/whole/receipt.json`,
SHA256 `a89b4b9d1be10fd73b258bd968ae82fda8eb41adfa22e59ed12fcac7fdaca6d2`.
It records Core `82866bf0ee852f1d3b3892972f07d8af4cd8b9b0`, Host
`6b2a1fbe806175bddafa6c0e0f54c486487d1749`,70 rows/875 commands,
33 Native observations,2 saves/fresh Opens. Source pins bind requirementForms
`93a9d07961ee9511ff89a6225c32b50fd71f397f0028add4ab3eaa79e7b52f73`
and linkedPartDrawingSvg
`500bd59c805f341a54ef056a0b93fb1e6c328fdd24a03d64b161c0238638d189`.

Exact addresses are `observations[32]` (last observation), its `definition`,
`read.observation` and `projection.observation`, and `commands[874]`.
The last row is “Actual discovered repair resolves finite bore end”. All six
datum/requirement rows are available with actual protected quality/facts. Full
projection has available top/front/right rows. Final export refuses
RESOURCE_LIMIT, committed:false, “The actual requirement anchor or port has no
clear supported paper domain.” No repaired SVG was produced by this whole.
Context/write settlement is a separate Root-owned reconciliation.

The exact source cause is confirmed. `linkedPartDrawingSvg.mjs:39,108–109`
declares the successful authored height label `[80,70]`, value30, as text
`ΔY 30.000 mm` with box `[79,66]..[117,72]`. Actual lower datum-A and finish
plane anchors both equal `[0,30,0]`; top frame is origin0/uX/vY and paper
origin `[100,100]`, scale1. Both therefore start at `[100,70]`, strictly inside
that text box and its exact half-stroke expansion
`[78.875,65.875]..[117.125,72.125]`. RequirementForms:58–60 refuses this start
before any graph search. Datum-A is first in processing order, explaining the
observed first failure; finish would independently have the same blocked start.
A path cannot clear an open obstacle containing its fixed initial point.

All current anchors/ports/frame boxes, directly from the actual facts and the
unchanged private projection/frame sizing rules (paper millimeters):

|ID|Native anchor|Paper start|Own frame min..max|Unchanged port/side|
|---|---|---|---|---|
|datum-A|0,30,0|100,70|279,36 ..287,42|279,39 left|
|datum-B|0,0,25|100,215|39,186 ..47,192|47,189 right|
|datum-C|0,0,25|350,215|509,236 ..517,242|509,239 left|
|position-zone|75,15,0|175,85|339,66 ..388,72|339,69 left|
|finish-Ra|0,30,0|100,70|339,106 ..366.2,112|339,109 left|
|declared-fit|81,15,12.5|181,85|339,156 ..418.4,192|339,174 left|

Every start and port is finite and within the594×420 sheet inset.125; every
start is outside its own closed frame and in the strict selected-side exterior.
The other four starts and all six ports avoid the four actual dimension text
boxes and other requirement frames. Those dimension boxes are width
`[174,116]..[215,122]`, height as above, depth
`[269,216]..[307,222]`, nominal-hole `[179,56]..[211,62]`.
The last successful same-geometry cap-loss SVG has caption boxes top
`[100,105.25]..[107.4,111.25]`, front
`[100,245.25]..[111,251.25]`, right
`[350,245.25]..[361,251.25]`; none contains a listed start or port.
This does not certify a new repaired export or a complete route.

There is a substantive nontrivial route requirement after initially authoring
the height label left of the view: the unchanged datum-A direct segment
`[100,70]→[279,39]` crosses the nominal-hole text box. At x180 its exact
y=`10050/179` (about56.14525), strictly inside `[179,56]..[211,62]` and the
expanded obstacle. Thus moving the initial height label does not make this
repair a trivial direct-line pass. Keep the same labels throughout actual
repair, require a genuine routed leader and all segment/port/sheet inequalities
in the next complete whole. No other endpoint-domain blocker is identified in
this retained observation; future route/resource/export success is unobserved.
