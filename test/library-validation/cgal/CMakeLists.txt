cmake_minimum_required(VERSION 3.16)
project(codi_cgal_readonly_mesh LANGUAGES CXX)

# Dependencies are provisioned and pinned externally. Never acquire them here.
find_package(CGAL 5.6 REQUIRED)
if(CGAL_VERSION VERSION_LESS 5.6 OR NOT CGAL_VERSION VERSION_LESS 5.7)
  message(FATAL_ERROR "Reviewed adapter API is CGAL 5.6.x; review other versions first")
endif()

add_executable(codi-cgal-readonly-mesh mesh_readonly.cpp)
target_compile_features(codi-cgal-readonly-mesh PRIVATE cxx_std_17)
target_link_libraries(codi-cgal-readonly-mesh PRIVATE CGAL::CGAL)
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
  target_compile_options(codi-cgal-readonly-mesh PRIVATE
    -Wall -Wextra -Wpedantic -fno-fast-math -ffp-contract=off -frounding-math)
endif()

# Separate offline planar-set target; old raw3D adapter/source is unchanged.
add_executable(codi-cgal-planar-coverage planar_coverage.cpp)
target_compile_features(codi-cgal-planar-coverage PRIVATE cxx_std_17)
target_link_libraries(codi-cgal-planar-coverage PRIVATE CGAL::CGAL)
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
  target_compile_options(codi-cgal-planar-coverage PRIVATE
    -Wall -Wextra -Wpedantic -fno-fast-math -ffp-contract=off -frounding-math)
endif()
