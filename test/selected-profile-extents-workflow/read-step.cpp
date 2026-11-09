// AFTER the complete public workflow: actual exported artifacts only.
// Separate SAME-OCCT SDK reader, not an independent external geometry kernel.
#include "ownedMassPropertiesV1.hpp"
#include <STEPControl_Reader.hxx>
#include <BRepCheck_Analyzer.hxx>
#include <BRepClass3d_SolidClassifier.hxx>
#include <BRepBndLib.hxx>
#include <BRepAdaptor_Surface.hxx>
#include <gp_Pln.hxx>
#include <gp_Cylinder.hxx>
#include <BRepGProp.hxx>
#include <Bnd_Box.hxx>
#include <GProp_GProps.hxx>
#include <TopExp.hxx>
#include <TopoDS.hxx>
#include <TopTools_IndexedMapOfShape.hxx>
#include <TColStd_SequenceOfAsciiString.hxx>
#include <Standard_Failure.hxx>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <vector>
#include <array>
#include <stdexcept>
#include <cstdlib>
#include <cmath>
#ifndef CODI_READER_SOURCE_SHA
#error The reviewed build wrapper must bind the actual reader source hash.
#endif
static void require(bool ok,const char*why){if(!ok)throw std::runtime_error(why);}
static const char*state(TopAbs_State s){return s==TopAbs_IN?"inside":s==TopAbs_OUT?"outside":s==TopAbs_ON?"boundary":"unknown";}
static int count(const TopoDS_Shape&s,TopAbs_ShapeEnum k){TopTools_IndexedMapOfShape m;TopExp::MapShapes(s,k,m);return m.Extent();}
static void point(const gp_Pnt&p){require(std::isfinite(p.X())&&std::isfinite(p.Y())&&std::isfinite(p.Z()),"finite point");std::cout<<'['<<p.X()<<','<<p.Y()<<','<<p.Z()<<']';}
static void direction(const gp_Dir&p){std::cout<<'['<<p.X()<<','<<p.Y()<<','<<p.Z()<<']';}
static double number(const char*raw){char*end=nullptr;const double v=std::strtod(raw,&end);require(end&&end!=raw&&*end=='\0'&&std::isfinite(v)&&std::abs(v)<=4e6,"bounded finite actual probe");return v;}
int main(int argc,char**argv){try{
 require(argc>=5&&argc<=194&&(argc-2)%3==0,"artifact and1..64 actual probes required");std::ifstream file(argv[1],std::ios::binary);require(file.good(),"open actual artifact");file.seekg(0,std::ios::end);const std::streamoff bytes=file.tellg();require(bytes>0&&bytes<=8388608,"8MiB actual public STEP cap");file.seekg(0);
 std::vector<std::array<double,3>>probes;for(int i=2;i<argc;i+=3)probes.push_back({{number(argv[i]),number(argv[i+1]),number(argv[i+2])}});
 STEPControl_Reader reader;require(reader.ReadStream("actual-public-extent.step",file)==IFSelect_RetDone,"read actual STEP");TColStd_SequenceOfAsciiString length,angle,solidUnits;reader.FileUnits(length,angle,solidUnits);require(length.Length()>0,"declared STEP units");for(int i=1;i<=length.Length();i++)require(length(i)=="millimetre","declared millimetre");reader.SetSystemLengthUnit(1.0);const int roots=reader.NbRootsForTransfer();require(roots>0&&reader.TransferRoots()>0,"transfer actual artifact roots");const auto shape=reader.OneShape();require(!shape.IsNull()&&BRepCheck_Analyzer(shape).IsValid(),"actual valid transferred BRep");TopTools_IndexedMapOfShape solids,faces;TopExp::MapShapes(shape,TopAbs_SOLID,solids);TopExp::MapShapes(shape,TopAbs_FACE,faces);require(solids.Extent()==1&&faces.Extent()>0&&faces.Extent()<=1000,"finite ONE-solid/1000-face reader domain");
 GProp_GProps props;e0::owned_mass_properties_v1::volumeProperties(shape,props);require(std::isfinite(props.Mass())&&props.Mass()>0,"positive actual volume");Bnd_Box box;BRepBndLib::AddOptimal(shape,box,false,false);double bounds[6];box.Get(bounds[0],bounds[1],bounds[2],bounds[3],bounds[4],bounds[5]);
 std::cout<<std::setprecision(17)<<"OBS {\"reader\":\"same-OCCT-separate-build\",\"readerSourceSha256\":\""<<CODI_READER_SOURCE_SHA<<"\",\"inputBytes\":"<<bytes<<",\"unit\":\"millimeter\",\"valid\":true,\"roots\":"<<roots<<",\"solidCount\":1,\"shells\":"<<count(shape,TopAbs_SHELL)<<",\"edges\":"<<count(shape,TopAbs_EDGE)<<",\"vertices\":"<<count(shape,TopAbs_VERTEX)<<",\"volume\":"<<props.Mass()<<",\"bounds\":[";
 for(int i=0;i<6;i++){require(std::isfinite(bounds[i]),"finite artifact bounds");if(i)std::cout<<',';std::cout<<bounds[i];}std::cout<<"],\"faces\":[";
 for(int i=1;i<=faces.Extent();i++){
  const auto face=TopoDS::Face(faces(i));require(face.Orientation()==TopAbs_FORWARD||face.Orientation()==TopAbs_REVERSED,"actual oriented face");BRepAdaptor_Surface surface(face);GProp_GProps area;BRepGProp::SurfaceProperties(face,area);require(std::isfinite(area.Mass())&&area.Mass()>0,"positive actual surface area");if(i>1)std::cout<<',';std::cout<<"{\"responseLocalIndex\":"<<i<<",\"area\":"<<area.Mass()<<",\"orientation\":\""<<(face.Orientation()==TopAbs_REVERSED?"REVERSED":"FORWARD")<<"\",";
  if(surface.GetType()==GeomAbs_Plane){const auto p=surface.Plane();std::cout<<"\"kind\":\"plane\",\"origin\":";point(p.Location());std::cout<<",\"normal\":";direction(p.Axis().Direction());}
  else if(surface.GetType()==GeomAbs_Cylinder){const auto c=surface.Cylinder();require(std::isfinite(c.Radius())&&c.Radius()>0&&std::isfinite(surface.FirstUParameter())&&std::isfinite(surface.LastUParameter())&&std::isfinite(surface.FirstVParameter())&&std::isfinite(surface.LastVParameter()),"finite actual trimmed cylinder");std::cout<<"\"kind\":\"cylinder\",\"radius\":"<<c.Radius()<<",\"origin\":";point(c.Location());std::cout<<",\"axis\":";direction(c.Axis().Direction());std::cout<<",\"outwardRadialSign\":"<<((face.Orientation()==TopAbs_REVERSED?-1:1)*(c.Position().Direct()?1:-1))<<",\"uRange\":["<<surface.FirstUParameter()<<','<<surface.LastUParameter()<<"],\"vRange\":["<<surface.FirstVParameter()<<','<<surface.LastVParameter()<<']';}
  else throw std::runtime_error("unsupported actual STEP surface in this finite prism/round-bore reader");std::cout<<'}';
 }
 std::cout<<"],\"points\":[";for(std::size_t i=0;i<probes.size();i++){const auto&p=probes[i];BRepClass3d_SolidClassifier q(solids(1),gp_Pnt(p[0],p[1],p[2]),1e-7);require(q.State()!=TopAbs_UNKNOWN,"known actual material point");if(i)std::cout<<',';std::cout<<"{\"point\":["<<p[0]<<','<<p[1]<<','<<p[2]<<"],\"classification\":\""<<state(q.State())<<"\"}";}std::cout<<"]}\n";return 0;
 }catch(const Standard_Failure&e){std::cerr<<"NATIVE_FAIL "<<e.GetMessageString()<<'\n';}catch(const std::exception&e){std::cerr<<"FAIL "<<e.what()<<'\n';}return 1;}
