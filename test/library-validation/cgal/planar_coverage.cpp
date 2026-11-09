// SPDX-License-Identifier: GPL-3.0-or-later
// Offline exact PROJECTED SET evidence. No CAD importer/source/writer/repair.
#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Polygon_2.h>
#include <CGAL/Polygon_with_holes_2.h>
#include <CGAL/Polygon_set_2.h>
#include <CGAL/intersections.h>
#include <CGAL/number_utils.h>
#include <CGAL/version.h>
#include <algorithm>
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <iterator>
#include <limits>
#include <new>
#include <set>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#ifdef __FAST_MATH__
#error "Exact-input planar adapter must not use fast-math"
#endif
#if CGAL_VERSION_MAJOR != 5 || CGAL_VERSION_MINOR != 6
#error "Reviewed planar adapter API is CGAL 5.6.x"
#endif

namespace {
using K = CGAL::Exact_predicates_exact_constructions_kernel;
using FT = K::FT;
using Point = K::Point_2;
using Segment = K::Segment_2;
using Polygon = CGAL::Polygon_2<K>;
using Pwh = CGAL::Polygon_with_holes_2<K>;
using Set = CGAL::Polygon_set_2<K>;
using Id = std::uint32_t;
using Triangle = std::array<Id,3>;
constexpr std::size_t MaxVertices=150000, MaxTriangles=100000;
constexpr std::size_t MaxBinaryBytes=8388608, MaxTextBytes=16777216;
constexpr std::size_t MaxLineBytes=80, MaxDetails=128, MaxOutputBytes=65536;
constexpr std::size_t MaxLoopWork=2000000, MaxArrangementVertices=2000000;
constexpr std::size_t MaxArrangementEdges=4000000, MaxArrangementFaces=2000000;
constexpr std::size_t MaxMeasuredBoundaryVertices=8000000;
static_assert(sizeof(double)==sizeof(std::uint64_t));
static_assert(std::numeric_limits<double>::is_iec559 &&
 std::numeric_limits<double>::radix==2 && std::numeric_limits<double>::digits==53 &&
 std::numeric_limits<double>::max_exponent==1024 &&
 std::numeric_limits<double>::min_exponent==-1021,"Requires IEEE754 binary64");
struct InputError { const char* reason; };
struct Resource { const char* reason; };
struct AlgorithmError { const char* reason; };
struct DomainFailure { const char* reason; };
struct Detail {
 bool run=false, complete=false, truncated=false;
 std::size_t count=0;
 std::vector<Id> ids;
 void observe(Id id) { ++count; if(ids.size()<MaxDetails) ids.push_back(id); else truncated=true; }
};
struct Result {
 const char* status="ERROR"; const char* reason="NOT_COMPLETED";
 std::size_t vertices=0, triangles=0, selected=0, loops=0, loopVertices=0, line=0;
 bool inputComplete=false, frameChecked=false;
 int u=0,v=1,sign=1;
 bool errorFaceSet=false,errorLoopSet=false; Id errorFace=0,errorLoop=0;
 bool domainStarted=false,domainComplete=false;
 std::size_t indexedLoops=0,sourceRectangles=0,loopWork=0;
 bool triangleScan=false;
 Detail degenerates,reversed;
 bool unionComplete=false,areaEnumerated=false,areaChecked=false,areaEqual=false;
 bool setsChecked=false,setsEqual=false;
 std::size_t unionComponents=0,missingComponents=0,outsideComponents=0;
 std::size_t measuredBoundaryVertices=0;
 Detail overlapLater,outside;
};
class Input {
 public:
 explicit Input(std::istream& stream):stream_(stream){}
 std::vector<std::string> row(std::size_t expected) {
  std::string text;
  for(;;) {
   int c=stream_.get();
   if(c==std::char_traits<char>::eof()) {
    if(stream_.bad())throw InputError{"INPUT_IO_FAILURE"};
    if(text.empty())throw InputError{"INPUT_TRUNCATED"};
    break;
   }
   if(++bytes_>MaxTextBytes)throw Resource{"INPUT_TEXT_LIMIT"};
   if(c=='\n')break;
   if(c!=' '&&c!='-'&&!(c>='0'&&c<='9')&&!(c>='a'&&c<='f')&&!(c>='A'&&c<='F'))
    throw InputError{"INPUT_CHARACTER"};
   if(text.size()==MaxLineBytes)throw Resource{"INPUT_LINE_LIMIT"};
   text.push_back(static_cast<char>(c));
  }
  ++line_;
  std::vector<std::string> tokens;
  std::size_t begin=0;
  while(begin<text.size()) {
   auto end=text.find(' ',begin);
   auto count=(end==std::string::npos?text.size():end)-begin;
   if(!count)throw InputError{"INPUT_SPACING"};
   tokens.push_back(text.substr(begin,count));
   if(tokens.size()>expected)throw InputError{"INPUT_ROW_ARITY"};
   if(end==std::string::npos)break;
   begin=end+1;
   if(begin==text.size())throw InputError{"INPUT_SPACING"};
  }
  if(tokens.size()!=expected)throw InputError{"INPUT_ROW_ARITY"};
  return tokens;
 }
 void end() {
  if(stream_.peek()!=std::char_traits<char>::eof())throw InputError{"INPUT_TRAILING_DATA"};
  if(stream_.bad())throw InputError{"INPUT_IO_FAILURE"};
 }
 std::size_t next()const{return line_+1;}
 private: std::istream& stream_;std::size_t bytes_=0,line_=0;
};
std::size_t decimal(const std::string& s,std::size_t maximum) {
 if(s.empty()||(s.size()>1&&s[0]=='0'))throw InputError{"INPUT_DECIMAL_FORM"};
 std::size_t n=0;
 for(char c:s) {
  if(c<'0'||c>'9')throw InputError{"INPUT_DECIMAL_FORM"};
  auto digit=static_cast<std::size_t>(c-'0');
  if(digit>maximum||n>(maximum-digit)/10)throw InputError{"INPUT_INTEGER_RANGE"};
  n=n*10+digit;
 }
 return n;
}
int axisValue(const std::string& s) {
 if(s=="-1")return -1;
 if(s=="0")return 0;
 if(s=="1")return 1;
 throw InputError{"INPUT_SIGNED_AXIS"};
}
FT bitsValue(const std::string& s) {
 if(s.size()!=16)throw InputError{"INPUT_HEX_WIDTH"};
 std::uint64_t bits=0;
 for(char c:s) {
  unsigned digit;
  if(c>='0'&&c<='9')digit=static_cast<unsigned>(c-'0');
  else if(c>='a'&&c<='f')digit=static_cast<unsigned>(c-'a'+10);
  else if(c>='A'&&c<='F')digit=static_cast<unsigned>(c-'A'+10);
  else throw InputError{"INPUT_HEX_FORM"};
  bits=(bits<<4)|digit;
 }
 if(((bits>>52)&0x7ffu)==0x7ffu)throw InputError{"INPUT_NONFINITE_COORDINATE"};
 double value;std::memcpy(&value,&bits,sizeof(value));
 FT exact(value);(void)CGAL::exact(exact);return exact;
}
using Axis=std::array<int,3>;
Axis cross(const Axis&a,const Axis&b) {
 return{a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]};
}
void frame(const std::array<Axis,3>& axes) {
 std::array<int,3> worldUses{0,0,0};
 for(const auto&a:axes) {
  int n=0;for(std::size_t j=0;j<3;++j){if(a[j]){++n;++worldUses[j];}}
  if(n!=1)throw InputError{"INPUT_FRAME_NOT_SIGNED_PERMUTATION"};
 }
 if(worldUses!=Axis{1,1,1}||cross(axes[0],axes[1])!=axes[2])
  throw InputError{"INPUT_FRAME_NOT_RIGHT_HANDED"};
}
Point project(const std::array<FT,3>& p,const std::array<FT,3>& origin,
              const std::array<Axis,3>& axes,int u,int v) {
 std::array<FT,3> d{p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]};
 FT x(0),y(0);
 for(std::size_t j=0;j<3;++j){x+=d[j]*axes[static_cast<std::size_t>(u)][j];y+=d[j]*axes[static_cast<std::size_t>(v)][j];}
 (void)CGAL::exact(x);(void)CGAL::exact(y);
 return Point(x,y);
}
struct Bounds {FT xmin,ymin,xmax,ymax;};
Bounds bounds(const Polygon&p) {
 auto at=p.vertices_begin();Bounds b{at->x(),at->y(),at->x(),at->y()};
 for(const auto&q:p.vertices()){b.xmin=std::min(b.xmin,q.x());b.xmax=std::max(b.xmax,q.x());b.ymin=std::min(b.ymin,q.y());b.ymax=std::max(b.ymax,q.y());}
 return b;
}
bool separated(const Bounds&a,const Bounds&b) {
 // Strict separation: boundary contact remains a candidate for exact refusal.
 return a.xmax<b.xmin||b.xmax<a.xmin||a.ymax<b.ymin||b.ymax<a.ymin;
}
Bounds bounds(const Segment&s) {
 return{std::min(s.source().x(),s.target().x()),std::min(s.source().y(),s.target().y()),
        std::max(s.source().x(),s.target().x()),std::max(s.source().y(),s.target().y())};
}
void charge(Result&r,std::size_t work) {
 if(work>MaxLoopWork-r.loopWork)throw Resource{"DOMAIN_PAIR_WORK_LIMIT"};
 r.loopWork+=work;
}
void arrangement(const Set&s) {
 const auto&a=s.arrangement();
 if(a.number_of_vertices()>MaxArrangementVertices||a.number_of_edges()>MaxArrangementEdges||
    a.number_of_faces()>MaxArrangementFaces)throw Resource{"ARRANGEMENT_SIZE_LIMIT"};
}
struct Loop {unsigned mode=0;Polygon polygon;};
void sourceRectangle(const Polygon&p) {
 if(p.size()!=4)throw DomainFailure{"DOMAIN_SOURCE_RECTANGLE_SHAPE"};
 auto b=bounds(p);if(!(b.xmin<b.xmax&&b.ymin<b.ymax))throw DomainFailure{"DOMAIN_SOURCE_RECTANGLE_SHAPE"};
 std::set<std::pair<FT,FT>> corners;
 for(const auto&q:p.vertices()) {
  if(!((q.x()==b.xmin||q.x()==b.xmax)&&(q.y()==b.ymin||q.y()==b.ymax)))
   throw DomainFailure{"DOMAIN_SOURCE_RECTANGLE_SHAPE"};
  corners.emplace(q.x(),q.y());
 }
 if(corners.size()!=4)throw DomainFailure{"DOMAIN_SOURCE_RECTANGLE_SHAPE"};
 for(auto e=p.edges_begin();e!=p.edges_end();++e)
  if(!((e->source().x()==e->target().x())!=(e->source().y()==e->target().y())))
   throw DomainFailure{"DOMAIN_SOURCE_RECTANGLE_SHAPE"};
}
Set domain(Result&r,std::vector<Loop>&loops) {
 r.domainStarted=true;
 std::vector<Bounds> boxes;boxes.reserve(loops.size());
 for(std::size_t i=0;i<loops.size();++i) {
  r.errorLoopSet=true;r.errorLoop=static_cast<Id>(i);
  const auto&p=loops[i].polygon;
  for(auto e=p.edges_begin();e!=p.edges_end();++e)
   if(e->source()==e->target())throw DomainFailure{"DOMAIN_ZERO_EDGE"};
  if(!p.is_simple())throw DomainFailure{"DOMAIN_SELF_INTERSECTION"};
  const auto area=p.area();(void)CGAL::exact(area);
  if(area==0)throw DomainFailure{"DOMAIN_ZERO_AREA"};
  const int wanted=i==0?r.sign:-r.sign;
  if((area>0?1:-1)!=wanted)throw DomainFailure{"DOMAIN_ORIGINAL_ORIENTATION"};
  if(loops[i].mode==1)sourceRectangle(p);
  boxes.push_back(bounds(p));
 }
 // Strict pair disjointness; no regularized subtraction may hide an invalid
 // source hole, touching loop or nested hole before expected-domain creation.
 for(std::size_t i=0;i<loops.size();++i)for(std::size_t j=0;j<i;++j) {
  r.errorLoopSet=true;r.errorLoop=static_cast<Id>(i);charge(r,1);
  if(separated(boxes[i],boxes[j])) {
   if(j==0)throw DomainFailure{"DOMAIN_HOLE_OUTSIDE"};
   continue;
  }
  const auto&a=loops[i].polygon;const auto&b=loops[j].polygon;
  for(auto ea=a.edges_begin();ea!=a.edges_end();++ea)
   for(auto eb=b.edges_begin();eb!=b.edges_end();++eb) {
    charge(r,1);if(separated(bounds(*ea),bounds(*eb)))continue;
    if(CGAL::do_intersect(*ea,*eb))throw DomainFailure{"DOMAIN_BOUNDARY_CONTACT"};
   }
  charge(r,b.size());
  const auto side=b.bounded_side(a.vertex(0));
  if(j==0) {
   if(side!=CGAL::ON_BOUNDED_SIDE)throw DomainFailure{"DOMAIN_HOLE_OUTSIDE"};
  } else {
   if(side!=CGAL::ON_UNBOUNDED_SIDE)throw DomainFailure{"DOMAIN_HOLES_OVERLAP"};
   charge(r,a.size());
   if(a.bounded_side(b.vertex(0))!=CGAL::ON_UNBOUNDED_SIDE)
    throw DomainFailure{"DOMAIN_HOLES_OVERLAP"};
  }
 }
 r.errorLoopSet=false;
 // Only these temporary set polygons are normalized. Original mesh triangles,
 // expected loop order and input IDs have already passed their sign checks.
 Polygon outer=loops[0].polygon;
 if(outer.orientation()!=CGAL::COUNTERCLOCKWISE)outer.reverse_orientation();
 std::vector<Polygon> holes;
 for(std::size_t i=1;i<loops.size();++i) {
  holes.push_back(loops[i].polygon);
  if(holes.back().orientation()!=CGAL::CLOCKWISE)holes.back().reverse_orientation();
 }
 Pwh expected(outer,holes.begin(),holes.end());Set result(expected);
 arrangement(result);
 if(result.is_empty())throw AlgorithmError{"EMPTY_VALIDATED_DOMAIN"};
 r.domainComplete=true;return result;
}
struct AreaState {FT value{0};std::size_t components=0,vertices=0;};
class AreaOutput {
 public:
 using iterator_category=std::output_iterator_tag;using value_type=void;
 using difference_type=std::ptrdiff_t;using pointer=void;using reference=void;
 explicit AreaOutput(AreaState&state):state_(&state){}
 AreaOutput&operator*(){return*this;}AreaOutput&operator++(){return*this;}
 AreaOutput operator++(int){return*this;}
 AreaOutput&operator=(const Pwh&p) {
  auto&s=*state_;
  if(p.is_unbounded())throw AlgorithmError{"UNBOUNDED_FINITE_UNION"};
  if(++s.components>MaxArrangementFaces)throw Resource{"POLYGON_OUTPUT_LIMIT"};
  auto add=[&](const Polygon&ring,bool hole) {
   if(ring.size()>MaxMeasuredBoundaryVertices-s.vertices)throw Resource{"BOUNDARY_ENUMERATION_LIMIT"};
   s.vertices+=ring.size();auto a=ring.area();(void)CGAL::exact(a);
   if(hole?!(a<0):!(a>0))throw AlgorithmError{"UNION_ORIENTATION_INVARIANT"};
   s.value+=a;(void)CGAL::exact(s.value);
  };
  add(p.outer_boundary(),false);
  for(auto h=p.holes_begin();h!=p.holes_end();++h)add(*h,true);
  return*this;
 }
 private:AreaState*state_;
};
FT area(const Set&s,AreaState&state) {
 s.polygons_with_holes(AreaOutput(state));
 if(state.value<0)throw AlgorithmError{"UNION_NEGATIVE_AREA"};
 return state.value;
}
void overlapDetails(Result&r,const std::vector<Polygon>&polygons,const std::vector<Id>&selected) {
 r.overlapLater.run=true;Set prefix;
 for(std::size_t i=0;i<polygons.size();++i) {
  if(prefix.do_intersect(polygons[i])) {
   r.overlapLater.observe(selected[i]);
   if(r.overlapLater.count>MaxDetails)return;
  }
  prefix.join(polygons[i]);arrangement(prefix);
 }
 r.overlapLater.complete=true;
}
void outsideDetails(Result&r,const Set&expected,const std::vector<Polygon>&polygons,
                    const std::vector<Id>&selected) {
 r.outside.run=true;
 for(std::size_t i=0;i<polygons.size();++i) {
  Set outside(polygons[i]);outside.difference(expected);arrangement(outside);
  if(!outside.is_empty()) {
   r.outside.observe(selected[i]);
   if(r.outside.count>MaxDetails)return;
  }
 }
 r.outside.complete=true;
}
void inspect(Result&r) {
 Input in(std::cin);
 auto row=[&](std::size_t n){r.line=in.next();return in.row(n);};
 auto header=row(5);
 if(decimal(header[0],1)!=1)throw InputError{"INPUT_VERSION"};
 r.vertices=decimal(header[1],MaxVertices);r.triangles=decimal(header[2],MaxTriangles);
 if(!r.vertices||!r.triangles)throw InputError{"INPUT_EMPTY_MESH"};
 if(32+24*r.vertices+12*r.triangles>MaxBinaryBytes)throw Resource{"INPUT_BINARY_LIMIT"};
 r.selected=decimal(header[3],r.triangles);
 r.loops=decimal(header[4],(r.vertices+4)/3);
 if(!r.selected||!r.loops)throw InputError{"INPUT_EMPTY_PATCH_OR_DOMAIN"};
 auto originRow=row(3);
 std::array<FT,3> origin{bitsValue(originRow[0]),bitsValue(originRow[1]),bitsValue(originRow[2])};
 std::array<Axis,3> axes;
 for(auto&a:axes){auto tokens=row(3);for(std::size_t j=0;j<3;++j)a[j]=axisValue(tokens[j]);}
 frame(axes);
 auto projection=row(3);r.u=static_cast<int>(decimal(projection[0],2));r.v=static_cast<int>(decimal(projection[1],2));r.sign=axisValue(projection[2]);
 if(r.u==r.v||!r.sign)throw InputError{"INPUT_PROJECTION"};
 r.frameChecked=true;
 std::vector<Point> points;points.reserve(r.vertices);
 for(std::size_t i=0;i<r.vertices;++i) {
  auto tokens=row(3);
  std::array<FT,3> world{bitsValue(tokens[0]),bitsValue(tokens[1]),bitsValue(tokens[2])};
  points.push_back(project(world,origin,axes,r.u,r.v));
 }
 std::vector<Triangle> triangles;triangles.reserve(r.triangles);
 for(std::size_t i=0;i<r.triangles;++i) {
  r.errorFaceSet=true;r.errorFace=static_cast<Id>(i);
  auto tokens=row(3);Triangle t;
  for(std::size_t j=0;j<3;++j)t[j]=static_cast<Id>(decimal(tokens[j],r.vertices-1));
  if(t[0]==t[1]||t[0]==t[2]||t[1]==t[2]) {
   r.errorFaceSet=true;r.errorFace=static_cast<Id>(i);throw InputError{"INPUT_REPEATED_VERTEX_INDEX"};
  }
  triangles.push_back(t);r.errorFaceSet=false;
 }
 std::vector<Id> selected;selected.reserve(r.selected);
 std::vector<bool> used(r.triangles,false);
 for(std::size_t i=0;i<r.selected;++i) {
  auto tokens=row(1);Id id=static_cast<Id>(decimal(tokens[0],r.triangles-1));
  if(used[id]){r.errorFaceSet=true;r.errorFace=id;throw InputError{"INPUT_DUPLICATE_SELECTED_ID"};}
  used[id]=true;selected.push_back(id);
 }
 std::vector<Loop> loops;loops.reserve(r.loops);
 for(std::size_t i=0;i<r.loops;++i) {
  r.errorLoopSet=true;r.errorLoop=static_cast<Id>(i);
  auto tokens=row(3);auto role=decimal(tokens[0],1),mode=decimal(tokens[1],1);
  if(role!=(i==0?0u:1u)||(mode==1&&i!=0))throw InputError{"INPUT_LOOP_ROLE_MODE"};
  auto n=decimal(tokens[2],r.vertices+4-r.loopVertices);
  if(n<3||(mode==1&&n!=4))throw InputError{"INPUT_LOOP_SIZE"};
  r.loopVertices+=n;Loop loop;loop.mode=static_cast<unsigned>(mode);
  if(mode==0) {
   ++r.indexedLoops;std::set<Id> ids;
   for(std::size_t j=0;j<n;++j) {
    auto reference=row(1);Id id=static_cast<Id>(decimal(reference[0],r.vertices-1));
    if(!ids.insert(id).second)throw InputError{"INPUT_DUPLICATE_LOOP_VERTEX"};
    loop.polygon.push_back(points[id]);
   }
  } else {
   ++r.sourceRectangles;
   for(std::size_t j=0;j<n;++j) {
    auto corner=row(2);loop.polygon.push_back(Point(bitsValue(corner[0]),bitsValue(corner[1])));
   }
  }
  loops.push_back(std::move(loop));
 }
 r.errorLoopSet=false;r.line=in.next();in.end();r.line=0;r.inputComplete=true;
 Set expected=domain(r,loops);
 std::vector<Polygon> polygons;polygons.reserve(selected.size());FT sum(0);
 r.degenerates.run=r.reversed.run=true;
 for(Id id:selected) {
  const auto&t=triangles[id];Polygon p;
  for(Id vertex:t)p.push_back(points[vertex]);
  auto a=p.area();(void)CGAL::exact(a);
  if(a==0){r.degenerates.observe(id);continue;}
  if((a>0?1:-1)!=r.sign){r.reversed.observe(id);continue;}
  if(a<0)p.reverse_orientation();
  auto positive=p.area();sum+=positive;(void)CGAL::exact(sum);
  polygons.push_back(std::move(p));
 }
 r.triangleScan=true;r.degenerates.complete=r.reversed.complete=true;
 if(r.degenerates.count||r.reversed.count) {
  r.status="FAIL";r.reason="PROJECTED_TRIANGLE_DOMAIN";return;
 }
 if(polygons.size()!=selected.size())throw AlgorithmError{"SELECTED_CENSUS_INVARIANT"};
 Set actual;actual.join(polygons.begin(),polygons.end());arrangement(actual);
 r.unionComplete=true;
 if(actual.is_empty())throw AlgorithmError{"EMPTY_NONEMPTY_TRIANGLE_UNION"};
 AreaState state;FT united=area(actual,state);
 r.unionComponents=state.components;r.measuredBoundaryVertices=state.vertices;r.areaEnumerated=true;
 if(united>sum)throw AlgorithmError{"UNION_AREA_EXCEEDS_TRIANGLE_SUM"};
 r.areaChecked=true;r.areaEqual=united==sum;
 Set missing=expected;missing.difference(actual);arrangement(missing);
 Set outside=actual;outside.difference(expected);arrangement(outside);
 Set difference=actual;difference.symmetric_difference(expected);arrangement(difference);
 r.missingComponents=missing.number_of_polygons_with_holes();
 r.outsideComponents=outside.number_of_polygons_with_holes();
 r.setsEqual=difference.is_empty();r.setsChecked=true;
 if(r.setsEqual!=(missing.is_empty()&&outside.is_empty()))throw AlgorithmError{"SET_DIFFERENCE_INVARIANT"};
 if(r.areaEqual&&r.setsEqual){r.status="PASS";r.reason="EXACT_PROJECTED_COVERAGE";return;}
 r.status="FAIL";r.reason=!r.areaEqual&&!r.setsEqual?"OVERLAP_AND_DOMAIN_MISMATCH":!r.areaEqual?"POSITIVE_AREA_OVERLAP":"DOMAIN_SET_MISMATCH";
 if(!r.areaEqual)overlapDetails(r,polygons,selected);
 if(!outside.is_empty())outsideDetails(r,expected,polygons,selected);
}
const char*boolean(bool x){return x?"true":"false";}
void detail(std::ostream&out,const Detail&d) {
 out<<"{\"status\":\""<<(!d.run?"NOT_RUN":d.complete?"COMPLETE":d.truncated?"TRUNCATED":"INCOMPLETE")
    <<"\",\"scanComplete\":"<<boolean(d.run&&d.complete)<<",\"countAtLeast\":";
 if(d.run)out<<d.count;else out<<"null";
 out<<",\"idsComplete\":"<<boolean(d.run&&d.complete&&d.count==d.ids.size())<<",\"originalTriangleIds\":[";
 for(std::size_t i=0;i<d.ids.size();++i){if(i)out<<',';out<<d.ids[i];}out<<"]}";
}
void write(const Result&r) {
 std::ostringstream out;out.exceptions(std::ios::badbit|std::ios::failbit);
 out<<"{\"version\":1,\"adapter\":\"codi-cgal-planar-coverage-v1\","
    <<"\"scope\":\"exact-projected-set-coverage-only\",\"cgalVersion\":\""<<CGAL_VERSION_STR
    <<"\",\"status\":\""<<r.status<<"\",\"reason\":\""<<r.reason<<"\","
    <<"\"input\":{\"vertices\":"<<r.vertices<<",\"triangles\":"<<r.triangles
    <<",\"selectedTriangles\":"<<r.selected<<",\"loops\":"<<r.loops
    <<",\"loopVertices\":"<<r.loopVertices<<",\"complete\":"<<boolean(r.inputComplete)<<",\"errorLine\":";
 if(r.line)out<<r.line;else out<<"null";
 out<<",\"errorOriginalTriangleId\":";if(r.errorFaceSet)out<<r.errorFace;else out<<"null";
 out<<",\"errorLoopId\":";if(r.errorLoopSet)out<<r.errorLoop;else out<<"null";
 out<<"},\"limits\":{\"vertices\":"<<MaxVertices<<",\"triangles\":"<<MaxTriangles
    <<",\"binaryBytes\":"<<MaxBinaryBytes<<",\"textBytes\":"<<MaxTextBytes
    <<",\"lineBytes\":"<<MaxLineBytes<<",\"detailsPerList\":"<<MaxDetails
    <<",\"outputBytes\":"<<MaxOutputBytes<<",\"loopWork\":"<<MaxLoopWork
    <<",\"arrangementVertices\":"<<MaxArrangementVertices<<",\"arrangementEdges\":"<<MaxArrangementEdges
    <<",\"arrangementFaces\":"<<MaxArrangementFaces<<",\"measuredBoundaryVertices\":"<<MaxMeasuredBoundaryVertices
    <<"},\"projection\":{\"exactSignedPermutationChecked\":"<<boolean(r.frameChecked)
    <<",\"localAxes\":";
 if(r.frameChecked)out<<'['<<r.u<<','<<r.v<<']';else out<<"null";
 out<<",\"expectedOriginalSign\":";if(r.frameChecked)out<<r.sign;else out<<"null";
 out<<"},\"domain\":{\"status\":\""<<(!r.domainStarted?"NOT_RUN":r.domainComplete?"COMPLETE":"INCOMPLETE")
    <<"\",\"complete\":"<<boolean(r.domainComplete)<<",\"indexedLoops\":"<<r.indexedLoops
    <<",\"sourceRectangleOuters\":"<<r.sourceRectangles<<",\"workUnits\":"<<r.loopWork
    <<"},\"projectedTriangles\":{\"scanComplete\":"<<boolean(r.triangleScan)<<",\"degenerate\":";
 detail(out,r.degenerates);out<<",\"wrongOriginalOrientation\":";detail(out,r.reversed);
 out<<"},\"union\":{\"complete\":"<<boolean(r.unionComplete)<<",\"components\":";
 if(r.areaEnumerated)out<<r.unionComponents;else out<<"null";
 out<<",\"enumeratedBoundaryVertices\":";if(r.areaEnumerated)out<<r.measuredBoundaryVertices;else out<<"null";
 out<<",\"exactTriangleAreaEqualsUnion\":";if(r.areaChecked)out<<boolean(r.areaEqual);else out<<"null";
 out<<",\"exactSymmetricDifferenceEmpty\":";if(r.setsChecked)out<<boolean(r.setsEqual);else out<<"null";
 out<<",\"missingComponents\":";if(r.setsChecked)out<<r.missingComponents;else out<<"null";
 out<<",\"outsideComponents\":";if(r.setsChecked)out<<r.outsideComponents;else out<<"null";
 out<<"},\"overlapLaterTriangles\":";detail(out,r.overlapLater);
 out<<",\"outsideTriangles\":";detail(out,r.outside);
 out<<",\"sourceBinding\":\"NOT_RUN\",\"planeIncidence\":\"NOT_RUN\","
    <<"\"globalMeshValidity\":\"NOT_RUN\",\"analyticCircleDisplacement\":\"NOT_RUN\"}\n";
 auto text=out.str();if(text.size()>MaxOutputBytes)throw Resource{"OUTPUT_LIMIT"};
 std::cout<<text;std::cout.flush();if(!std::cout)throw AlgorithmError{"OUTPUT_IO_FAILURE"};
}
}
int main(int argc,char**) {
 std::ios::sync_with_stdio(false);Result r;int exit=1;
 try{if(argc!=1)throw InputError{"NO_ARGUMENTS_ACCEPTED"};inspect(r);}
 catch(const InputError&e){r.status="INPUT_INVALID";r.reason=e.reason;exit=2;}
 catch(const DomainFailure&e){r.status="FAIL";r.reason=e.reason;}
 catch(const Resource&e){r.status="RESOURCE_LIMIT";r.reason=e.reason;}
 catch(const AlgorithmError&e){r.status="ERROR";r.reason=e.reason;}
 catch(const std::bad_alloc&){r.status="RESOURCE_LIMIT";r.reason="ALLOCATION_FAILURE";}
 catch(...){r.status="ERROR";r.reason="CGAL_OR_ADAPTER_EXCEPTION";}
 try{write(r);}catch(...){return 3;}
 return std::strcmp(r.status,"PASS")==0?0:exit;
}
