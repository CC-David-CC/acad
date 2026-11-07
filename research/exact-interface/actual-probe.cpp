#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Polyhedron_3.h>
#include <CGAL/Nef_polyhedron_3.h>
#include <CGAL/Polygon_mesh_processing/self_intersections.h>
#include <fstream>
#include <iostream>
#include <string>
using K=CGAL::Exact_predicates_exact_constructions_kernel; using P=CGAL::Polyhedron_3<K>; using N=CGAL::Nef_polyhedron_3<K>;
N load(const char* path){std::ifstream f(path);P p;if(!(f>>p)||p.empty()||!p.is_closed()||!p.is_valid()||CGAL::Polygon_mesh_processing::does_self_intersect(p))throw std::runtime_error("invalid or self-intersecting input");return N(p);}
std::string classify(const N&a,const N&b){N x=a.closure()*b.closure();if(x.is_empty())return "disjoint";if(x.interior().is_empty())return "contact";return "overlap";}
int main(){try{const N lid=load("lid.off"), label=load("label.off"), overlap=load("overlap.off"), apart=load("apart.off"), contained=load("contained.off");const auto a=classify(lid,label),b=classify(lid,overlap),c=classify(lid,apart),d=classify(lid,contained);std::cout<<"actual_lid_label="<<a<<" shifted_1e-6="<<b<<" separate="<<c<<" contained="<<d<<"\n";return a=="contact"&&b=="overlap"&&c=="disjoint"&&d=="overlap"?0:1;}catch(const std::exception& e){std::cerr<<"uncertain: "<<e.what()<<"\n";return 2;}}
