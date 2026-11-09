# Raw SVG acceptance closure

SOURCE-REPAIRED; no execution or current artifact qualification claimed.
Independent BEFORE reviewf3b4770 (root ee24c74) found that the C11 acceptance
reader parsed raw XML directly. ElementTree omits processing instructions,
so tree-only checks could not certify the exporter's actual closed raw form.
This is an independent verifier coverage defect, not a demonstrated application
emission or public rendering incident.

C11 now requires the original byte cap (16MiB), strict UTF-8 decoding and no
NUL, declaration/comment opener `<!`, or processing-instruction opener `<?`
BEFORE parsing the resulting text. Counterbore already required UTF-8 and the
latter two exclusions; it now explicitly rejects NUL as well. This also prevents
implicit alternate XML encodings from bypassing the literal raw guard. No
production renderer change, accepted vocabulary expansion, geometry/paper/
caption criterion relaxation or historical result relabeling occurred.

The whole-workflow source custody already includes these actual oracle files;
next frozen packet must capture their current bytes. Qualification requires the
next coherent normal build, unchanged complete C11/counterbore public workflows,
FIRST independent checks and actual exported-artifact review. No parser probe,
synthetic abbreviated workflow, TSC, build or browser test was run for this
source edit. Earlier evidence retains its exact frozen checker bytes/results.
