#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Polyhedron_3.h>
#include <CGAL/Nef_polyhedron_3.h>
#include <CGAL/boost/graph/generators.h>
#include <iostream>
#include <string>
using K=CGAL::Exact_predicates_exact_constructions_kernel;
using P=CGAL::Polyhedron_3<K>;
using N=CGAL::Nef_polyhedron_3<K>;
using Q=K::FT;
N box(Q x0,Q y0,Q z0,Q x1,Q y1,Q z1) {
 P p;
 CGAL::make_hexahedron(K::Point_3(x0,y0,z0),K::Point_3(x1,y0,z0),K::Point_3(x1,y1,z0),K::Point_3(x0,y1,z0),K::Point_3(x0,y1,z1),K::Point_3(x0,y0,z1),K::Point_3(x1,y0,z1),K::Point_3(x1,y1,z1),p);
 if(!p.is_closed())throw std::runtime_error("unclosed");return N(p);
}
std::string classify(const N&a,const N&b) {N x=a.closure()*b.closure();if(x.is_empty())return "disjoint";if(x.interior().is_empty())return "contact";return "overlap";}
int main(){
 N outer=box(0,0,12,40,30,14),cut=box(10,10,13,20,15,15),lid=outer-cut,label=box(10,10,13,20,15,14);
 N thin=box(10,10,Q(13)-Q(1)/Q(1000000),20,15,14),nested=box(1,1,Q(49)/Q(4),2,2,Q(51)/Q(4)),away=box(50,0,0,51,1,1);
 N edge=box(40,30,12,41,31,13),point=box(40,30,14,41,31,15),gap=box(Q(40)+Q(1)/(Q(1000000)*Q(1000000)),0,12,41,1,13);
 const auto a=classify(lid,label),b=classify(lid,thin),c=classify(lid,nested),d=classify(lid,away),e=classify(lid,edge),f=classify(lid,point),g=classify(lid,gap);
 std::cout<<"contact="<<a<<" thin="<<b<<" contained="<<c<<" away="<<d<<" edge="<<e<<" point="<<f<<" tiny-gap="<<g<<"\n";
 return a=="contact"&&b=="overlap"&&c=="overlap"&&d=="disjoint"&&e=="contact"&&f=="contact"&&g=="disjoint"?0:1;
}
