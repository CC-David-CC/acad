// SPDX-License-Identifier: Apache-2.0
#include <SmSmlibAll.h>
#include <SmThreadLocalStorage.h>
#include <SmApiGeneral.h>
#include <SmApiPrimitives.h>
#include <cmath>
#include <cstdio>
#include <memory>
static void Inspect(const char* phase, SmBrep* brep) {
 SmTArray<SmVertex*> vertices; SmTArray<SmEdge*> edges; SmTArray<SmFace*> faces; SmTArray<SmCurve*> curves;
 brep->GetVertices(vertices); brep->GetEdges(edges); brep->GetFaces(faces); brep->GetCurves(curves);
 double vMin=1e100,vMax=0,eMin=1e100,eMax=0,fMin=1e100,fMax=0;
 for(auto* v:vertices){double t=SmTol::GetZoneTol3d(v);vMin=std::fmin(vMin,t);vMax=std::fmax(vMax,t);}
 for(auto* e:edges){double t=SmTol::GetZoneTol3d(e);eMin=std::fmin(eMin,t);eMax=std::fmax(eMax,t);}
 for(auto* f:faces){double t=SmTol::GetZoneTol3d(f);fMin=std::fmin(fMin,t);fMax=std::fmax(fMax,t);}
 unsigned lines=0,circles=0,otherBSplines=0,other=0;
 for(auto* c:curves){if(c->IsKindOf(SmLine_TYPE))lines++;else if(c->IsKindOf(SmCircle_TYPE))circles++;else if(c->IsKindOf(SmBSplineCurve_TYPE))otherBSplines++;else other++;}
 std::printf("{\"phase\":\"%s\",\"vertices\":%lu,\"edges\":%lu,\"faces\":%lu,\"vertexTolerance\":[%.17g,%.17g],\"edgeTolerance\":[%.17g,%.17g],\"faceTolerance\":[%.17g,%.17g],\"lines\":%u,\"circles\":%u,\"otherBSplines\":%u,\"otherCurves\":%u}\n",phase,(unsigned long)vertices.GetSize(),(unsigned long)edges.GetSize(),(unsigned long)faces.GetSize(),vMin,vMax,eMin,eMax,fMin,fMax,lines,circles,otherBSplines,other);
}
extern "C" int run_probe(int mode) {
 SmThreadLocalStorage::SetupTLS(SM_TLS_PROCESS_ATTACH); SmApiCreateContext();
 SmBrep* raw=nullptr; SmStatus status;
 if(mode==6)status=SmApiCreateBox(SmVector3d(0,0,0),10,12,14,raw);
 else if(mode==7)status=SmApiCreateCylinder(SmVector3d(0,0,0),5,10,raw);
 else status=SmApiCreateTorus(SmVector3d(0,0,0),5,1,raw);
 if(status!=SM_SUCCESS||!raw){std::printf("{\"createStatus\":%d}\n",(int)status);return 1;}
 std::unique_ptr<SmBrep> owner(raw); Inspect("before",raw);
 double m[4][4]={{1,0,0,0},{0,1,0,0},{0,0,1,0},{0,0,0,1}};
 if(mode==0){m[3][0]=4;m[3][1]=5;m[3][2]=6;status=raw->Transform(m);}
 else if(mode==1||mode==4){m[0][0]=0;m[0][1]=1;m[1][0]=-1;m[1][1]=0;status=raw->Transform(m,mode==4?FALSE:TRUE);}
 else if(mode==2){m[0][0]=m[1][1]=m[2][2]=2;status=raw->Transform(m);}
 else if(mode==3){SmAxis2Placement placement(SmVector3d(0,0,0),SmVector3d(0,1,0),SmVector3d(-1,0,0));status=raw->Transform(placement);}
 else if(mode==5)status=raw->Transform(m);
 else {SmAxis2Placement mirror(SmVector3d(0,0,0),SmVector3d(0,1,0),SmVector3d(0,0,1));status=raw->Mirror(mirror);}
 std::printf("{\"mode\":%d,\"operationStatus\":%d}\n",mode,(int)status);Inspect("after",raw);
 return status==SM_SUCCESS?0:2;
}
