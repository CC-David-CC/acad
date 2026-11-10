// AFTER the complete public workflow: actual exported STEP only.
// Separate same-OCCT reader, NOT an independent external geometry kernel.
#include "ownedMassPropertiesV1.hpp"
#include <STEPControl_Reader.hxx>
#include <BRepCheck_Analyzer.hxx>
#include <BRepClass3d_SolidClassifier.hxx>
#include <BRepBndLib.hxx>
#include <BRepAdaptor_Surface.hxx>
#include <BRepMesh_IncrementalMesh.hxx>
#include <BRep_Tool.hxx>
#include <Bnd_Box.hxx>
#include <GProp_GProps.hxx>
#include <TopExp.hxx>
#include <TopExp_Explorer.hxx>
#include <TopoDS.hxx>
#include <TopTools_IndexedMapOfShape.hxx>
#include <TColStd_SequenceOfAsciiString.hxx>
#include <Poly_Triangulation.hxx>
#include <gp_Pln.hxx>
#include <Standard_Failure.hxx>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <vector>
#include <array>
#include <stdexcept>
#include <utility>
#ifndef CODI_READER_SOURCE_SHA
#error The reviewed build wrapper must bind the actual reader source hash.
#endif
static void require(bool ok,const char*message){if(!ok)throw std::runtime_error(message);}
static const char* state(TopAbs_State s){return s==TopAbs_IN?"inside":s==TopAbs_OUT?"outside":s==TopAbs_ON?"boundary":"unknown";}
static int count(const TopoDS_Shape&s,TopAbs_ShapeEnum kind){TopTools_IndexedMapOfShape m;TopExp::MapShapes(s,kind,m);return m.Extent();}
static void point(const gp_Pnt&p){require(std::isfinite(p.X())&&std::isfinite(p.Y())&&std::isfinite(p.Z()),"nonfinite point");std::cout<<'['<<p.X()<<','<<p.Y()<<','<<p.Z()<<']';}
static void bounds(const TopoDS_Shape&s){Bnd_Box b;BRepBndLib::AddOptimal(s,b,false,false);double x[6];b.Get(x[0],x[1],x[2],x[3],x[4],x[5]);std::cout<<'[';for(int i=0;i<6;i++){require(std::isfinite(x[i]),"nonfinite bounds");if(i)std::cout<<',';std::cout<<x[i];}std::cout<<']';}
static double volume(const TopoDS_Shape&s){GProp_GProps p;e0::owned_mass_properties_v1::volumeProperties(s,p);require(std::isfinite(p.Mass())&&p.Mass()>0,"positive measured volume");return p.Mass();}
int main(int argc,char**argv){try{
 require(argc==2,"one actual STEP artifact path required");std::ifstream file(argv[1],std::ios::binary);require(file.good(),"open artifact");file.seekg(0,std::ios::end);const std::streamoff bytes=file.tellg();require(bytes>0&&bytes<=8388608,"8MiB public STEP bound");file.seekg(0);
 STEPControl_Reader reader;require(reader.ReadStream("public-e16-multi.step",file)==IFSelect_RetDone,"read STEP");TColStd_SequenceOfAsciiString length,angle,solidUnits;reader.FileUnits(length,angle,solidUnits);require(length.Length()>0,"declared STEP units");for(int i=1;i<=length.Length();i++)require(length(i)=="millimetre","declared millimetre");reader.SetSystemLengthUnit(1.0);const int roots=reader.NbRootsForTransfer();require(roots>0&&reader.TransferRoots()>0,"transfer roots");const TopoDS_Shape shape=reader.OneShape();require(!shape.IsNull()&&BRepCheck_Analyzer(shape).IsValid(),"valid transferred BRep");
 TopTools_IndexedMapOfShape solids;TopExp::MapShapes(shape,TopAbs_SOLID,solids);require(solids.Extent()==2,"frozen TWO-solid artifact domain");require(count(shape,TopAbs_FACE)==12&&count(shape,TopAbs_SHELL)==2,"frozen cuboid face/shell roster");
 // Tessellate only this independently transferred artifact. No app owned
 // handles/model or production Native runtime is read or changed.
 BRepMesh_IncrementalMesh mesh(shape,.001,false,.01,false);require(mesh.IsDone(),"artifact meshing");
 std::cout<<std::setprecision(17)<<"OBS {\"reader\":\"same-OCCT-separate-build\",\"readerSourceSha256\":\""<<CODI_READER_SOURCE_SHA<<"\",\"inputBytes\":"<<bytes<<",\"unit\":\"millimeter\",\"roots\":"<<roots<<",\"valid\":true,\"topology\":{\"solids\":"<<solids.Extent()<<",\"shells\":"<<count(shape,TopAbs_SHELL)<<",\"faces\":"<<count(shape,TopAbs_FACE)<<",\"edges\":"<<count(shape,TopAbs_EDGE)<<",\"vertices\":"<<count(shape,TopAbs_VERTEX)<<"},\"volume\":"<<volume(shape)<<",\"bounds\":";bounds(shape);std::cout<<",\"solids\":[";int triangles=0;
 for(int si=1;si<=solids.Extent();si++){
  const auto&s=solids(si);require(BRepCheck_Analyzer(s).IsValid(),"valid component");if(si>1)std::cout<<',';std::cout<<"{\"responseLocalIndex\":"<<si<<",\"volume\":"<<volume(s)<<",\"bounds\":";bounds(s);std::cout<<",\"shells\":"<<count(s,TopAbs_SHELL)<<",\"vertices\":"<<count(s,TopAbs_VERTEX)<<",\"edges\":"<<count(s,TopAbs_EDGE)<<",\"faces\":[";
  TopTools_IndexedMapOfShape faces;TopExp::MapShapes(s,TopAbs_FACE,faces);require(faces.Extent()==6,"six real cuboid faces");
  for(int fi=1;fi<=faces.Extent();fi++){
   const auto face=TopoDS::Face(faces(fi));BRepAdaptor_Surface surface(face);require(surface.GetType()==GeomAbs_Plane,"actual planar face");const auto plane=surface.Plane();TopLoc_Location location;const auto tri=BRep_Tool::Triangulation(face,location);require(!tri.IsNull()&&tri->NbTriangles()>0,"actual face triangulation");triangles+=tri->NbTriangles();require(triangles<=1000,"bounded frozen reader triangles");
   if(fi>1)std::cout<<',';std::cout<<"{\"responseLocalIndex\":"<<fi<<",\"planeOrigin\":";point(plane.Location());const auto n=plane.Axis().Direction();std::cout<<",\"planeNormal\":["<<n.X()<<','<<n.Y()<<','<<n.Z()<<"],\"triangles\":[";
   for(int ti=1;ti<=tri->NbTriangles();ti++){int a,b,c;tri->Triangle(ti).Get(a,b,c);if(face.Orientation()==TopAbs_REVERSED)std::swap(b,c);if(ti>1)std::cout<<',';std::cout<<'[';point(tri->Node(a).Transformed(location.Transformation()));std::cout<<',';point(tri->Node(b).Transformed(location.Transformation()));std::cout<<',';point(tri->Node(c).Transformed(location.Transformation()));std::cout<<']';}std::cout<<"]}";
  }std::cout<<"]}";
 }
 const std::array<std::array<double,3>,6> probes={{{5,5,5},{45,5,5},{35,5,5},{51,5,5},{0,5,5},{40,5,5}}};std::cout<<"],\"points\":[";
 for(std::size_t pi=0;pi<probes.size();pi++){const auto&p=probes[pi];if(pi)std::cout<<',';std::cout<<"{\"point\":["<<p[0]<<','<<p[1]<<','<<p[2]<<"],\"bySolid\":[";bool inside=false,on=false;
  for(int si=1;si<=solids.Extent();si++){BRepClass3d_SolidClassifier classifier(solids(si),gp_Pnt(p[0],p[1],p[2]),1e-7);const auto s=classifier.State();require(s!=TopAbs_UNKNOWN,"known component point state");inside|=s==TopAbs_IN;on|=s==TopAbs_ON;if(si>1)std::cout<<',';std::cout<<'"'<<state(s)<<'"';}std::cout<<"],\"classification\":\""<<(inside?"inside":on?"boundary":"outside")<<"\"}";
 }std::cout<<"],\"triangles\":"<<triangles<<"}\n";return 0;
 }catch(const Standard_Failure&e){std::cerr<<"NATIVE_FAIL "<<e.GetMessageString()<<'\n';}catch(const std::exception&e){std::cerr<<"FAIL "<<e.what()<<'\n';}return 1;}
