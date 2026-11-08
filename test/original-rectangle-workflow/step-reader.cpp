// Actual separate same-OCCT STEP reader. No writer/provider/model imports.
#include "ownedTopologyV1.hpp"
#include "ownedMassPropertiesV1.hpp"
#include <STEPControl_Reader.hxx>
#include <BRepClass3d_SolidClassifier.hxx>
#include <BRepCheck_Analyzer.hxx>
#include <BRepBndLib.hxx>
#include <GProp_GProps.hxx>
#include <Bnd_Box.hxx>
#include <TColStd_SequenceOfAsciiString.hxx>
#include <fstream>
#include <iostream>
#include <iomanip>
#include <vector>
#include <cmath>
#include <stdexcept>
struct Probe{gp_Pnt point;TopAbs_State state;};
void check(bool ok,const char*message){if(!ok)throw std::runtime_error(message);}
const char*stateName(TopAbs_State s){return s==TopAbs_IN?"inside":s==TopAbs_OUT?"outside":s==TopAbs_ON?"boundary":"unknown";}
TopAbs_State classify(const TopoDS_Shape&s,const gp_Pnt&p){bool on=false;for(TopExp_Explorer i(s,TopAbs_SOLID);i.More();i.Next()){BRepClass3d_SolidClassifier c(i.Current(),p,1e-7);if(c.State()==TopAbs_IN)return TopAbs_IN;if(c.State()==TopAbs_ON)on=true;check(c.State()!=TopAbs_UNKNOWN,"unknown point result");}return on?TopAbs_ON:TopAbs_OUT;}
int main(int argc,char**argv){try{
 check(argc==2,"actual export directory required");const std::string folder=argv[1];std::ifstream fixtures(folder+"/step-fixtures.txt");check(fixtures.good(),"fixtures missing");std::string label;int rows=0;
 while(fixtures>>label){check(label=="final"||label=="reopened","fixture name");double w,h,d,D,C,ox,oy,R,spacing;int count;check(bool(fixtures>>w>>h>>d>>D>>C>>ox>>oy>>R>>count>>spacing),"fixture fields");check(w==150&&h==30&&d==25&&D==12&&C==4&&ox==8&&oy==8&&R==3&&count==3&&spacing==20,"frozen complete final fixture");const double pi=std::acos(-1.),expected=w*h*d-pi*d*(count*D*D/4+C*C)-4*d*R*R*(1-pi/4);
 std::ifstream file(folder+"/"+label+".step",std::ios::binary);check(file.good(),"actual STEP bytes");STEPControl_Reader reader;check(reader.ReadStream(label.c_str(),file)==IFSelect_RetDone,"STEP parse");TColStd_SequenceOfAsciiString length,plane,solid;reader.FileUnits(length,plane,solid);check(length.Length()>0,"units present");for(int i=1;i<=length.Length();i++)check(length(i)=="millimetre","millimeter STEP units");reader.SetSystemLengthUnit(1.0);const int roots=reader.NbRootsForTransfer();check(roots>0&&reader.TransferRoots()>0,"transfer roots");const TopoDS_Shape shape=reader.OneShape();check(!shape.IsNull()&&BRepCheck_Analyzer(shape).IsValid(),"STEP native validity");const e0::owned_topology_v1::Maps maps(shape);check(maps.solids.Extent()==1,"one actual STEP solid");TopTools_IndexedMapOfShape shells;TopExp::MapShapes(shape,TopAbs_SHELL,shells);check(shells.Extent()==1,"one connected boundary shell");GProp_GProps props;const double achieved=e0::owned_mass_properties_v1::volumeProperties(shape,props);check(std::isfinite(props.Mass())&&std::abs(props.Mass()-expected)<=1e-6,"independent analytic volume");Bnd_Box box;BRepBndLib::AddOptimal(shape,box,false,false);double bounds[6];box.Get(bounds[0],bounds[1],bounds[2],bounds[3],bounds[4],bounds[5]);double expectedBounds[6]={0,0,0,w,h,d};for(int i=0;i<6;i++)check(std::isfinite(bounds[i])&&std::abs(bounds[i]-expectedBounds[i])<=1e-6,"analytic STEP bounds");
 std::vector<Probe> probes;for(int i=0;i<count;i++){const double x=w/2+i*spacing,y=h/2;probes.push_back({gp_Pnt(x,y,d/2),TopAbs_OUT});probes.push_back({gp_Pnt(x+D/2+.25,y,d/2),TopAbs_IN});}const double corners[4][2]={{ox,oy},{w-ox,oy},{w-ox,h-oy},{ox,h-oy}};for(const auto&p:corners){probes.push_back({gp_Pnt(p[0],p[1],d/2),TopAbs_OUT});probes.push_back({gp_Pnt(p[0]+C/2+.25,p[1],d/2),TopAbs_IN});}const double cut[4][2]={{.5,.5},{w-.5,.5},{w-.5,h-.5},{.5,h-.5}},keep[4][2]={{R,R},{w-R,R},{w-R,h-R},{R,h-R}};for(const auto&p:cut)probes.push_back({gp_Pnt(p[0],p[1],d/2),TopAbs_OUT});for(const auto&p:keep)probes.push_back({gp_Pnt(p[0],p[1],d/2),TopAbs_IN});probes.push_back({gp_Pnt(0,h/2,d/2),TopAbs_ON});
 std::cout<<"OBS {\"label\":\""<<label<<"\",\"status\":\"PASS\",\"reader\":\"same-OCCT-separate-build\",\"unit\":\"millimeter\",\"roots\":"<<roots<<",\"solids\":1,\"shells\":1,\"volume\":"<<std::setprecision(17)<<props.Mass()<<",\"analyticVolume\":"<<expected<<",\"achievedIntegrationEstimate\":"<<achieved<<",\"bounds\":[";for(int i=0;i<6;i++)std::cout<<(i?",":"")<<bounds[i];std::cout<<"],\"points\":[";for(std::size_t i=0;i<probes.size();i++){const auto&p=probes[i];const auto actual=classify(shape,p.point);check(actual==p.state,"analytic material/void/boundary");std::cout<<(i?",":"")<<"{\"point\":["<<p.point.X()<<","<<p.point.Y()<<","<<p.point.Z()<<"],\"classification\":\""<<stateName(actual)<<"\"}";}std::cout<<"]}\n";++rows;
 }check(rows==2,"two complete final exported files");return 0;
}catch(const std::exception&e){std::cerr<<e.what()<<"\n";return 1;}}
