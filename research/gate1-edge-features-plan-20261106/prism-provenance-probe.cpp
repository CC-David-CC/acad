#include "profilePrismProvenanceV1.hpp"
#include <BRepBuilderAPI_MakeVertex.hxx>
#include <BRepBuilderAPI_MakeEdge.hxx>
#include <BRepBuilderAPI_MakeWire.hxx>
#include <BRepBuilderAPI_MakeFace.hxx>
#include <BRepPrimAPI_MakePrism.hxx>
#include <BRepCheck_Analyzer.hxx>
#include <BRepGProp.hxx>
#include <GProp_GProps.hxx>
#include <TopExp.hxx>
#include <TopoDS.hxx>
#include <TopTools_IndexedMapOfShape.hxx>
#include <TopTools_ListIteratorOfListOfShape.hxx>
#include <gp_Pln.hxx>
#include <gp_Circ.hxx>
#include <gp_Ax3.hxx>
#include <iostream>
#include <iomanip>
#include <cmath>
#include <stdexcept>
#include <vector>
#include <set>
void require(bool v){if(!v)throw std::runtime_error("PRISM_PROVENANCE_FAILED");}
int member(const TopTools_IndexedMapOfShape& map,const TopoDS_Shape& s){return s.IsNull()?0:map.FindIndex(s);}
int generated(BRepPrimAPI_MakePrism& prism,const TopoDS_Shape& source,const TopTools_IndexedMapOfShape& output){
 int n=0,index=0;for(TopTools_ListIteratorOfListOfShape it(prism.Generated(source));it.More();it.Next()){index=member(output,it.Value());require(index>0);++n;}require(n==1);return index;
}
void run(const char* name,bool shared,bool concave,bool hole,bool oblique,bool polygonHole=false){
 const gp_Pnt origin=oblique?gp_Pnt(7,11,13):gp_Pnt(0,0,0);const gp_Vec x=oblique?gp_Vec(0,1,0):gp_Vec(1,0,0),y=oblique?gp_Vec(0,0,1):gp_Vec(0,1,0),z=oblique?gp_Vec(1,0,0):gp_Vec(0,0,1);
 const double u[]={0,60,60,30,0},v[]={0,0,40,20,40};const int count=concave?5:4;
 std::vector<gp_Pnt> points;std::vector<TopoDS_Vertex> vertices;std::vector<TopoDS_Edge> original,added;
 for(int i=0;i<count;i++){const int j=concave?i:(i==3?4:i);points.push_back(origin.Translated(x*u[j]+y*v[j]));if(shared)vertices.push_back(BRepBuilderAPI_MakeVertex(points.back()).Vertex());}
 BRepBuilderAPI_MakeWire wire;
 for(int i=0;i<count;i++){const int j=(i+1)%count;BRepBuilderAPI_MakeEdge edge=shared?BRepBuilderAPI_MakeEdge(vertices[i],vertices[j]):BRepBuilderAPI_MakeEdge(points[i],points[j]);require(edge.IsDone());original.push_back(edge.Edge());wire.Add(edge.Edge());require(wire.IsDone());added.push_back(wire.Edge());}
 TopTools_IndexedMapOfShape wireEdges;TopExp::MapShapes(wire.Wire(),TopAbs_EDGE,wireEdges);int originalRetained=0,addedRetained=0;
 for(int i=0;i<count;i++){originalRetained+=member(wireEdges,original[i])>0;addedRetained+=member(wireEdges,added[i])>0;}
 require(addedRetained==count);if(shared)require(originalRetained==count);
 BRepBuilderAPI_MakeFace face(gp_Pln(gp_Ax3(origin,gp_Dir(z),gp_Dir(x))),wire.Wire(),true);require(face.IsDone());TopoDS_Edge circle;
 if(hole){BRepBuilderAPI_MakeEdge edge(gp_Circ(gp_Ax2(origin.Translated(x*15+y*15),gp_Dir(z),gp_Dir(x)),3));require(edge.IsDone());circle=edge.Edge();BRepBuilderAPI_MakeWire circleWire(circle);require(circleWire.IsDone());TopoDS_Wire reversed=circleWire.Wire();reversed.Reverse();face.Add(reversed);require(face.IsDone());}
 std::vector<TopoDS_Vertex> holeVertices;std::vector<TopoDS_Edge> holeEdges;
 if(polygonHole){const double hu[]={35,45,45,35},hv[]={5,5,10,10};for(int i=0;i<4;i++)holeVertices.push_back(BRepBuilderAPI_MakeVertex(origin.Translated(x*hu[i]+y*hv[i])).Vertex());BRepBuilderAPI_MakeWire inner;for(int i=0;i<4;i++){holeEdges.push_back(BRepBuilderAPI_MakeEdge(holeVertices[i],holeVertices[(i+1)%4]).Edge());inner.Add(holeEdges.back());require(inner.IsDone());}TopoDS_Wire reversed=inner.Wire();reversed.Reverse();face.Add(reversed);require(face.IsDone());}
 require(BRepCheck_Analyzer(face.Face()).IsValid());TopTools_IndexedMapOfShape sourceEdges,sourceVertices;TopExp::MapShapes(face.Face(),TopAbs_EDGE,sourceEdges);TopExp::MapShapes(face.Face(),TopAbs_VERTEX,sourceVertices);
 for(int i=0;i<count;i++){require(member(sourceEdges,added[i])>0);if(shared)require(member(sourceVertices,vertices[i])>0);}
 if(hole)require(member(sourceEdges,circle)>0);
 BRepPrimAPI_MakePrism prism(face.Face(),z*7,true,true);prism.Build();require(prism.IsDone()&&BRepCheck_Analyzer(prism.Shape()).IsValid());
 TopTools_IndexedMapOfShape resultEdges,resultFaces,resultVertices;TopExp::MapShapes(prism.Shape(),TopAbs_EDGE,resultEdges);TopExp::MapShapes(prism.Shape(),TopAbs_FACE,resultFaces);TopExp::MapShapes(prism.Shape(),TopAbs_VERTEX,resultVertices);
 require(member(resultFaces,prism.FirstShape())>0&&member(resultFaces,prism.LastShape())>0&&!prism.FirstShape().IsSame(prism.LastShape()));
 int caps=0,sides=0,connectors=0,originalUsed=0,sourcePreserved=0;std::set<int> capKeys,sideKeys,connectorKeys;
 for(int i=0;i<count;i++){
  const TopoDS_Edge edge=added[i];const int a=member(resultEdges,prism.FirstShape(edge)),b=member(resultEdges,prism.LastShape(edge));require(a>0&&b>0&&a!=b);require(capKeys.insert(a).second&&capKeys.insert(b).second);caps+=2;require(sideKeys.insert(generated(prism,edge,resultFaces)).second);++sides;
  originalUsed+=!prism.IsDeleted(original[i]);sourcePreserved+=member(resultEdges,edge)>0;
 }
 if(shared)for(int i=0;i<count;i++){const TopoDS_Vertex vertex=vertices[i];const int a=member(resultVertices,prism.FirstShape(vertex)),b=member(resultVertices,prism.LastShape(vertex));require(a>0&&b>0&&a!=b);const int connector=generated(prism,vertex,resultEdges);require(!capKeys.count(connector)&&connectorKeys.insert(connector).second);++connectors;}
 if(hole){const int a=member(resultEdges,prism.FirstShape(circle)),b=member(resultEdges,prism.LastShape(circle));require(a>0&&b>0&&a!=b&&!capKeys.count(a)&&!capKeys.count(b)&&!sideKeys.count(generated(prism,circle,resultFaces)));}
 GProp_GProps volume;BRepGProp::VolumeProperties(prism.Shape(),volume);const double area=(concave?1800:2400)-(hole?std::acos(-1.)*9:0)-(polygonHole?50:0);require(std::abs(volume.Mass()-area*7)<1e-7);
 std::string provenance="null";if(shared){
  std::vector<std::vector<TopoDS_Edge> > edgeLoops(1,original);std::vector<std::vector<TopoDS_Vertex> > vertexLoops(1,vertices);if(hole){edgeLoops.push_back(std::vector<TopoDS_Edge>(1,circle));vertexLoops.push_back(std::vector<TopoDS_Vertex>());}if(polygonHole){edgeLoops.push_back(holeEdges);vertexLoops.push_back(holeVertices);}
  provenance=e0::profile_prism_provenance_v1::capture(edgeLoops,vertexLoops,prism,prism.Shape());
  std::vector<std::vector<TopoDS_Edge> > wrong=edgeLoops;wrong[0][0]=BRepBuilderAPI_MakeEdge(points[0],points[1]).Edge();bool refused=false;try{e0::profile_prism_provenance_v1::capture(wrong,vertexLoops,prism,prism.Shape());}catch(const e0::profile_prism_provenance_v1::Error& e){refused=std::string(e.what())=="PROFILE_PROVENANCE_UNSUPPORTED";}require(refused);require(e0::profile_prism_provenance_v1::capture(edgeLoops,vertexLoops,prism,prism.Shape())==provenance);
 }
 std::cout<<"{\"case\":\""<<name<<"\",\"sourceSegments\":"<<count<<",\"originalEdgesRetainedByWire\":"<<originalRetained<<",\"wireReturnedEdgesRetained\":"<<addedRetained<<",\"prismUsesOriginalEdges\":"<<originalUsed<<",\"originalEdgesInCopiedOutput\":"<<sourcePreserved<<",\"mappedCapEdges\":"<<caps<<",\"mappedSweptFaces\":"<<sides<<",\"mappedAuthoredConnectors\":"<<connectors<<",\"copiedCaps\":true,\"holeCircleMapped\":"<<(hole?"true":"false")<<",\"circleSeamAuthored\":false,\"nativeVolume\":"<<std::setprecision(17)<<volume.Mass()<<",\"persistentIndicesSaved\":false,\"provenance\":"<<provenance<<"}"<<std::endl;
}
void annulus(){
 std::vector<std::vector<TopoDS_Edge> > edges(2);std::vector<std::vector<TopoDS_Vertex> > vertices(2);const gp_Ax2 axis(gp_Pnt(0,0,0),gp_Dir(0,0,1));edges[0].push_back(BRepBuilderAPI_MakeEdge(gp_Circ(axis,10)).Edge());edges[1].push_back(BRepBuilderAPI_MakeEdge(gp_Circ(axis,3)).Edge());BRepBuilderAPI_MakeWire outer(edges[0][0]),inner(edges[1][0]);TopoDS_Wire hole=inner.Wire();hole.Reverse();BRepBuilderAPI_MakeFace face(gp_Pln(gp_Pnt(0,0,0),gp_Dir(0,0,1)),outer.Wire(),true);face.Add(hole);require(face.IsDone());BRepPrimAPI_MakePrism prism(face.Face(),gp_Vec(0,0,7),true,true);prism.Build();require(prism.IsDone()&&BRepCheck_Analyzer(prism.Shape()).IsValid());const std::string provenance=e0::profile_prism_provenance_v1::capture(edges,vertices,prism,prism.Shape());GProp_GProps volume;BRepGProp::VolumeProperties(prism.Shape(),volume);require(std::abs(volume.Mass()-91*std::acos(-1.)*7)<1e-7);std::cout<<"{\"case\":\"circle-annulus\",\"nativeVolume\":"<<std::setprecision(17)<<volume.Mass()<<",\"circleSeamAuthored\":false,\"persistentIndicesSaved\":false,\"provenance\":"<<provenance<<"}"<<std::endl;
}
int main(){try{run("independent-rectangle",false,false,false,false);run("shared-rectangle",true,false,false,false);run("shared-concave",true,true,false,false);run("shared-concave-circle-hole-oblique",true,true,true,true);run("shared-concave-mixed-holes-oblique",true,true,true,true,true);annulus();return 0;}catch(const std::exception& e){std::cerr<<e.what()<<std::endl;return 1;}catch(...){std::cerr<<"NATIVE_PROVENANCE_FAILED"<<std::endl;return 2;}}
