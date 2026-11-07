// SPDX-License-Identifier: Apache-2.0
#include <SmSmlibAll.h>
#include <SmThreadLocalStorage.h>
#include <SmApiGeneral.h>
#include <SmApiPrimitives.h>
#include <SmApiQueries.h>
#include <cmath>
#include <cstdio>
#include <memory>
#include <stdexcept>
#include <vector>
static void Require(bool ok,const char* text){if(!ok)throw std::runtime_error(text);}
static void Check(SmStatus s){Require(s==SM_SUCCESS,"Native operation failed");}
struct Samples{SmExtent1d natural,step;std::vector<SmPoint3d> points,stepPoints;};
static Samples Capture(SmCurve* curve){Samples s;s.natural=curve->GetNaturalInterval();s.step=curve->GetSTEPInterval();for(int i=0;i<=16;i++){SmPoint3d p;Check(curve->EvaluatePoint(s.natural.Evaluate(i/16.0),p));s.points.push_back(p);Check(curve->EvaluateSTEPPoint(s.step.Evaluate(i/16.0),p));s.stepPoints.push_back(p);}return s;}
static void Mirrored(const Samples& before,SmCurve* after,const SmAxis2Placement& plane){
 const auto n=after->GetNaturalInterval(),s=after->GetSTEPInterval();Require(n.GetMin()==before.natural.GetMin()&&n.GetMax()==before.natural.GetMax()&&s.GetMin()==before.step.GetMin()&&s.GetMax()==before.step.GetMax(),"Mirror changed parameter domain");
 for(int i=0;i<=16;i++){SmPoint3d expected,actual;plane.MirrorPoint(before.points[i],expected);Check(after->EvaluatePoint(n.Evaluate(i/16.0),actual));Require(expected.DistanceBetween(actual)<1e-8,"NURBS sample does not match reflected source");plane.MirrorPoint(before.stepPoints[i],expected);Check(after->EvaluateSTEPPoint(s.Evaluate(i/16.0),actual));Require(expected.DistanceBetween(actual)<1e-8,"Analytic sample does not match reflected source");}
}
static void Standalone(SmCurve* curve,const SmAxis2Placement& plane,int type){
 const auto before=Capture(curve);SmCurve* result=nullptr;Check(curve->CreateMirrorCurve(*curve->GetContext(),plane,result));std::unique_ptr<SmCurve> owned(result);Require(result&&result->IsKindOf(type),"Mirror lost analytic type");Mirrored(before,result,plane);const auto retained=Capture(curve);for(int i=0;i<=16;i++)Require(retained.points[i].DistanceBetween(before.points[i])<1e-12,"Mirror changed retained original");
 SmCurve* restored=nullptr;Check(result->CreateMirrorCurve(*result->GetContext(),plane,restored));std::unique_ptr<SmCurve> restoredOwner(restored);Mirrored(Capture(result),restored,plane);const auto twice=Capture(restored);for(int i=0;i<=16;i++)Require(twice.points[i].DistanceBetween(before.points[i])<1e-8,"Two mirrors did not recover source");
}
static std::vector<double> Tolerances(SmBrep* brep){std::vector<double> out;SmTArray<SmVertex*> v;SmTArray<SmEdge*> e;SmTArray<SmFace*> f;brep->GetVertices(v);brep->GetEdges(e);brep->GetFaces(f);for(auto* x:v)out.push_back(SmTol::GetZoneTol3d(x));for(auto* x:e)out.push_back(SmTol::GetZoneTol3d(x));for(auto* x:f)out.push_back(SmTol::GetZoneTol3d(x));return out;}
extern "C" int run_extended(int mode){
 SmThreadLocalStorage::SetupTLS(SM_TLS_PROCESS_ATTACH);SmApiCreateContext();
 try{
  Require(mode>=0&&mode<=2,"Invalid extended test mode");
  const auto* context=SmApiGetOrCreateContext();SmAxis2Placement plane(SmVector3d(2,-3,4),SmVector3d(1,1,0),SmVector3d(-1,1,2));
  // Make the plane orthonormal using a simple arbitrary orientation.
  Check(plane.SetCanonical(SmVector3d(2,-3,4),SmVector3d(0,1,0),SmVector3d(0.6,0,0.8)));
  if(mode!=2){
  for(bool insideOut:{false,true}){SmCircle circle(SmPoint3d(3,4,5),SmVector3d(1,0,0),SmVector3d(0,1,0),SmExtent1d(20,250),3,3,context,nullptr,insideOut);Standalone(&circle,plane,SmCircle_TYPE);SmEllipse ellipse(SmPoint3d(3,4,5),SmVector3d(1,0,0),SmVector3d(0,1,0),SmExtent1d(20,250),3,2,3,context,nullptr,insideOut);Standalone(&ellipse,plane,SmEllipse_TYPE);}
  SmLine line(SmPoint3d(3,4,5),SmVector3d(1,0,0),SmExtent1d(-2,8),2,3,context);Standalone(&line,plane,SmLine_TYPE);
  for(int kind=0;kind<2;kind++){
   SmBrep* raw=nullptr;Check(kind==0?SmApiCreateBox(SmVector3d(0,0,0),10,12,14,raw):SmApiCreateCylinder(SmVector3d(0,0,0),5,10,raw));std::unique_ptr<SmBrep> owner(raw);Require(raw->AssertValid(nullptr,SM_LEVEL_2),"Original primitive invalid");double beforeVolume=0,afterVolume=0;Check(SmApiBrepComputeVolume(raw,1e-6,beforeVolume));
   SmTArray<SmEdge*> edges;raw->GetEdges(edges);std::vector<Samples> samples;std::vector<int> types;for(auto* edge:edges){auto* c=edge->GetCurve();samples.push_back(Capture(c));types.push_back(c->IsKindOf(SmLine_TYPE)?SmLine_TYPE:SmCircle_TYPE);}
   Check(raw->Mirror(plane));Require(raw->AssertValid(nullptr,SM_LEVEL_2),"Mirrored primitive invalid");Check(SmApiBrepComputeVolume(raw,1e-6,afterVolume));Require(std::abs(beforeVolume-afterVolume)<1e-6,"Mirror changed primitive volume");for(unsigned i=0;i<edges.GetSize();i++){Require(edges[i]->GetCurve()->IsKindOf(types[i]),"Mirrored primitive lost analytic curve");Mirrored(samples[i],edges[i]->GetCurve(),plane);}
  }
  }
  if(mode!=1)for(int mode=0;mode<5;mode++){
   SmBrep* raw=nullptr;Check(SmApiCreateTorus(SmVector3d(0,0,0),5,1,raw));std::unique_ptr<SmBrep> owner(raw);SmTArray<SmVertex*> vertices;raw->GetVertices(vertices);SM_OLDTOL_LINE vertices[0]->SetTolerance(1e-3,FALSE,FALSE);
   const auto before=Tolerances(raw);const double contextBefore=SmTol::GetZoneTol3d(context),contextSizeBefore=SmTol::GetModelSizeEstimate(*context);double m[4][4]={{1,0,0,0},{0,1,0,0},{0,0,1,0},{4,5,6,1}};double scale=1;
   if(mode==1){m[0][0]=m[1][1]=m[2][2]=2;scale=2;}if(mode==2){m[0][0]=2;m[1][1]=3;m[2][2]=4;scale=4;}if(mode==3){m[0][0]=m[1][1]=m[2][2]=0.5;scale=0.5;}if(mode==4){m[0][0]=m[1][1]=m[2][2]=2;}
   Check(raw->Transform(m,mode==4?FALSE:TRUE));const auto after=Tolerances(raw);Require(after.size()==before.size(),"Transform changed entity count");for(unsigned i=0;i<before.size();i++)Require(after[i]>0&&std::abs(after[i]-before[i]*scale)<1e-12,"Transform failed to preserve/scale local tolerance");Require((double)SmTol::GetZoneTol3d(context)==contextBefore,"Transform changed shared context tolerance");Require(SmTol::GetModelSizeEstimate(*context)==contextSizeBefore,"Transform changed shared context model size");
  }
  std::printf("PASS %s (selected mode %d)\n",mode==1?"mirrors: translated oblique planes, partial/inside-out analytic curves, exact domains/samples, retained source, primitive validity/volume":mode==2?"tolerances: raised local values, nonuniform/shrink/disabled scaling, exact shared-context size and tolerance":"combined mirror and tolerance controls",mode);return 0;
 }catch(const std::exception& e){std::fprintf(stderr,"FAIL %s\n",e.what());return 1;}
}
