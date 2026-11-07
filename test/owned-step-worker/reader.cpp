// Separate same-OCCT reader build: round-trip evidence, not independent implementation.
#include "ownedTopologyV1.hpp"
#include <STEPControl_Reader.hxx>
#include <BRepClass3d_SolidClassifier.hxx>
#include <BRepGProp.hxx>
#include "ownedMassPropertiesV1.hpp"
#include <BRepBndLib.hxx>
#include <GProp_GProps.hxx>
#include <Bnd_Box.hxx>
#include <TColStd_SequenceOfAsciiString.hxx>
#include <fstream>
#include <iostream>
#include <vector>
#include <array>
#include <iomanip>
struct Probe{gp_Pnt p;TopAbs_State state;};
struct Fixture{const char*name;double volume;std::array<double,6> bounds;int solids,shells;std::vector<Probe> probes;};
void check(bool b,const char*m){if(!b)throw std::runtime_error(m);}
const char* stateName(TopAbs_State s){return s==TopAbs_IN?"inside":s==TopAbs_OUT?"outside":s==TopAbs_ON?"boundary":"unknown";}
TopAbs_State classify(const TopoDS_Shape&s,const gp_Pnt&p){bool on=false;for(TopExp_Explorer i(s,TopAbs_SOLID);i.More();i.Next()){BRepClass3d_SolidClassifier c(i.Current(),p,1e-7);if(c.State()==TopAbs_IN)return TopAbs_IN;if(c.State()==TopAbs_ON)on=true;check(c.State()!=TopAbs_UNKNOWN,"unknown classifier");}return on?TopAbs_ON:TopAbs_OUT;}
int main(int argc,char**argv){try{check(argc==2,"dir required");const std::string dir=argv[1];const double pi=std::acos(-1.);const double origin=1000000,dx=(origin+1e-6)-origin,dy=(origin+2e-6)-origin,dz=(origin+3e-6)-origin;
 const std::vector<Fixture> fixtures={
 {"unit-box",98322.384,{0,0,0,25.4,50.8,76.2},1,1,{{{12,25,38},TopAbs_IN},{{26,25,38},TopAbs_OUT},{{0,25,38},TopAbs_ON}}},
 {"five-hole-plate",100000-820*pi,{0,0,0,100,50,20},1,1,{{{50,25,10},TopAbs_OUT},{{8,8,10},TopAbs_OUT},{{92,8,10},TopAbs_OUT},{{8,42,10},TopAbs_OUT},{{92,42,10},TopAbs_OUT},{{25,25,10},TopAbs_IN},{{0,25,10},TopAbs_ON}}},
 {"l-bracket",4250-40*pi,{0,0,0,50,40,10},1,1,{{{2.5,20,5},TopAbs_OUT},{{10,15,5},TopAbs_OUT},{{10,2.5,5},TopAbs_IN},{{1,10,5},TopAbs_IN}}},
 {"cavity",992,{0,0,0,10,10,10},1,2,{{{5,5,5},TopAbs_OUT},{{2,5,5},TopAbs_IN},{{4,5,5},TopAbs_ON}}},
 {"two-inputs",2000,{0,0,0,30,10,10},2,2,{{{5,5,5},TopAbs_IN},{{25,5,5},TopAbs_IN},{{15,5,5},TopAbs_OUT}}},
 {"one-multisolid",2000,{0,0,0,30,10,10},2,2,{{{5,5,5},TopAbs_IN},{{25,5,5},TopAbs_IN},{{15,5,5},TopAbs_OUT}}},
 {"multi-chunk",100000-1280*pi,{0,0,0,100,50,20},1,1,{{{10,10,10},TopAbs_OUT},{{80,30,10},TopAbs_OUT},{{15,20,10},TopAbs_IN},{{101,25,10},TopAbs_OUT},{{0,25,10},TopAbs_ON}}},
 {"quarter-loft",250*pi,{-4,-4,0,4,4,30},1,1,{{{0,0,15},TopAbs_IN},{{2,0,15},TopAbs_IN},{{2.6,0,15},TopAbs_OUT},{{2.5,0,15},TopAbs_ON},{{3,0,0},TopAbs_ON},{{4,0,30},TopAbs_ON}}},
 {"tiny-origin",6e-18,{0,0,0,1e-6,2e-6,3e-6},1,1,{{{.5e-6,1e-6,1.5e-6},TopAbs_IN},{{2e-6,1e-6,1.5e-6},TopAbs_OUT},{{0,1e-6,1.5e-6},TopAbs_ON}}},
 {"tiny-translated",dx*dy*dz,{origin,origin,origin,origin+1e-6,origin+2e-6,origin+3e-6},1,1,{{{origin+.5e-6,origin+1e-6,origin+1.5e-6},TopAbs_IN},{{origin+2e-6,origin+1e-6,origin+1.5e-6},TopAbs_OUT},{{origin,origin+1e-6,origin+1.5e-6},TopAbs_ON}}},
 {"healthy-continuation",98322.384,{0,0,0,25.4,50.8,76.2},1,1,{{{12,25,38},TopAbs_IN}}}};
 for(const auto&f:fixtures){std::ifstream file(dir+"/"+f.name+".step",std::ios::binary);check(file.good(),"open step");STEPControl_Reader reader;check(reader.ReadStream(f.name,file)==IFSelect_RetDone,"read step");TColStd_SequenceOfAsciiString length,plane,solid;reader.FileUnits(length,plane,solid);check(length.Length()>0,"declared units");for(int i=1;i<=length.Length();i++)check(length(i)=="millimetre","millimetre reader units");reader.SetSystemLengthUnit(1.0);const int roots=reader.NbRootsForTransfer();check(roots>0&&reader.TransferRoots()>0,"transfer roots");const TopoDS_Shape shape=reader.OneShape();check(!shape.IsNull()&&BRepCheck_Analyzer(shape).IsValid(),"read validity");const e0::owned_topology_v1::Maps maps(shape);check(maps.solids.Extent()==f.solids,"solid count");TopTools_IndexedMapOfShape shells;TopExp::MapShapes(shape,TopAbs_SHELL,shells);check(shells.Extent()==f.shells,"shell count");GProp_GProps coarse,props;BRepGProp::VolumeProperties(shape,coarse);const double achieved=e0::owned_mass_properties_v1::volumeProperties(shape,props);const double tolerance=f.volume<1e-12?f.volume*1e-6:1e-6;check(std::isfinite(props.Mass())&&props.Mass()>0&&std::abs(props.Mass()-f.volume)<=tolerance,"analytic adaptive volume");Bnd_Box box;BRepBndLib::AddOptimal(shape,box,false,false);double b[6];box.Get(b[0],b[1],b[2],b[3],b[4],b[5]);for(int i=0;i<6;i++)check(std::isfinite(b[i])&&std::abs(b[i]-f.bounds[i])<=1e-6,"analytic bounds");
 std::cout<<"OBS {\"label\":\""<<f.name<<"\",\"status\":\"PASS\",\"reader\":\"same-OCCT-separate-build\",\"roots\":"<<roots<<",\"solids\":"<<maps.solids.Extent()<<",\"shells\":"<<shells.Extent()<<",\"unit\":\"millimeter\",\"volume\":"<<std::setprecision(17)<<props.Mass()<<",\"coarseVolume\":"<<coarse.Mass()<<",\"achievedIntegrationEstimate\":"<<achieved<<",\"catalog\":"<<e0::owned_topology_v1::catalog(shape)<<",\"bounds\":[";for(int i=0;i<6;i++)std::cout<<(i?",":"")<<b[i];std::cout<<"],\"points\":[";for(std::size_t i=0;i<f.probes.size();i++){const auto&p=f.probes[i];const TopAbs_State actual=classify(shape,p.p);check(actual==p.state,"analytic point");std::cout<<(i?",":"")<<"{\"point\":["<<p.p.X()<<","<<p.p.Y()<<","<<p.p.Z()<<"],\"classification\":\""<<stateName(actual)<<"\"}";}std::cout<<"]}\n";
 }return 0;}catch(const Standard_Failure&e){std::cerr<<"NATIVE_FAIL "<<e.GetMessageString()<<"\n";}catch(const std::exception&e){std::cerr<<"FAIL "<<e.what()<<"\n";}return 1;}
