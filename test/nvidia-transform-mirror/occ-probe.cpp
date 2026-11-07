// SPDX-License-Identifier: Apache-2.0
#include <BRepPrimAPI_MakeTorus.hxx>
#include <BRepPrimAPI_MakeBox.hxx>
#include <BRepPrimAPI_MakeCylinder.hxx>
#include <BRepBuilderAPI_Transform.hxx>
#include <BRepAdaptor_Curve.hxx>
#include <BRepCheck_Analyzer.hxx>
#include <BRepGProp.hxx>
#include <GProp_GProps.hxx>
#include <BRep_Tool.hxx>
#include <TopExp.hxx>
#include <TopoDS.hxx>
#include <TopTools_IndexedMapOfShape.hxx>
#include <Standard_Version.hxx>
#include <gp_Ax2.hxx>
#include <gp_Ax1.hxx>
#include <gp_Trsf.hxx>
#include <cmath>
#include <cstdio>
#include <stdexcept>
struct Result {double vMin,vMax,eMin,eMax,fMin,fMax;int vertices,edges,faces,lines,circles,bsplines,other;double volume;bool valid;};
static Result Inspect(const char* name,const char* phase,const TopoDS_Shape& shape){
 Result r={};r.vMin=r.eMin=r.fMin=1e100;TopTools_IndexedMapOfShape vertices,edges,faces;
 TopExp::MapShapes(shape,TopAbs_VERTEX,vertices);TopExp::MapShapes(shape,TopAbs_EDGE,edges);TopExp::MapShapes(shape,TopAbs_FACE,faces);
 r.vertices=vertices.Extent();r.edges=edges.Extent();r.faces=faces.Extent();
 for(int i=1;i<=vertices.Extent();i++){double t=BRep_Tool::Tolerance(TopoDS::Vertex(vertices(i)));r.vMin=std::fmin(r.vMin,t);r.vMax=std::fmax(r.vMax,t);}
 for(int i=1;i<=edges.Extent();i++){auto e=TopoDS::Edge(edges(i));double t=BRep_Tool::Tolerance(e);r.eMin=std::fmin(r.eMin,t);r.eMax=std::fmax(r.eMax,t);auto type=BRepAdaptor_Curve(e).GetType();if(type==GeomAbs_Line)r.lines++;else if(type==GeomAbs_Circle)r.circles++;else if(type==GeomAbs_BSplineCurve)r.bsplines++;else r.other++;}
 for(int i=1;i<=faces.Extent();i++){double t=BRep_Tool::Tolerance(TopoDS::Face(faces(i)));r.fMin=std::fmin(r.fMin,t);r.fMax=std::fmax(r.fMax,t);}
 GProp_GProps properties;BRepGProp::VolumeProperties(shape,properties);r.volume=properties.Mass();r.valid=BRepCheck_Analyzer(shape).IsValid();
 std::printf("{\"name\":\"%s\",\"phase\":\"%s\",\"version\":\"%s\",\"vertices\":%d,\"edges\":%d,\"faces\":%d,\"vertexTolerance\":[%.17g,%.17g],\"edgeTolerance\":[%.17g,%.17g],\"faceTolerance\":[%.17g,%.17g],\"lines\":%d,\"circles\":%d,\"bsplines\":%d,\"other\":%d,\"volume\":%.17g,\"valid\":%s}\n",name,phase,OCC_VERSION_COMPLETE,r.vertices,r.edges,r.faces,r.vMin,r.vMax,r.eMin,r.eMax,r.fMin,r.fMax,r.lines,r.circles,r.bsplines,r.other,r.volume,r.valid?"true":"false");return r;
}
static void Require(bool ok){if(!ok)throw std::runtime_error("OCCT transform/mirror invariant failed");}
int main(){
 try{
  for(int i=0;i<7;i++){
   const char* names[]={"torus-translation","torus-rotation","torus-scale2","torus-identity","torus-mirror","box-mirror","cylinder-mirror"};
   TopoDS_Shape source=i==5?BRepPrimAPI_MakeBox(10,12,14).Shape():i==6?BRepPrimAPI_MakeCylinder(5,10).Shape():BRepPrimAPI_MakeTorus(5,1).Shape();
   const auto before=Inspect(names[i],"before",source);gp_Trsf t;
   if(i==0)t.SetTranslation(gp_Vec(4,5,6));else if(i==1)t.SetRotation(gp_Ax1(gp_Pnt(0,0,0),gp_Dir(0,0,1)),std::acos(-1.0)/2);else if(i==2)t.SetScale(gp_Pnt(0,0,0),2);else if(i>=4)t.SetMirror(gp_Ax2(gp_Pnt(0,0,0),gp_Dir(1,0,0)));
   // Force copied geometry even for rigid transforms; do not prove only location reassignment.
   const auto output=BRepBuilderAPI_Transform(source,t,Standard_True).Shape();const auto after=Inspect(names[i],"after",output);const auto retained=Inspect(names[i],"retained-input",source);
   const double scale=i==2?2:1;
   Require(before.valid&&after.valid&&retained.valid&&after.vMin>0&&after.eMin>0&&after.fMin>0);
   Require(std::abs(after.vMin-before.vMin*scale)<1e-14&&std::abs(after.eMin-before.eMin*scale)<1e-14&&std::abs(after.fMin-before.fMin*scale)<1e-14);
   Require(after.lines==before.lines&&after.circles==before.circles&&after.bsplines==before.bsplines&&after.vertices==before.vertices&&after.edges==before.edges&&after.faces==before.faces);
   Require(std::abs(after.volume-before.volume*scale*scale*scale)<1e-7&&retained.volume==before.volume&&retained.vMin==before.vMin&&retained.lines==before.lines&&retained.circles==before.circles);
  }
  std::printf("PASS OCCT torus tolerances, mirrored analytic types, validity, volume and retained inputs\n");return 0;
 }catch(const std::exception& error){std::fprintf(stderr,"%s\n",error.what());return 1;}
}
