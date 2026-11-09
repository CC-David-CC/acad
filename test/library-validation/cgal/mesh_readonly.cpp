// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only qualification tool. No importer, welding, orientation repair or writer.
#include <CGAL/Exact_predicates_exact_constructions_kernel.h>
#include <CGAL/Surface_mesh.h>
#include <CGAL/Polygon_mesh_processing/connected_components.h>
#include <CGAL/Polygon_mesh_processing/orientation.h>
#include <CGAL/Polygon_mesh_processing/self_intersections.h>
#include <CGAL/boost/graph/helpers.h>
#include <CGAL/number_utils.h>
#include <CGAL/version.h>

#include <algorithm>
#include <array>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <iterator>
#include <limits>
#include <new>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#ifdef __FAST_MATH__
#error "Exact-input validator must not be compiled with fast-math"
#endif
#if CGAL_VERSION_MAJOR != 5 || CGAL_VERSION_MINOR != 6
#error "Reviewed adapter API is CGAL 5.6.x"
#endif

namespace {
namespace PMP = CGAL::Polygon_mesh_processing;
using Kernel = CGAL::Exact_predicates_exact_constructions_kernel;
using Point = Kernel::Point_3;
using Mesh = CGAL::Surface_mesh<Point>;
using Face = Mesh::Face_index;
using Id = std::uint32_t;
using Triangle = std::array<Id, 3>;
constexpr std::size_t MaxVertices = 150000;
constexpr std::size_t MaxTriangles = 100000;
constexpr std::size_t MaxBinaryBytes = 8388608;
constexpr std::size_t MaxTextBytes = 16777216;
constexpr std::size_t MaxLineBytes = 80;
constexpr std::size_t MaxDetails = 128;
constexpr std::size_t MaxOutputBytes = 65536;
static_assert(sizeof(double) == sizeof(std::uint64_t));
static_assert(std::numeric_limits<double>::is_iec559 &&
              std::numeric_limits<double>::radix == 2 &&
              std::numeric_limits<double>::digits == 53 &&
              std::numeric_limits<double>::max_exponent == 1024 &&
              std::numeric_limits<double>::min_exponent == -1021,
              "Input requires IEEE754 binary64 doubles");

struct InputError : std::runtime_error {
  explicit InputError(const char* code) : std::runtime_error(code) {}
};
struct DetailLimit {};
struct Failure { Id face; const char* reason; };
struct Component { Id firstFace; std::size_t faces; };
struct Result {
  const char* status = "ERROR";
  const char* reason = "NOT_COMPLETED";
  std::size_t vertices = 0, triangles = 0, line = 0;
  bool inputComplete = false;
  bool faceCensusComplete = false;
  std::size_t degenerateCount = 0, insertionFailureCount = 0;
  std::vector<Id> degenerate;
  std::vector<Failure> insertionFailures;
  bool graphChecked = false, validGraph = false, triangularChecked = false;
  bool triangular = false, closed = false;
  bool componentsChecked = false;
  std::size_t componentCount = 0;
  std::vector<Component> components;
  const char* intersectionStatus = "NOT_RUN";
  bool intersectionsComplete = false;
  std::size_t intersectionLowerBound = 0;
  std::vector<std::pair<Id, Id>> intersections;
  const char* volumeStatus = "NOT_RUN";
  bool volumeChecked = false, boundsVolume = false;
};

// Fixed line/token grammar prevents unbounded getline/string growth. One LF per
// row; a final row without LF is accepted. Blank/extra rows and CR/tab are not.
class Input {
 public:
  explicit Input(std::istream& source) : source_(source) {}
  std::vector<std::string> row(std::size_t expected) {
    std::string line;
    for (;;) {
      const int value = source_.get();
      if (value == std::char_traits<char>::eof()) {
        if (source_.bad()) throw InputError("INPUT_IO_FAILURE");
        if (line.empty()) throw InputError("INPUT_TRUNCATED");
        break;
      }
      if (++bytes_ > MaxTextBytes) throw InputError("INPUT_TEXT_LIMIT");
      if (value == '\n') break;
      if (value != ' ' && !(value >= '0' && value <= '9') &&
          !(value >= 'a' && value <= 'f') && !(value >= 'A' && value <= 'F'))
        throw InputError("INPUT_CHARACTER");
      if (line.size() == MaxLineBytes) throw InputError("INPUT_LINE_LIMIT");
      line.push_back(static_cast<char>(value));
    }
    ++line_;
    std::vector<std::string> tokens;
    std::size_t start = 0;
    while (start < line.size()) {
      const std::size_t end = line.find(' ', start);
      const std::size_t count = (end == std::string::npos ? line.size() : end) - start;
      if (count == 0) throw InputError("INPUT_SPACING");
      tokens.push_back(line.substr(start, count));
      if (tokens.size() > expected) throw InputError("INPUT_ROW_ARITY");
      if (end == std::string::npos) break;
      start = end + 1;
      if (start == line.size()) throw InputError("INPUT_SPACING");
    }
    if (tokens.size() != expected) throw InputError("INPUT_ROW_ARITY");
    return tokens;
  }
  void end() {
    if (source_.peek() != std::char_traits<char>::eof()) throw InputError("INPUT_TRAILING_DATA");
    if (source_.bad()) throw InputError("INPUT_IO_FAILURE");
  }
  std::size_t nextLine() const { return line_ + 1; }
 private:
  std::istream& source_;
  std::size_t line_ = 0, bytes_ = 0;
};

std::size_t decimal(const std::string& token, std::size_t maximum) {
  if (token.empty() || (token.size() > 1 && token[0] == '0'))
    throw InputError("INPUT_DECIMAL_FORM");
  std::size_t value = 0;
  for (const char c : token) {
    if (c < '0' || c > '9') throw InputError("INPUT_DECIMAL_FORM");
    const std::size_t digit = static_cast<std::size_t>(c - '0');
    if (digit > maximum || value > (maximum - digit) / 10)
      throw InputError("INPUT_INTEGER_RANGE");
    value = value * 10 + digit;
  }
  return value;
}

Kernel::FT coordinate(const std::string& token) {
  if (token.size() != 16) throw InputError("INPUT_HEX_WIDTH");
  std::uint64_t bits = 0;
  for (const char c : token) {
    unsigned digit;
    if (c >= '0' && c <= '9') digit = static_cast<unsigned>(c - '0');
    else if (c >= 'a' && c <= 'f') digit = static_cast<unsigned>(c - 'a' + 10);
    else if (c >= 'A' && c <= 'F') digit = static_cast<unsigned>(c - 'A' + 10);
    else throw InputError("INPUT_HEX_FORM");
    bits = (bits << 4) | digit;
  }
  if (((bits >> 52) & 0x7ffu) == 0x7ffu) throw InputError("INPUT_NONFINITE_COORDINATE");
  double value;
  std::memcpy(&value, &bits, sizeof(value));
  // No arithmetic, decimal parsing, Float32 cast or local-frame conversion.
  // EPECK's number constructor preserves the represented finite double exactly.
  Kernel::FT exactValue(value);
  (void)CGAL::exact(exactValue);  // Materialize its exact value before predicates.
  return exactValue;
}

// Copies made by the CGAL output-iterator API share this one bounded collector.
struct PairState {
  Mesh::Property_map<Face, Id> original;
  Result& result;
};
class PairOutput {
 public:
  using iterator_category = std::output_iterator_tag;
  using value_type = void;
  using difference_type = std::ptrdiff_t;
  using pointer = void;
  using reference = void;
  explicit PairOutput(PairState& state) : state_(&state) {}
  PairOutput& operator*() { return *this; }
  PairOutput& operator++() { return *this; }
  PairOutput operator++(int) { return *this; }
  PairOutput& operator=(const std::pair<Face, Face>& faces) {
    auto& r = state_->result;
    if (r.intersections.size() == MaxDetails) {
      r.intersectionLowerBound = MaxDetails + 1;
      throw DetailLimit{};
    }
    Id a = state_->original[faces.first], b = state_->original[faces.second];
    if (b < a) std::swap(a, b);
    r.intersections.emplace_back(a, b);
    r.intersectionLowerBound = r.intersections.size();
    return *this;
  }
 private:
  PairState* state_;
};

void inspect(Result& r) {
  Input input(std::cin);
  r.line = input.nextLine();
  const auto header = input.row(2);
  r.vertices = decimal(header[0], MaxVertices);
  r.triangles = decimal(header[1], MaxTriangles);
  if (r.vertices == 0 || r.triangles == 0) throw InputError("INPUT_EMPTY_MESH");
  if (32 + 24 * r.vertices + 12 * r.triangles > MaxBinaryBytes)
    throw InputError("INPUT_BINARY_LIMIT");
  std::vector<Point> points;
  points.reserve(r.vertices);
  for (std::size_t i = 0; i < r.vertices; ++i) {
    r.line = input.nextLine();
    const auto tokens = input.row(3);
    const auto x = coordinate(tokens[0]), y = coordinate(tokens[1]), z = coordinate(tokens[2]);
    points.emplace_back(x, y, z);
  }
  std::vector<Triangle> triangles;
  triangles.reserve(r.triangles);
  for (std::size_t i = 0; i < r.triangles; ++i) {
    r.line = input.nextLine();
    const auto tokens = input.row(3);
    triangles.push_back({static_cast<Id>(decimal(tokens[0], r.vertices - 1)),
                         static_cast<Id>(decimal(tokens[1], r.vertices - 1)),
                         static_cast<Id>(decimal(tokens[2], r.vertices - 1))});
  }
  r.line = input.nextLine();
  input.end();
  r.line = 0;
  r.inputComplete = true;

  Mesh mesh;
  std::vector<Mesh::Vertex_index> vertices;
  vertices.reserve(points.size());
  auto originalVertex = mesh.add_property_map<Mesh::Vertex_index, Id>("v:input-id", 0).first;
  for (std::size_t i = 0; i < points.size(); ++i) {
    const auto vertex = mesh.add_vertex(points[i]);
    vertices.push_back(vertex);
    originalVertex[vertex] = static_cast<Id>(i);
  }
  auto original = mesh.add_property_map<Face, Id>("f:input-id", 0).first;
  for (std::size_t i = 0; i < triangles.size(); ++i) {
    const auto& t = triangles[i];
    const bool repeated = t[0] == t[1] || t[0] == t[2] || t[1] == t[2];
    if (CGAL::collinear(points[t[0]], points[t[1]], points[t[2]])) {
      ++r.degenerateCount;
      if (r.degenerate.size() < MaxDetails) r.degenerate.push_back(static_cast<Id>(i));
    }
    const auto face = repeated ? Mesh::null_face() :
      mesh.add_face(vertices[t[0]], vertices[t[1]], vertices[t[2]]);
    if (face == Mesh::null_face()) {
      ++r.insertionFailureCount;
      if (r.insertionFailures.size() < MaxDetails)
        r.insertionFailures.push_back({static_cast<Id>(i),
                                      repeated ? "REPEATED_VERTEX_INDEX" : "FACE_INSERTION_REJECTED"});
    } else {
      original[face] = static_cast<Id>(i);
      auto halfedge = mesh.halfedge(face);
      Triangle actual;
      for (std::size_t k = 0; k < 3; ++k) {
        actual[k] = originalVertex[mesh.source(halfedge)];
        halfedge = mesh.next(halfedge);
      }
      bool same = false;
      for (std::size_t shift = 0; shift < 3; ++shift)
        same = same || (actual[0] == t[shift] && actual[1] == t[(shift + 1) % 3] &&
                        actual[2] == t[(shift + 2) % 3]);
      if (!same || halfedge != mesh.halfedge(face))
        throw std::runtime_error("INSERTED_FACE_IDENTITY_CHANGED");
    }
  }
  r.faceCensusComplete = true;
  if (r.insertionFailureCount != 0) {
    r.status = "FAIL"; r.reason = "FACE_INSERTION_REJECTED";
    return;  // Never report properties of this incomplete graph as input properties.
  }
  r.validGraph = CGAL::is_valid_polygon_mesh(mesh);
  r.graphChecked = true;
  if (!r.validGraph) {
    r.status = "FAIL"; r.reason = "INVALID_COMPLETE_GRAPH";
    return;
  }
  r.triangular = CGAL::is_triangle_mesh(mesh);
  r.triangularChecked = true;
  if (!r.triangular || mesh.number_of_faces() != r.triangles ||
      mesh.number_of_vertices() != r.vertices) {
    r.status = "FAIL"; r.reason = "INVALID_COMPLETE_GRAPH";
    return;
  }
  r.closed = CGAL::is_closed(mesh);
  const auto component = mesh.add_property_map<Face, std::size_t>("f:component", 0).first;
  r.componentCount = PMP::connected_components(mesh, component);
  r.componentsChecked = true;
  std::vector<Component> allComponents(r.componentCount,
    {std::numeric_limits<Id>::max(), 0});
  for (const auto face : mesh.faces()) {
    auto& summary = allComponents[component[face]];
    summary.firstFace = std::min(summary.firstFace, original[face]);
    ++summary.faces;
  }
  std::sort(allComponents.begin(), allComponents.end(),
    [](const Component& a, const Component& b) { return a.firstFace < b.firstFace; });
  r.components.assign(allComponents.begin(),
    allComponents.begin() + std::min(MaxDetails, allComponents.size()));
  if (r.degenerateCount != 0) {
    r.status = "FAIL"; r.reason = "EXACT_DEGENERATE_FACE";
    return;
  }
  PairState pairs{original, r};
  try {
    PMP::self_intersections<CGAL::Sequential_tag>(mesh, PairOutput(pairs));
    r.intersectionsComplete = true;
    r.intersectionStatus = r.intersections.empty() ? "PASS" : "FAIL";
  } catch (const DetailLimit&) {
    r.intersectionStatus = "RESOURCE_LIMIT";
    r.status = "RESOURCE_LIMIT"; r.reason = "INTERSECTION_DETAIL_LIMIT";
  }
  std::sort(r.intersections.begin(), r.intersections.end());
  if (!r.intersectionsComplete) return;
  if (!r.intersections.empty()) {
    r.status = "FAIL"; r.reason = "SELF_INTERSECTION";
    return;
  }
  if (!r.closed) {
    r.status = "FAIL"; r.reason = "OPEN_BOUNDARY";
    return;
  }
  // Required documented prerequisites all established on the complete input:
  // valid triangular graph, closed, no degenerate face, no self-intersection.
  r.boundsVolume = PMP::does_bound_a_volume(mesh);
  r.volumeChecked = true;
  r.volumeStatus = r.boundsVolume ? "PASS" : "FAIL";
  r.status = r.boundsVolume ? "PASS" : "FAIL";
  r.reason = r.boundsVolume ? "GEOMETRIC_CHECKS_COMPLETED" : "DOES_NOT_BOUND_VOLUME";
}

const char* boolean(bool value) { return value ? "true" : "false"; }
void write(const Result& r) {
  std::ostringstream out;
  out.exceptions(std::ios::badbit | std::ios::failbit);
  out << "{\"version\":1,\"adapter\":\"codi-cgal-raw-mesh-v1\","
      << "\"scope\":\"geometric-validity-only\",\"cgalVersion\":\"" << CGAL_VERSION_STR
      << "\",\"status\":\"" << r.status << "\",\"reason\":\"" << r.reason << "\","
      << "\"input\":{\"vertices\":" << r.vertices << ",\"triangles\":" << r.triangles
      << ",\"complete\":" << boolean(r.inputComplete) << ",\"errorLine\":";
  if (r.line) out << r.line; else out << "null";
  out << "},\"limits\":{\"vertices\":" << MaxVertices << ",\"triangles\":" << MaxTriangles
      << ",\"binaryBytes\":" << MaxBinaryBytes << ",\"textBytes\":" << MaxTextBytes
      << ",\"lineBytes\":" << MaxLineBytes << ",\"detailsPerList\":" << MaxDetails
      << ",\"outputBytes\":" << MaxOutputBytes << "},\"degenerateFaces\":{\"count\":"
      << r.degenerateCount << ",\"scanComplete\":" << boolean(r.faceCensusComplete)
      << ",\"complete\":" << boolean(r.faceCensusComplete && r.degenerateCount == r.degenerate.size())
      << ",\"ids\":[";
  for (std::size_t i = 0; i < r.degenerate.size(); ++i) { if (i) out << ','; out << r.degenerate[i]; }
  out << "]},\"insertionFailures\":{\"count\":" << r.insertionFailureCount
      << ",\"scanComplete\":" << boolean(r.faceCensusComplete)
      << ",\"complete\":" << boolean(r.faceCensusComplete && r.insertionFailureCount == r.insertionFailures.size()) << ",\"rows\":[";
  for (std::size_t i = 0; i < r.insertionFailures.size(); ++i) {
    if (i) out << ',';
    out << "{\"faceId\":" << r.insertionFailures[i].face << ",\"reason\":\""
        << r.insertionFailures[i].reason << "\"}";
  }
  out << "]},\"graph\":{\"status\":\"" << (!r.graphChecked ? "NOT_RUN" : !r.validGraph ? "FAIL" :
      !r.triangularChecked ? "NOT_RUN" : r.triangular ? "PASS" : "FAIL")
      << "\",\"valid\":" << (r.graphChecked ? boolean(r.validGraph) : "null")
      << ",\"triangular\":" << (r.triangularChecked ? boolean(r.triangular) : "null")
      << ",\"closed\":" << (r.componentsChecked ? boolean(r.closed) : "null")
      << ",\"componentCount\":";
  if (r.componentsChecked) out << r.componentCount; else out << "null";
  out << ",\"componentDetailsComplete\":"
      << boolean(r.componentsChecked && r.components.size() == r.componentCount) << ",\"components\":[";
  for (std::size_t i = 0; i < r.components.size(); ++i) {
    if (i) out << ',';
    out << "{\"firstFaceId\":" << r.components[i].firstFace << ",\"faceCount\":" << r.components[i].faces << '}';
  }
  out << "]},\"selfIntersections\":{\"status\":\"" << r.intersectionStatus
      << "\",\"complete\":" << boolean(r.intersectionsComplete)
      << ",\"countAtLeast\":" << r.intersectionLowerBound << ",\"originalFacePairs\":[";
  for (std::size_t i = 0; i < r.intersections.size(); ++i) {
    if (i) out << ',';
    out << '[' << r.intersections[i].first << ',' << r.intersections[i].second << ']';
  }
  out << "]},\"volumeBoundary\":{\"status\":\"" << r.volumeStatus
      << "\",\"doesBoundAVolume\":" << (r.volumeChecked ? boolean(r.boundsVolume) : "null")
      << "},\"sourceIntent\":\"NOT_RUN\",\"deviationCertificate\":\"NOT_RUN\"}\n";
  const auto text = out.str();
  if (text.size() > MaxOutputBytes) throw DetailLimit{};
  std::cout << text;
  std::cout.flush();
  if (!std::cout) throw std::runtime_error("OUTPUT_IO_FAILURE");
}
}  // namespace

int main(int argc, char**) {
  std::ios::sync_with_stdio(false);
  Result result;
  try {
    if (argc != 1) throw InputError("NO_ARGUMENTS_ACCEPTED");
    inspect(result);
  } catch (const InputError& error) {
    result.status = "INPUT_INVALID"; result.reason = error.what();
    // error.what() is owned by the exception: write while its lifetime is valid.
    try { write(result); } catch (...) { return 3; }
    return 2;
  } catch (const std::bad_alloc&) {
    result.status = "RESOURCE_LIMIT"; result.reason = "ALLOCATION_FAILURE";
  } catch (...) {
    result.status = "ERROR"; result.reason = "CGAL_OR_ADAPTER_EXCEPTION";
  }
  try { write(result); }
  catch (...) { return 3; }  // No successful report on uncertain output settlement.
  return std::strcmp(result.status, "PASS") == 0 ? 0 : 1;
}
