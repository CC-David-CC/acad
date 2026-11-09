"""Independent represented-value requirement arithmetic; AFTER WHOLE only.

No production schema/math/geometry imports. These checks authenticate no Native
membership: the caller must independently prove source/support/bore custody.
Authored requirements, CAD nominal observations and declared mating intent are
separate inputs; no manufacturing conformance result is produced.
"""
import math
from fractions import Fraction

def need(ok,message):
 if not ok:raise ValueError(message)

def number(value):
 need(type(value) in (int,float) and math.isfinite(value),'finite own numeric requirement value, not bool/string')
 return Fraction.from_float(float(value))

def fields(value,keys):
 need(type(value) is dict and set(value)==set(keys),'exact independent quantity/fact fields')
 return value

def rounded(observed,exact,label):
 """One correctly rounded binary64 primitive, with its exact represented inputs."""
 q=number(observed);ulp=Fraction.from_float(math.ulp(float(observed)))
 error=abs(q-exact);need(error<=ulp/2,label+' retains primitive arithmetic accuracy within half an ULP')
 return {'exactRepresentedInputResult':str(exact),'observed':observed,'absoluteError':str(error),'halfUlp':str(ulp/2)}

def raw_contract(definition):
 requirements=definition['requirements'];datums=definition['datumFeatures']
 need(definition['version']==4 and [d['symbol'] for d in datums]==['A','B','C'],'actual v4 and ordered authored datums')
 need(len(requirements)==3 and len({r['kind'] for r in requirements})==3,'all three distinct literal requirement kinds')
 bykind={r['kind']:r for r in requirements}
 position=bykind['position-tolerance'];finish=bykind['surface-finish'];fit=bykind['clearance-fit']
 need(set(position['zone'])=={'kind','value','unit'} and position['zone']['kind']=='diameter' and position['zone']['unit']=='millimeter' and position['zone']['value'] in (0.20,0.25) and position['datumSymbols']==['A','B','C'],'frozen authored0.20/explicit edit0.25mm diameter zones and ordered datum intent')
 need(finish['parameter']=='Ra' and finish['maximum']=={'value':3.2,'unit':'micrometer'},'one exact raw Ra3.2 micrometer requirement, no stored mm value')
 need(fit['unit']=='millimeter' and fit['hole']=={'lowerDeviation':0,'upperDeviation':0.015} and fit['declaredShaft']=={'lowerDeviation':-0.020,'upperDeviation':-0.005},'exact required hole and DECLARED shaft deviations')
 nominal=[d for d in definition['dimensions'] if d['dimensionId']==fit['nominalDimensionId']]
 need(len(nominal)==1 and nominal[0]['kind']=='hole-diameter','same-definition live hole nominal, not a copied scalar')
 return bykind

def quantity_math(definition,observation,expected_nominal,incidence_mm):
 bykind=raw_contract(definition)
 need(type(incidence_mm) in (int,float) and incidence_mm==1e-7,'unchanged named Native reference incidence budget')
 need(len(observation['requirements'])==3,'complete actual requirement fact roster')
 result={'role':'authored-manufacturing-requirement','measurementScope':'nominal-cad-reference-only','requirements':[]}
 for authored,row in zip(definition['requirements'],observation['requirements']):
  need(row['annotationId']==authored['annotationId'] and row['kind']==authored['kind'] and row['requirementRole']=='authored-manufacturing-requirement','exact ordered authored requirement association')
  if row['status']=='unresolved':
   need(row['quality'] is None and row['facts'] is None and type(row['reason']) is str and 0<len(row['reason'])<=256,'unresolved facts never impersonate a measurement')
   result['requirements'].append({'annotationId':row['annotationId'],'status':'unresolved','reason':row['reason']});continue
  need(row['status']=='available' and row['quality']=='native-bound-requirement-reference' and row['reason'] is None,'resolved geometry binding only')
  f=row['facts'];kind=row['kind'];checked={'annotationId':row['annotationId'],'status':'geometry-binding-resolved'}
  if kind=='position-tolerance':
   fields(f,('datumFrame','axisPoint','axisDirection','axisEnds','diameter','coordinates','anchor'))
   need(abs(number(f['diameter'])-number(expected_nominal))<=number(incidence_mm),'actual nominal diameter bound independently to saved source')
   checked['authoredZoneMm']=authored['zone']['value']
  elif kind=='surface-finish':
   fields(f,('support','anchor','maximumMillimeters'));need(f['maximumMillimeters']>0,'positive finite derived roughness requirement')
   checked['canonicalRequirementMillimeters']=rounded(f['maximumMillimeters'],number(authored['maximum']['value'])/1000,'raw micrometers/1000')
  else:
   fields(f,('nominalDimensionId','nominalDiameter','holeLimits','declaredShaftLimits','clearance','anchor'))
   need(f['nominalDimensionId']==authored['nominalDimensionId'],'live nominal dimension identity, not a label')
   N=number(f['nominalDiameter']);need(abs(N-number(expected_nominal))<=number(incidence_mm),'finite Native nominal matches independent source diameter')
   for key in ('holeLimits','declaredShaftLimits'):need(type(f[key]) is list and len(f[key])==2 and all(number(v)>0 for v in f[key]),'actual positive ordered physical size limits')
   H=authored['hole'];S=authored['declaredShaft']
   checked['requiredHole']=[rounded(f['holeLimits'][0],N+number(H['lowerDeviation']),'nominal+hole lower'),rounded(f['holeLimits'][1],N+number(H['upperDeviation']),'nominal+hole upper')]
   checked['declaredShaft']=[rounded(f['declaredShaftLimits'][0],N+number(S['lowerDeviation']),'nominal+DECLARED shaft lower'),rounded(f['declaredShaftLimits'][1],N+number(S['upperDeviation']),'nominal+DECLARED shaft upper')]
   fields(f['clearance'],('minimum','maximum','unit'));need(f['clearance']['unit']=='millimeter','explicit clearance canonical unit')
   checked['requiredClearance']=[rounded(f['clearance']['minimum'],number(H['lowerDeviation'])-number(S['upperDeviation']),'common-nominal-cancelled minimum'),rounded(f['clearance']['maximum'],number(H['upperDeviation'])-number(S['lowerDeviation']),'common-nominal-cancelled maximum')]
   # Normative decimal design values supplement (do not replace) represented
   # primitive arithmetic. Their input representation error is explicit.
   ideal=[Fraction('0.005'),Fraction('0.035')];raw=[number(H['lowerDeviation'])-number(S['upperDeviation']),number(H['upperDeviation'])-number(S['lowerDeviation'])]
   checked['decimalDesignClearance']=[{'idealMm':str(x),'representedInputDifferenceMm':str(q),'inputRepresentationErrorMm':str(abs(x-q))} for x,q in zip(ideal,raw)]
  result['requirements'].append(checked)
 return result
