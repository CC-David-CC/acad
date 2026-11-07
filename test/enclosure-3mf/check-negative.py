#!/usr/bin/env python3
"""Mutation controls for the independent V1 export oracle, using a real output."""
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import runpy,sys

oracle=runpy.run_path(str(Path(__file__).with_name('check-3mf.py')))
check,ns=oracle['check'],oracle['NS']
source=Path(sys.argv[1])
with ZipFile(source) as archive: entries={name:archive.read(name) for name in archive.namelist()}
with TemporaryDirectory(prefix='codi-3mf-negative-') as directory:
 for mode in ('duplicate-mesh','translation','cycle'):
  root=ET.fromstring(entries['3D/3dmodel.model'])
  objects=root.findall('./c:resources/c:object',ns)
  meshes=[o for o in objects if o.find('c:mesh',ns) is not None]
  wrapper=next(o for o in objects if any(c.get('objectid')==meshes[1].get('id') for c in o.findall('./c:components/c:component',ns)))
  edge=wrapper.find('./c:components/c:component',ns)
  if mode=='duplicate-mesh':edge.set('objectid',meshes[0].get('id'))
  elif mode=='translation':edge.set('transform','1 0 0 0 1 0 0 0 1 1 0 0')
  else:edge.set('objectid',wrapper.get('id'))
  output=Path(directory)/(mode+'.3mf')
  with ZipFile(output,'w') as archive:
   for name,data in entries.items():archive.writestr(name,ET.tostring(root) if name=='3D/3dmodel.model' else data)
  try:check(output,100,ui='--ui' in sys.argv[2:])
  except AssertionError:print('PASS oracle rejects '+mode)
  else:raise AssertionError('Oracle accepted '+mode)
